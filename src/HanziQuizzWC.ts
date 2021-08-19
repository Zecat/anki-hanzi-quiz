import {LitElement, html, customElement, property} from "lit-element";
import '@material/mwc-icon-button-toggle'
import '@material/mwc-icon-button'
import '@material/mwc-tab-bar'
import '@material/mwc-tab'
import HanziWriter from 'hanzi-writer'

import eye from './icons/eye.svg'
import eyeOff from './icons/eye-off.svg'
import eraser from './icons/eraser.svg'
//todo use a font builder https://github.com/Templarian/MaterialDesign-Font-Build

@customElement('hanzi-quizz')

export default class HanziQuizzWC extends LitElement {
  @property({type: Boolean})
  strokesVisible: boolean = false
  @property({type: Number})
  rating: number = 4
  hanziWriter: HanziWriter | undefined;
  @property({type: String})
  character: string = ''
  onVisibilityButtonTapped(e: any) {//TODO change type
    e.detail.isOn ? this.revealStrokes() : this.hideStrokes();
  }
  revealStrokes() {
this.hanziWriter?.showOutline()
console.log(this.rating)
this.rating = 1
  }
  hideStrokes() {
    this.hanziWriter?.hideOutline()
  }
  onEraserButtonClick() {
    console.log(this.character)
this.hanziWriter?.quiz();
  }
  firstUpdated() {

  super.connectedCallback()
this.initiateHanziWriter(this.renderRoot.querySelector('#hanzi-target'))
;
}

    initiateHanziWriter(target: any):void {
 
      this.hanziWriter = HanziWriter.create(target, this.character, {
       width: this.sheetSize,
       height: this.sheetSize,
       showCharacter: false,
       showOutline: false,
      showHintAfterMisses: 1,
        highlightOnComplete: false,
        onLoadCharDataSuccess: () => console.log('success')
     });
     this.hanziWriter.quiz({
    onMistake: this.onMistake.bind(this),
    onComplete: this.onComplete.bind(this)
    });
    }


  get sheetSize() : number {
 const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
         const sheetSize = Math.min(vw, 350);
return sheetSize
  }
  onMistake(): void {
    this.rating = Math.max(1, this.rating-1);
  }
  onComplete(): void {
    const androidAnswerMethodKey:string = `buttonAnswerEase${this.rating}`;
    const method: Function = (window as { [key: string]: any })[androidAnswerMethodKey]();
    method();
  }

  // TODO DO this the clean way
ratingButtonClicked(e: any) {
  const tabIndex = e.detail.index;
  if (tabIndex+1 !== this.rating) {
    this.rating = tabIndex+1;
  }
}
  render() {
    let size = this.sheetSize;
    let halfSize = size/2;
    return html`
        <style>
        #container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    --mdc-tab-horizontal-padding: 0px;
        }

    #button-easy {
      --mdc-theme-primary: green;

 --mdc-theme-on-primary: white;
    }

    #tab-bar {

      position: fixed;
      bottom: 0;
    }

    #hanzi-target {
      width: ${size}px;
      height: ${size}px;
    }

    #hanzi-target > * {
  position: absolute;
    }
  </style>
  <div id="container">
  <div id="hanzi-target">
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" id="grid-background-target">
       <line x1="0" y1="0" x2="${size}" y2="${size}" stroke="#DDD" />
       <line x1="${size}" y1="0" x2="0" y2="${size}" stroke="#DDD" />
       <line x1="${halfSize}" y1="0" x2="${halfSize}" y2="${size}" stroke="#DDD" />
      <line x1="0" y1="${halfSize}" x2="${size}" y2="${halfSize}" stroke="#DDD" />
      </svg>
      </div>

  <div>
       <mwc-icon-button-toggle label="stroke visibility" ?on="${this.strokesVisible}" @icon-button-toggle-change="${this.onVisibilityButtonTapped}">
       <img slot="onIcon" src="${eye}">
<img slot="offIcon" src="${eyeOff}">
       </mwc-icon-button-toggle>
       <mwc-icon-button @click="${this.onEraserButtonClick}">  
<img src="${eraser}">
       </mwc-icon-button>
</div>
      <mwc-tab-bar id="tab-bar" @MDCTabBar:activated=${this.ratingButtonClicked} .activeIndex=${this.rating-1}>
  <mwc-tab
      label="Again"
      stacked
      isMinWidthIndicator>

  </mwc-tab>
  <mwc-tab
      label="Difficult"
      stacked
      isMinWidthIndicator>
  </mwc-tab>
  <mwc-tab
      label="Good"
      stacked
      isMinWidthIndicator>
  </mwc-tab>
  <mwc-tab
      label="Easy"
      stacked
      isMinWidthIndicator>
  </mwc-tab>


</mwc-tab-bar>
    </div>
       `;
  }
}

declare global {

  interface HTMLElementTagNameMap {

    "hanzi-quizz": HanziQuizzWC,

  }

}
