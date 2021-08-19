import '@material/mwc-icon-button-toggle'
import '@material/mwc-icon-button'
import '@material/mwc-tab-bar'
import '@material/mwc-tab'
import HanziWriter from 'hanzi-writer'

import eye from './icons/eye.svg'
import eyeOff from './icons/eye-off.svg'
import eraser from './icons/eraser.svg'

import {LitElement, html, customElement, property} from "lit-element";

@customElement('basic-element')
export default class BasicElement extends LitElement {

@property({type: String})
  character: string = ''

  hanziWriter: HanziWriter | undefined;
  firstUpdated() {

  super.connectedCallback()
this.initiateHanziWriter(this.renderRoot.querySelector('#hanzi-target'))
;
}
 initiateHanziWriter(target: any):void {
      this.hanziWriter = HanziWriter.create(target, this.character, {
       width: 250,
       height: 250,
       showCharacter: false,
       showOutline: false,
      showHintAfterMisses: 1,
        highlightOnComplete: false,
        onLoadCharDataSuccess: () => console.log('success')
     });
     this.hanziWriter.quiz({
    });
    }

  render() {
    console.log(HanziWriter, eye, eyeOff, eraser)
    return html`<h1>Basic Element</h1><div id="hanzi-target"></div>
      <mwc-tab-bar id="tab-bar"> 
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

    `
}
}


declare global {

  interface HTMLElementTagNameMap {

    "basic-element": BasicElement,

  }

}
