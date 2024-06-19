import HanziWriter from "hanzi-writer";


import { Component, register, html, css } from 'pouic'
import { state } from "./state"
import { fetchCharacter } from "./fetchCharacter";
import { getComponentAbsoluteFirstIndex, getComponentAbsoluteIndexes, InteractiveCharacter, strokeIdxToCmp } from "./InteractiveCharacter";
import { getDrawnPointsMorph } from "./morph/drawingMorph";



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
    const morph = getDrawnPointsMorph(points, fStrokes, fRep)
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
