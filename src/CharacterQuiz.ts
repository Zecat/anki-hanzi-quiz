import HanziWriter from "hanzi-writer";

import { Component, register, html, css } from 'pouic'
import { state } from "./state"

//import { ComponentDefinition } from "./HanziDesc";

import { fetchCharacter } from "./fetchCharacter";
import { getComponentAbsoluteFirstIndex, getComponentAbsoluteIndexes, InteractiveCharacter, strokeIdxToCmp } from "./InteractiveCharacter";

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
    //await this.updateComplete;
    const target = this.shadowRoot;

    this.hanziWriter = HanziWriter.create(
      <HTMLElement>(<unknown>target),
      hanzi,
      {
        //strokeFadeDuration: 0,
        charDataLoader: (char, onComplete) => { fetchCharacter(char).then(onComplete) },
        showCharacter: false,
        showHintAfterMisses: 1,
        highlightOnComplete: false,
        showOutline: false,
        onMistake: this.onMistake.bind(this),
        onCorrectStroke: this.onCorrectStroke.bind(this),
        padding: 10,
drawingFadeDuration: 1000,
strokeHighlightDuration: 1000,
strokeFadeDuration: 500,
        //renderer: "canvas",
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

  mistakeCheck(cmp: InteractiveCharacter): boolean {
    if (cmp.mistakeCount >= 3) {
      state.resetComponentMistakes(cmp)
      this.ignoreMistake = true
      // Wait a bit so the final stroke can be seen before requizing
      setTimeout(() => {
        const firstIdx = getComponentAbsoluteFirstIndex(cmp)
        this.startQuiz(firstIdx);
        this.ignoreMistake = false

        state.lastFirstOrderCmp = undefined
      }, 600)
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
        }, 300)
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
  onCorrectStroke(strokeData: any): void {
    if (!this.hanziWriter || !this.hanzicomponent)
      return
    const strokeIdx = strokeData.strokeNum;
    const cmp = strokeIdxToCmp(this.hanzicomponent, strokeIdx);
    this.onCorrectStrokeForCmpRec(strokeIdx, cmp)

    //const svg = this.shadowRoot.querySelector('svg[width] > g')

    const pathEl = this.shadowRoot.querySelector('svg[width] > g > *:last-child')
    //const points = this.hanziWriter?._quiz?._userStroke?.points
    let points = strokeData.drawnPath.points
    if (!points) return

    points = points.map((p:any) => [p.x, p.y])

    const medians = ((this.hanzicomponent as any).__target as InteractiveCharacter).data.medians
    if (!medians) return
    const median = medians[strokeIdx]

    const newPoints = this.interpolatePath(median,points)

    //svg.removeChild(pathEl)
    //svg.insertBefore(pathEl, svg.firstChild);
    let newPath = `M ${newPoints[0][0]} ${newPoints[0][1]} `
    setTimeout(() => {

    newPoints.slice(1).forEach((p:any)=>{
     newPath += `L ${p[0]} ${p[1]}`
    })
    pathEl.setAttribute('d', newPath)
    pathEl.toggleAttribute('validated', true)
    },0)
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
        stroke: #00000020 !important;
        stroke-width: 40px !important;
stroke-linejoin:round;/*TODO probably useless*/
transition: 1s ease-out;
opacity: 1;
}

      svg > g > path[validated] {
        stroke-width: 30px !important;
opacity: 0.5;

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
