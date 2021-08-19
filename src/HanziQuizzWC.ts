import { LitElement, html, customElement, property} from "lit-element";
import '@material/mwc-icon-button-toggle'
import '@material/mwc-icon-button'
import { mdiEraser } from '@mdi/svg';

import eye from './icons/eye.svg' // TODO icons index file to factorize imports
import eyeOff from './icons/eye-off.svg' 

@customElement('hanzi-quizz')
export default   class HanziQuizzWC extends LitElement {
@property({type: Boolean})
  strokesVisible: boolean = false
  onVisibilityButtonTapped(e:MouseEvent) {//TODO change type
    console.log(e)

    //e.detail.isOn ? this.revealStrokes() : this.hideStrokes();
  }
onEraserButtonClick() {

  console.log('erase');
}
     render() {
       return html`
       <mwc-icon-button-toggle label="stroke visibility" ?on="${this.strokesVisible}" @icon-button-toggle-change="${this.onVisibilityButtonTapped}">
       <img slot="onIcon" src="${eye}">
<img slot="offIcon" src="${eyeOff}">
       </mwc-icon-button-toggle>
       <mwc-icon-button @click="${this.onEraserButtonClick}">  
<img src="${mdiEraser}">
       </mwc-icon-button>
       `;
     }
   }
   
   declare global {

  interface HTMLElementTagNameMap {

    "hanzi-quizz": HanziQuizzWC,

  }

}
