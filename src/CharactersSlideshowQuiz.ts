import { Component, register, html, css } from 'pouic'

import "./CharacterQuiz";

import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";

import { state } from "./state"

export default class CharactersSlideshowQuiz extends Component {
  hanzi = "";

  charactersData: any[] = []

  currentCharacterComplete = false

  sliderWidth = 0;

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
  transition: transform 0.7s ease;

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
padding: var(--slide-padding);
}

.slide-wrapper-2 {
      background: white;

border: var(--slide-border);
overflow: var(--slide-wrapper-overflow);
height: 100%;
}
character-quiz {
border-bottom: var(--character-quiz-border-bottom); /* HACK */
}
    `;

  getShiftWidth(idx: number) {
    const quizEl = this.shadowRoot?.querySelector(`#slideshow div:nth-of-type(${idx + 1})`)
    return quizEl ? -(quizEl as HTMLElement).offsetLeft : 0; // TODO
  }

  getSlideshowTransform(idx: number) {
    return `transform: translateX(${this.getShiftWidth(idx)}px)`;
  }

  connectedCallback() {
    // HACK
    window.addEventListener('resize', () => {
      const slideshow = this.shadowRoot.getElementById('slideshow')
      if (!slideshow) return
      slideshow.style.transform = `translateX(${this.getShiftWidth(state.selectedIdx)}px)`
    });
  }

  static template = html`

    <div id="slideshow"
        repeat="hanziData"
        as="hanziComponent"
        index-as="index"
        style="{this.getSlideshowTransform(selectedIdx)}">
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
