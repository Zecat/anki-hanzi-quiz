import { Component, register, html, css } from 'pouic'

import "./CharacterQuiz";

import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";

export default class CharactersSlideshowQuiz extends Component {
  hanzi = "";

  charactersData: any[] = []

   currentCharacterComplete = false

  sliderWidth = 0;

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


  //updated(changedProperties: Map<string, unknown>) {
  //  if (changedProperties.has("selectedIdx")) {
  //    const quizEl = this.shadowRoot?.querySelector(`#slideshow character-quiz:nth-of-type(${state.selectedIdx+1})`)
  //    if (!quizEl)
  //      this.currentCharacterComplete = false
  //    else
  //      this.currentCharacterComplete = (quizEl as CharacterQuiz).complete || false
  //  }
  //}

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
md-icon-button {
pointer-events: all;
}
[hidden] {
display: none;
}
    `;

getShiftWidth(idx:number) {
   const quizEl = this.shadowRoot?.querySelector(`#slideshow character-quiz:nth-of-type(${idx+1})`)
    const shift= quizEl ? (quizEl as HTMLElement).offsetLeft*idx : 0; // TODO
  return `transform: translateX(-${shift}px)`;
}

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

      <md-icon-button id="prev-btn" hidden="{!prevBtnVisible}" @click=prev()>
<md-icon>
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path fill="currentColor" d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg>
</md-icon>
      </md-icon-button>
      <md-icon-button id="next-btn" hidden="{!nextBtnVisible}" @click=next()>
<md-icon>
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path fill="currentColor" d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg>
</md-icon>
      </md-icon-button>

</div>
`
}

register(CharactersSlideshowQuiz)
