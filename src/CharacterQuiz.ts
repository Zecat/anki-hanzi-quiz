import HanziWriter from "hanzi-writer";

import { Component, register, html, css } from 'pouic'
//import {
//  css,
//  html,
//  LitElement,
//  TemplateResult,
//  CSSResultGroup,
//} from "lit-element";
//
//import { when } from "lit/directives/when.js";
//import { customElement, property } from "lit/decorators.js";

import {state} from "./state"
import { getComponentAtStrokeIdx } from "./HanziDesc";

import { ComponentDefinition } from "./HanziDesc";

/*
 * This element
 *  - initiates hanzi writer
 *  - exposes hanzi writer
 *  - handle resize
 *  - draws a background sheet
 *  - handle hanzi changes
 */
export default class CharacterQuiz extends Component {
  //@property({ type: String })
  //hanzi = "";

  //@property({ type: Boolean })
  backboard = false;

  //@property({ type: Boolean })
  active = false;

  //@property({ type: Object })
  options = {};

  //@property({ type: Object })
  hanzicomponent?: ComponentDefinition;

  //@property({ type: Number })
  cmpMistakeThreshold = 2;

  hanziWriter: HanziWriter | undefined;

  quizStarted= false

  //static observers = {
  //  strokesVisible: (newValue: boolean) =>{
  //    console.log(this, "!!!",this.hanziWriter)
  //    newValue ? this.hanziWriter?.showOutline() : this.hanziWriter?.hideOutline()},
  //}

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
      //setTimeout(() => {
      this.createHanziWriter(newValue)

     this.startQuiz() // TODO security if hanziWriter not yet created
//},500)
    }
   //if (name == "active" && newValue != null && !this.quizStarted) {
   //  this.startQuiz() // TODO security if hanziWriter not yet created
   //  this.quizStarted = true
   //}

    //if (!this.complete && this.isPropBecomingTrue("active", newValue)) this.startQuiz();
  }

  //isPropBecomingTrue(
  //  propName: string,
  //  newValue,
  //) {
  //  if (changedProperties.has(propName)) {
  //    const oldValue = changedProperties.get(propName) as boolean;
  //    const newValue = Reflect.get(this, propName);
  //    console.log(oldValue, newValue)
  //    if (!oldValue && newValue) return true;
  //  }
  //  return false;
  //}

  //updated(changedProperties: Map<string, unknown>) {
  //}

  createHanziWriter(hanzi: string): HanziWriter {
    //await this.updateComplete;
    const target = this.shadowRoot;

    //state.toto = `yo from ${hanzi}, ${state.hanziData.length}, ${Object.keys(state.hanziData[0])}`
    this.hanziWriter = HanziWriter.create(
      <HTMLElement>(<unknown>target),
      hanzi,
      {
        showCharacter: false,
        showHintAfterMisses: 1,
        highlightOnComplete: false,
        showOutline: false,
        ...this.options,
        //onLoadCharDataSuccess: () => console.log("success"),
      },
    );

    //const resizeObserver = new ResizeObserver((entries) => {
    //  for (const entry of entries) {
    //    const cr = entry.contentRect;

    //    // TODO prevent calling on first render ?
    //    this.hanziWriter?.updateDimensions({
    //      width: cr.width,
    //      height: cr.height,
    //    });
    //  }
    //});

    //resizeObserver.observe((this.shadowRoot as ShadowRoot).host);

    return this.hanziWriter;
  }

  strokeIdxToCmp(strokeIdx: number) {
    if (!this.hanzicomponent) throw new Error("No component specified");
    //const charData = this.hanziData[this.nextCharIdx-1]
    const cmp = getComponentAtStrokeIdx(
      strokeIdx,
      this.hanzicomponent.matches,
      this.hanzicomponent,
    );
    return cmp;
  }

  startQuiz(quizStartStrokeNum: number = 0) {
    if (!this.hanziWriter) return;

    //this.hanzicomponent.complete = false

    this.hanziWriter.quiz({
      onMistake: this.onMistake.bind(this),
      onCorrectStroke: this.onCorrectStroke.bind(this),
      quizStartStrokeNum,
    });

  }

  onCorrectStroke(strokeData: any): void {
    const strokeIdx = strokeData.strokeNum;
    const cmp = this.strokeIdxToCmp(strokeIdx);
    if (cmp.mistakeCount >= this.cmpMistakeThreshold) {
      cmp.mistakeCount = 0;
      this.startQuiz(cmp.firstIdx);
    } else if (this.hanzicomponent && strokeIdx == this.hanzicomponent.lastIdx) {
      state.currentComponent.complete = true // TODO this is weird
    }
  }

  onMistake(strokeData: any): void {
    // TODO typing
    const cmp = this.strokeIdxToCmp(strokeData.strokeNum);
    state.rating = state.rating -1;
    cmp.mistakeCount++;
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
