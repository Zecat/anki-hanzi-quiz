import HanziWriter from "hanzi-writer";


import { Component, register, html, css } from 'pouic'
import { state } from "./state"
import { fetchCharacter } from "./fetchCharacter";
import { getComponentAbsoluteFirstIndex, getComponentAbsoluteIndexes, InteractiveCharacter, strokeIdxToCmp } from "./InteractiveCharacter";
import simplifySvgPath from '@luncheon/simplify-svg-path'

import { Bezier } from 'bezier-js'
import { computeRepartition2, makeUniform } from "./uniformPath";
import { absolutize, parsePath } from "path-data-parser";
import { Segment } from "path-data-parser/lib/parser";
type Point = { x: number, y: number };
type Cubic = [number, number, number, number, number, number, number, number]
type Cubic6 = [number, number, number, number, number, number]


/*
 * This element
 *  - initiates hanzi writer
 *  - exposes hanzi writer
 *  - handle resize
 *  - draws a background sheet
 *  - handle hanzi changes
 */
export default class CharacterQuiz extends Component {
  backboard = false;

  active = false;

  options = {};

  hanzicomponent?: InteractiveCharacter;

  cmpMistakeThreshold = 2;
  lastMistakeStrokeNum = -1
  ignoreMistake = false
  hanziWriter: HanziWriter | undefined;

  quizStarted = false

  static get observedAttributes() {
    return ['character', 'active', 'strokes-visible'];
  }

  attributeChangedCallback(name: string, _: string, newValue: string | null) {
    if (newValue && newValue[0] == "{")
      return
    if (name == "strokes-visible") {
      newValue != null ? this.hanziWriter?.showOutline() : this.hanziWriter?.hideOutline()
    }
    if (name === 'character' && newValue != null) {
      this.createHanziWriter(newValue)

      //this.startQuiz() // TODO security if hanziWriter not yet created
    }
    if (name == "active" && newValue != null && !this.quizStarted) {
      this.startQuiz() // TODO security if hanziWriter not yet created
      this.quizStarted = true
    }

  }

  createHanziWriter(hanzi: string): HanziWriter {
    const target = this.shadowRoot;

    this.hanziWriter = HanziWriter.create(
      <HTMLElement>(<unknown>target),
      hanzi,
      {
        charDataLoader: (char, onComplete) => { fetchCharacter(char).then(onComplete) },
        showCharacter: false,
        showHintAfterMisses: 1,
        highlightOnComplete: false,
        showOutline: false,
        onMistake: this.onMistake.bind(this),
        onCorrectStroke: this.onCorrectStroke.bind(this),
        padding: 10,
        drawingFadeDuration: 1000,
        strokeHighlightDuration: 600,
        strokeFadeDuration: 0,
        ...this.options,
      },
    );

    state.hanziWriters[hanzi] = this.hanziWriter

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;

        // TODO prevent calling on first render ?
        this.hanziWriter?.updateDimensions({
          width: cr.width,
          height: cr.height,
        });
      }
    });

    resizeObserver.observe((this.shadowRoot as ShadowRoot).host);
    //Reflect.set(this.hanziWriter, "startQuiz",this.startQuiz)
    //this.hanziWriter.quiz = this.startQuiz

    //this.hanziWriter.quiz = ({
    //  onMistake: this.onMistake.bind(this),
    //  onCorrectStroke: this.onCorrectStroke.bind(this),
    //  quizStartStrokeNum,
    //});
    const svg = this.hanziWriter.target.node
    const updateTouchstart = (() => { this.touchstart = performance.now() }).bind(this)
    const updateDrawingDuration = (() => { this.drawingDuration = (performance.now() - this.touchstart) / 1000 * 3; }).bind(this)
    svg.addEventListener('touchstart', updateTouchstart);
    svg.addEventListener('mousedown', updateTouchstart);
    svg.addEventListener('touchend', updateDrawingDuration);
    svg.addEventListener('mouseup', updateDrawingDuration);
    return this.hanziWriter;
  }

  startQuiz(quizStartStrokeNum: number = 0) {
    if (!this.hanziWriter) return;
    const c = state.getCurrentHanziWriter()
    let tmpDuration: number
    if (quizStartStrokeNum && c) {
      tmpDuration = c._options.strokeFadeDuration
      c._options.strokeFadeDuration = 0
    }

    this.hanziWriter.quiz({
      quizStartStrokeNum,
      leniency: 1.45
    });

    setTimeout(() => {
      const c = state.getCurrentHanziWriter()
      if (quizStartStrokeNum && c)
        c._options.strokeFadeDuration = tmpDuration
    }, 0)


  }


  checkCompleteRec(cmp: any) {
    const parent = cmp.parent

    if (!parent)
      return
    if (parent.components.every((cmp: any) => cmp.complete))
      parent.complete = true
    this.checkCompleteRec(parent)
  }

  cmpFadeOut(cmp: InteractiveCharacter) {
    const [firstIdx, lastIdx] = getComponentAbsoluteIndexes(cmp)
    const allPaths = [...this.shadowRoot.querySelectorAll(`svg[width] > g > :nth-child(2) > *`)]
    const cmpPaths = allPaths.slice(firstIdx, lastIdx + 1)

    const animations = cmpPaths.map((el, i) => {
      // Start the vibration animation
      const vibration = el.animate({
        transform: [
          'translate(0, 0)',
          'translate(-2px, 2px)',
          'translate(2px, -2px)',
          'translate(-2px, 2px)',
          'translate(2px, -2px)',
          'translate(0, 0)'
        ]
      }, {
        delay: 100 * i,
        duration: 300,
        iterations: 3
      });

      // Once the vibration animation finishes, start the fade-out animation
      return vibration.finished.then(() => {
        return el.animate({
          opacity: [1, 0]
        }, {
          duration: 300,
        }).finished.then(() => el.style.opacity = '0'); // manually hide the element as fill: 'forwards' seem to take over anything
      });
    })
    return Promise.all(animations)
  }

  mistakeCheck(cmp: InteractiveCharacter): boolean {
    if (cmp.mistakeCount >= 3) {
      this.cmpFadeOut(cmp).then(() => {
        const firstIdx = getComponentAbsoluteFirstIndex(cmp)
        this.startQuiz(firstIdx);
        this.ignoreMistake = false

        state.lastFirstOrderCmp = undefined
      })

      state.resetComponentMistakes(cmp)
      this.ignoreMistake = true

      return false
    }
    return true
  }

  hasIntermediateCmpParent(cmp: InteractiveCharacter): boolean {
    if (!cmp.parent)
      return false
    if (!cmp.parent.data.pinyin || !cmp.parent.data.definition) {
      return this.hasIntermediateCmpParent(cmp.parent)
    }
    return true
  }

  isFirstOrderCmp(cmp: InteractiveCharacter): boolean {
    if (!cmp.data.pinyin || !cmp.data.definition)
      return false
    if (cmp.parent && !cmp.parent.parent)
      return true
    return this.hasIntermediateCmpParent(cmp)
  }

  onCorrectStrokeForCmpRec(strokeIdx: number, cmp: InteractiveCharacter) {

    const cmpNoProxy = (cmp as any).__target as InteractiveCharacter // HACK
    const [_, lastIdx] = getComponentAbsoluteIndexes(cmpNoProxy)
    const isCmpComplete = strokeIdx == lastIdx

    if (isCmpComplete) {
      if (!this.mistakeCheck(cmpNoProxy))
        return false

      if (this.isFirstOrderCmp(cmp)) {
        state.lastFirstOrderCmp = cmp;
      }
      if (!cmp.parent || this.onCorrectStrokeForCmpRec(strokeIdx, cmp.parent)) {
        cmp.complete = true // TODO this is weird
        //this.checkCompleteRec(cmp)
        // HACK trigger proxy update
        if (state.currentComponent.complete)
          state.currentComponent.complete = true

        setTimeout(() => {
          const a: any = document.querySelector('#hanziquiz')
          a.decomposeCharacter()
          // HACK show definition when character finished drawing
        }, this.drawingDuration * 1000)
        return true
      }
    }
    return false
  }

  calculateCumulativeDistances(path: [number, number][]): number[] {
    const distances: number[] = path.map((point, index, array) => {
      if (index === 0) return 0;
      const dx = point[0] - array[index - 1][0];
      const dy = point[1] - array[index - 1][1];
      return Math.sqrt(dx * dx + dy * dy);
    });
    return distances.reduce((acc: number[], dist) => {
      acc.push((acc.length > 0 ? acc[acc.length - 1] : 0) + dist);
      return acc;
    }, []);
  }

  interpolatePath(pathA: [number, number][], pathB: [number, number][]): [number, number][] {
    const cumulativeDistA = this.calculateCumulativeDistances(pathA);
    const cumulativeDistB = this.calculateCumulativeDistances(pathB);

    const totalDistA = cumulativeDistA[cumulativeDistA.length - 1];
    const totalDistB = cumulativeDistB[cumulativeDistB.length - 1];

    const normalizedDistA = cumulativeDistA.map(d => d / totalDistA);
    const normalizedDistB = cumulativeDistB.map(d => d / totalDistB);

    const interpolate = (t: number, dist: number[], values: number[]): number => {
      for (let i = 1; i < dist.length; i++) {
        if (t <= dist[i]) {
          const t0 = dist[i - 1], t1 = dist[i];
          const v0 = values[i - 1], v1 = values[i];
          return v0 + (v1 - v0) * (t - t0) / (t1 - t0);
        }
      }
      return values[values.length - 1];
    };

    const interpolateX = (t: number) => interpolate(t, normalizedDistA, pathA.map(point => point[0]));
    const interpolateY = (t: number) => interpolate(t, normalizedDistA, pathA.map(point => point[1]));

    return normalizedDistB.map(t => [interpolateX(t), interpolateY(t)]);
  }

  convertArrayToSVGPath(p: Cubic): string {
    return `M ${p[0]} ${p[1]} C ${p[2]} ${p[3]}, ${p[4]} ${p[5]}, ${p[6]} ${p[7]} `
  }

  convertArrayToSVGPathPartial(p: Cubic6): string {
    return `C ${p[0]} ${p[1]} ${p[2]} ${p[3]}, ${p[4]} ${p[5]} `
  }

  convertBezierArrayToSVGPath(bezierArray: any[]): string {
    let svgPath = '';

    const p = bezierArray[0].points[0];
    svgPath += `M ${+p.x.toFixed(2)},${+p.y.toFixed(2)}`;
    bezierArray.forEach(bezier => {
      const p = bezier.points.map((p: { x: number, y: number }) => ({ x: +p.x.toFixed(2), y: +p.y.toFixed(2) }))
      svgPath += `C ${p[1].x},${p[1].y} ${p[2].x},${p[2].y} ${p[3].x},${p[3].y}`;
    });

    return svgPath;
  }

  convertBezierArrayToSVGPath2(bezierArray: any[]): string {
    let svgPath = '';

    bezierArray.forEach(bezier => {
      const p = bezier.points
      svgPath += `C ${p[1].x},${p[1].y} ${p[2].x},${p[2].y} ${p[3].x}, ${p[3].y} `;
    });

    return svgPath;
  }

  //convertBezierArrayToCubicArray(bezierArray: any[]): string {
  //    let svgPath = '';
  //
  //      const p = bezierArray[0].points[0];
  //      svgPath += `M ${p.x} ${p.y} `;
  //    bezierArray.forEach(bezier => {
  //      const p = bezier.points
  //      svgPath += `C ${p[1].x} ${p[1].y}, ${p[2].x} ${p[2].y},  ${p[3].x} ${p[3].y}`;
  //    });
  //
  //    return svgPath;
  //}
  convertToSVGPath(bezierCurves: [number, number][]): string {
    if (bezierCurves.length === 0) return '';

    const commands: string[] = [];
    const [startX, startY] = bezierCurves[0];

    commands.push(`M ${startX} ${startY}`);

    for (let i = 1; i < bezierCurves.length; i += 3) {
      if (i + 2 >= bezierCurves.length) break;

      const [cp1x, cp1y] = bezierCurves[i];
      const [cp2x, cp2y] = bezierCurves[i + 1];
      const [x, y] = bezierCurves[i + 2];

      commands.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`);
    }

    return commands.join(' ');
  }
  convertToCubicBezierCurves(points: [number, number][]): [number, number, number, number, number, number, number, number][] {
    //if (points.length < 4 || points.length % 4 !== 0) {
    //    throw new Error('Invalid number of points to form cubic Bezier curves.');
    //}

    const cubicBezierCurves: [number, number, number, number, number, number, number, number][] = [];

    for (let i = 0; i + 3 < points.length; i += 3) {
      cubicBezierCurves.push([
        points[i][0], points[i][1],
        points[i + 1][0], points[i + 1][1],
        points[i + 2][0], points[i + 2][1],
        points[i + 3][0], points[i + 3][1]
      ]);
    }

    return cubicBezierCurves;
  }
  approximateHalfCircle(A: [number, number], B: [number, number]): [number, number][] {
    // Calculate the midpoint of the diameter
    const midpointX = (A[0] + B[0]) / 2;
    const midpointY = (A[1] + B[1]) / 2;

    // Calculate the radius of the circle
    const radius = Math.sqrt((B[0] - A[0]) ** 2 + (B[1] - A[1]) ** 2) / 2;

    // Control point adjustments
    const adjustment = radius * (4 / 3);

    // Control points for the first curve
    const cp1x1 = A[0] + adjustment;
    const cp1y1 = A[1];
    const cp2x1 = midpointX;
    const cp2y1 = A[1] + adjustment;

    // Control points for the second curve
    const cp1x2 = midpointX;
    const cp1y2 = B[1] - adjustment;
    const cp2x2 = B[0] - adjustment;
    const cp2y2 = B[1];

    return [
      //A,
      [cp1x1, cp1y1],
      [cp2x1, cp2y1],
      [midpointX, midpointY],
      [cp1x2, cp1y2],
      [cp2x2, cp2y2],
      B
    ];
  }
  createHalfCircleBezier(start: Point, end: Point): [Point, Point] {

    // Calculate the vector from start to end
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Calculate the length of the vector
    const length = Math.sqrt(dx * dx + dy * dy);

    // Calculate the radius of the semicircle
    const radius = length / 2;

    // Calculate the angle of the vector
    const angle = Math.atan2(dy, dx);

    // Calculate the control points using the radius and perpendicular vectors
    const control1X = start.x + radius * Math.sin(angle);
    const control1Y = start.y - radius * Math.cos(angle);
    const control2X = end.x + radius * Math.sin(angle);
    const control2Y = end.y - radius * Math.cos(angle);

    const control1: Point = { x: control1X, y: control1Y };
    const control2: Point = { x: control2X, y: control2Y };

    return [control1, control2];
  }


  invertBezierArr(bezArr: any) {
    const rArr = [...bezArr].reverse()
    return rArr.map(b => {
      const p = [...b.points].reverse()
      return new Bezier(p)
    })
  }

  segmentsToValues(segs: Segment[]): Cubic[] {
    if (segs[0].key != 'M')
      throw new Error('err')
    const values: Cubic[] = []
    for (let i = 1; i < segs.length; i++) {
      const a = segs[i - 1].data.slice(-2) as [number, number]
      if (a.length != 2)
        throw new Error('err')
      const b = segs[i].data as [number, number, number, number, number, number]
      if (b.length != 6)
        throw new Error('err')
      const data: Cubic = [...a, ...b]
      if (data.length != 8)
        throw new Error('err')
      values.push(data as Cubic)
    }
    return values
  }

  getDrawnPointsMorph(points: any, fStrokes: any, fRep: any) {
    const bStr = simplifySvgPath(points, {
      closed: false,
      tolerance: 50,
      precision: 2,
    })
    const paths = absolutize(parsePath(bStr))

    const d0 = paths[0].data
    const d1 = paths[1].data

    // Prevent the control point from being exactly on the point as this causes problem with Bezier offset function
    if (d0[0] === d1[0] && d0[1] === d1[1]) {
      d1[0] = (d1[0] + d1[2]) / 2
      d1[1] = (d1[1] + d1[3]) / 2
    }

    const dl = paths[paths.length - 1].data
    const dbl = paths[paths.length - 1].data.slice(-2) // The [x,y] component of the previous segment tip position - either M or C -
    if (dl[4] === dl[2] && dl[5] === dl[3]) {
      dl[2] = (dl[4] + dbl[0]) / 2
      dl[3] = (dl[5] + dbl[1]) / 2
    }

    const segs = this.segmentsToValues(paths)

    const bezs = segs.map(seg => new Bezier(...seg))
    const left: Bezier[] = bezs.map(b => b.offset(-30) as Bezier[]).flat()
    const right: Bezier[] = bezs.map(b => b.offset(30) as Bezier[]).flat()

    let lLast = left[left.length - 1].points[3]
    let lFirst = left[0].points[0]
    let rLast = right[right.length - 1].points[3]
    let rFirst = right[0].points[0]

    const d = this.createHalfCircleBezier(lLast, rLast)
    const e = this.createHalfCircleBezier(rFirst, lFirst)
    const topCap: Cubic6 = [d[0].x, d[0].y, d[1].x, d[1].y, rLast.x, rLast.y]
    const botCap: Cubic = [rFirst.x, rFirst.y, e[0].x, e[0].y, e[1].x, e[1].y, lFirst.x, lFirst.y]

    const rInvert = this.invertBezierArr(right)

    const topCapPath = this.convertArrayToSVGPathPartial(topCap)
    const botCapPath = this.convertArrayToSVGPath(botCap)

    const path = botCapPath + this.convertBezierArrayToSVGPath2(left) + topCapPath + this.convertBezierArrayToSVGPath2(rInvert) + ' Z'
    const iStrokes = path // TODO cleanup
    const iRep = computeRepartition2(iStrokes, left.length, 0.5, 1 + left.length, 0.5)

    const morph = makeUniform(
      iStrokes, iRep,
      fStrokes, fRep,
    )
    return morph
  }

  applyDrawingMorph(strokeIdx: number, morph: any) {
    const el = this.shadowRoot.querySelector(`svg[width] > g > :nth-child(2) > :nth-child(${strokeIdx + 1})`)
    if (!el) throw new Error('err')
    const cp = el.getAttribute('clip-path')
    el.setAttribute('stroke-width', 2000)
    const match = cp.match(/#mask-\d+/);

    if (!match) throw new Error('err')
    const substring = match[0];
    const defPath = this.shadowRoot.querySelector(substring + ' > path')

    el.animate({
      stroke: ['#393939', '#555555']
    }, {
      duration: this.drawingDuration * 1000, easing: 'ease'
    })

    defPath.animate({
      d: [`path('${morph[0]}')`, `path('${morph[1]}')`]
    }, {
      duration: this.drawingDuration * 1000, easing: 'ease'
    })
  }

  onCorrectStroke(strokeData: any): void {
    if (!this.hanziWriter || !this.hanzicomponent)
      return
    const strokeIdx = strokeData.strokeNum;
    const cmp = strokeIdxToCmp(this.hanzicomponent, strokeIdx);
    this.onCorrectStrokeForCmpRec(strokeIdx, cmp)

    const hc = (this.hanzicomponent as any).__target as InteractiveCharacter
    const fData = hc.data

    let points = strokeData.drawnPath.points
    if (!points) return

    if (!fData || !fData.strokes || !fData.repartition) return
    const fStrokes = fData.strokes[strokeIdx]
    const fRep = fData.repartition[strokeIdx]
    const morph = this.getDrawnPointsMorph(points, fStrokes, fRep)
    this.applyDrawingMorph(strokeIdx, morph)

    const drawnPathEl = this.shadowRoot.querySelector('svg[width] > g > path:last-child')
    if (!drawnPathEl) throw new Error('err')
    drawnPathEl.toggleAttribute('validated') // immediately hide the drawn stroke
  }

  incrementMistakeRec(cmp: InteractiveCharacter) {
    cmp.mistakeCount++;
    if (cmp.parent)
      this.incrementMistakeRec(cmp.parent)
  }

  onMistake(strokeData: any): void {
    if (!this.hanzicomponent)
      return
    if (this.ignoreMistake || strokeData.strokeNum === this.lastMistakeStrokeNum) // prevents counting twice the same mistake
      return
    this.lastMistakeStrokeNum = strokeData.strokeNum

    // TODO typing
    const cmp = strokeIdxToCmp(this.hanzicomponent, strokeData.strokeNum);
    state.rating = Math.max(1, state.rating - 1);
    this.incrementMistakeRec(cmp)
  }

  static css = css`
      :host {
        position: relative;
        display: block;
        aspect-ratio: 1;
      }

      :host > * {
        position: absolute;
        top: 0;
        left: 0;
      }

      #grid-background-target {
        width: 100%;
        height: 100%;
        /* border: 1px solid #dfdfdf;*/
      }

      #grid-background-target > line {
        stroke: #f0f0f0;
      }

      svg > g > path {
        stroke: #393939 !important;
        stroke-width: 60px !important;
        stroke-linejoin:round;/*TODO probably useless*/
      }

      svg > g > path[validated] {
        display: none;
      }
    `;

  static template = html`
          <svg
            xmlns="http://www.w3.org/2000/svg"
            id="grid-background-target"
          >
            <line x1="0" y1="0" x2="100%" y2="100%" />
            <line x1="100%" y1="0" x2="0" y2="100%" />
            <line x1="50%" y1="0" x2="50%" y2="100%" />
            <line x1="0" y1="50%" x2="100%" y2="50%" />
          </svg>
    `;
}

register(CharacterQuiz)
