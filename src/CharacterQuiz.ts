import HanziWriter from "hanzi-writer";

import { Component, register, html, css } from 'pouic'
import {state} from "./state"

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

  quizStarted= false

  static get observedAttributes() {
    return ['character', 'active', 'strokes-visible'];
  }

 attributeChangedCallback(name: string, _: string, newValue:string|null) {
    if (newValue && newValue[0] == "{")
      return
   if (name == "strokes-visible")  {
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
        charDataLoader: (char, onComplete) => {fetchCharacter(char).then(onComplete)},
        showCharacter: false,
        showHintAfterMisses: 1,
        highlightOnComplete: false,
        showOutline: false,
      onMistake: this.onMistake.bind(this),
      onCorrectStroke: this.onCorrectStroke.bind(this),
padding: 0,
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
let tmpDuration:number
    if (quizStartStrokeNum && c) {
      tmpDuration = c._options.strokeFadeDuration
      c._options.strokeFadeDuration = 0
    }

    this.hanziWriter.quiz({
      quizStartStrokeNum,
    });

    setTimeout(() => {
    const c = state.getCurrentHanziWriter()
    if (quizStartStrokeNum && c)
      c._options.strokeFadeDuration = tmpDuration
    },0)


  }


  checkCompleteRec(cmp:any) {
    const parent = cmp.parent

    if(!parent)
      return
    if(parent.components.every((cmp: any) => cmp.complete))
      parent.complete = true
    this.checkCompleteRec(parent)
  }

  mistakeCheck(cmp: InteractiveCharacter): boolean {
    if (cmp.mistakeCount >= 3) {
      state.resetComponentMistakes(cmp)
      this.ignoreMistake = true
      // Wait a bit so the final stroke can be seen before requizing
      setTimeout(()=> {
        const firstIdx = getComponentAbsoluteFirstIndex(cmp)
        this.startQuiz(firstIdx);
        this.ignoreMistake = false
      }, 600)
      return false
    }
    return true
  }

  onCorrectStrokeForCmpRec(strokeIdx:number, cmp:InteractiveCharacter) {

    const cmpNoProxy = (cmp as any).__target as InteractiveCharacter // HACK
    const [_, lastIdx] = getComponentAbsoluteIndexes(cmpNoProxy)
    const isCmpComplete = strokeIdx == lastIdx

    if (isCmpComplete) {
      if (this.mistakeCheck(cmpNoProxy) &&
        (!cmp.parent || this.onCorrectStrokeForCmpRec(strokeIdx, cmp.parent) )){

      cmp.complete = true // TODO this is weird
      //this.checkCompleteRec(cmp)
      // HACK trigger proxy update
      if (state.currentComponent.complete)
        state.currentComponent.complete = true
      return true
      }
    }
    return false
  }

  onCorrectStroke(strokeData: any): void {
    if (!this.hanziWriter || !this.hanzicomponent)
      return
    const strokeIdx = strokeData.strokeNum;
    const cmp = strokeIdxToCmp(this.hanzicomponent,strokeIdx);
    this.onCorrectStrokeForCmpRec(strokeIdx, cmp)

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
    const cmp = strokeIdxToCmp(this.hanzicomponent,strokeData.strokeNum);
    state.rating = Math.max(1, state.rating-1);
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
