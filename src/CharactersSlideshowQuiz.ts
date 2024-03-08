import { Component, register, html, css } from 'pouic'

import "./CharacterQuiz";
import CharacterQuiz from "./CharacterQuiz";

import {state} from "./state"

//import {getComponentAtStrokeIdx} from "./HanziDesc"

/*
 * This element
 *  - initiates hanzi writer
 *  - exposes hanzi writer
 *  - handle resize
 *  - draws a background sheet
 *  - handle hanzi changes
 */
export default class CharactersSlideshowQuiz extends Component {
  hanzi = "";

  //selectedIdx = 0;

  charactersData: any[] = []

   currentCharacterComplete = false

  sliderWidth = 0;

  //@property({ type: Boolean })
  //currentCharacter

  //onComplete(): void {
  //  //setTimeout(() => {
  //  //  if (this.isWordCompleted) {
  //  //    this.nextCharIdx++
  //  //    this.revealNextButtons = true
  //  //  } else {
  //  //    this.hanziWriter?.setCharacter(this.nextCharacter);

  //  //    //const charData = this.hanziData[this.nextCharIdx-1]// TODO currentCharIdx
  //  //    //this.hanziWriter.charData =charData

  //  //    this.hanziWriterComponent.startQuiz();
  //  //  }
  //  //}, 1000);
  //  //this.currentCharacterComplete=true
  //}

  //prev() {
    //state.selectedIdx = Math.max(0, state.selectedIdx-1)
  //}
  //next() {
    //state.selectedIdx = Math.min(this.charactersData.length-1, state.selectedIdx+1)
  //}

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("selectedIdx")) {
      const quizEl = this.shadowRoot?.querySelector(`#slideshow character-quiz:nth-of-type(${state.selectedIdx+1})`)
      if (!quizEl)
        this.currentCharacterComplete = false
      else
        this.currentCharacterComplete = (quizEl as CharacterQuiz).complete || false
    }
  }

	static css = css`
      :host {
display: block;
        position: relative;
overflow: hidden;
        border: 1px solid #dfdfdf;
      }
      character-quiz {
height: 100%;
flex: 0 0 auto;
}
#slideshow {
display: flex;
height: 100%;
  transition: transform 1s ease;
position: absolute;

}
#button-layer {
height: 100%;
width:100%;
position: absolute;
 display: flex;
  justify-content: center;
  align-items: center;
pointer-events: none;
}
#prev-btn {
left: 0;
position: absolute;
}
#next-btn {
right: 0;
position: absolute;
}
mwc-icon-button {
pointer-events: all;
}
[hidden] {
display: none;
}
    `;

  _triggerEventHanziComplete() {
    const event = new CustomEvent("hanzi-complete", {
      detail: {},
    });
    this.dispatchEvent(event);
  }

getShiftWidth(idx:number) {
   const quizEl = this.shadowRoot?.querySelector(`#slideshow character-quiz:nth-of-type(${idx+1})`)
    const shift= quizEl ? (quizEl as HTMLElement).offsetLeft*idx : 0; // TODO
  return `transform: translateX(-${shift}px)`;
}

//  render(): TemplateResult {
//    const quizEl = this.shadowRoot?.querySelector(`#slideshow character-quiz:nth-of-type(${state.selectedIdx+1})`)
//    const slideWidth = quizEl ? (quizEl as HTMLElement).offsetLeft*state.selectedIdx : 0; // TODO
//    const prevBtnVisible = state.selectedIdx > 0 && this.currentCharacterComplete
//    const nextBtnVisible = state.selectedIdx < this.charactersData.length - 1 && this.currentCharacterComplete
    //const transformValue = `translateX(-${slideWidth}px)`;
//?hidden="{this.}"

	static template = html`

    <div id="slideshow"
        repeat="hanziData"
        as="hanziComponent"
        index-as="index"
        style="{this.getShiftWidth(selectedIdx)}">
          <character-quiz
            backboard
            strokes-visible="{strokesVisible}"
            character="{hanziComponent.character}"
            active="{equal(index,selectedIdx)}"
            .hanziComponent={hanziComponent}
          > </character-quiz>
    </div>


<div id="button-layer">

      <mwc-icon-button id="prev-btn" hidden="{!prevBtnVisible}" @click=prev()>
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path fill="currentColor" d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg>
      </mwc-icon-button>
      <mwc-icon-button id="next-btn" hidden="{!nextBtnVisible}" @click=next()>
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path fill="currentColor" d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg>
      </mwc-icon-button>

</div>
`
}

register(CharactersSlideshowQuiz)
