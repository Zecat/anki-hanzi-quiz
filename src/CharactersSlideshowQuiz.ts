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
      }
      character-quiz {
flex: 0 0 auto;
}
#slideshow {
display: flex;
height: 100%;
  transition: transform 1s ease;

}

#slideshow:not(:has(div)) {
aspect-ratio: 1;
}

#button-layer {
height: 100%;
width:100%;
position: absolute;
top:0;
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
.slide-wrapper {
width: 100%;
min-height: 100%;
flex:none;
box-sizing: border-box;
      padding: 8px;
padding-top: 0;
}

.slide-wrapper-2 {
        border: 1px solid #dfdfdf;
      background: white;
overflow: hidden;
}
    `;

getShiftWidth(idx:number) {
   const quizEl = this.shadowRoot?.querySelector(`#slideshow div:nth-of-type(${idx+1})`)
    const shift= quizEl ? (quizEl as HTMLElement).offsetLeft : 0; // TODO
  return `transform: translateX(-${shift}px)`;
}

  //isMorphHidden(opened:boolean) {
  //  return  !opened
  //}

	static template = html`

    <div id="slideshow"
        repeat="hanziData"
        as="hanziComponent"
        index-as="index"
        style="{this.getShiftWidth(selectedIdx)}">
<div class="slide-wrapper">
<div class="slide-wrapper-2">
          <character-quiz
hidden="{hanziComponent.decompositionVisible}"
            backboard
            strokes-visible="{strokesVisible}"
            character="{hanziComponent.data.character}"
            active="{equal(index,selectedIdx)}"
            .hanziComponent={hanziComponent}
          > </character-quiz>
<character-morph hidden="{!hanziComponent.decompositionVisible}" .data={hanziComponent} ></character-morph>
</div>
</div>
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
