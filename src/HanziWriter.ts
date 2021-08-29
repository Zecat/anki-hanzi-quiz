import HanziWriter from 'hanzi-writer';
import {customElement, css, html, LitElement, property, TemplateResult, CSSResultGroup} from "lit-element";

/*
* This element
*  - initiates hanzi writer
*  - exposes hanzi writer
*  - handle resize
*  - draws a background sheet
*  - handle character changes
*/
@customElement('hanzi-writer')
export default class HanziWriterComponent extends LitElement {
  @property({type: String})
  character = ''

  hanziWriter: HanziWriter | undefined;

  firstUpdated(): void {
    const hanziTargetElement: HTMLElement = <NonNullable<HTMLElement>>this.renderRoot
    this.initiateHanziWriter(hanziTargetElement);

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        // TODO prevent calling on first render
        this.hanziWriter?.updateDimensions({width: cr.width, height: cr.height});
      }
    });

    resizeObserver.observe(hanziTargetElement.host);
  }

  initiateHanziWriter(target: HTMLElement): void {

    this.hanziWriter = HanziWriter.create(target, this.character, {
      showCharacter: false,
      showOutline: false,
      showHintAfterMisses: 1,
      highlightOnComplete: false,
      onLoadCharDataSuccess: () => console.log('success')
    });

    //const mistakeEvent = new Event('@HWQ:mistake', {bubbles: true, composed: true});
    //const completeEvent = new Event('@HWQ:complete', {bubbles: true, composed: true});

    this.hanziWriter.quiz({
//      onMistake: this.dispatchEvent(mistakeEvent),
  //    onComplete: this.dispatchEvent(completeEvent),
    });
  }


  static get styles(): CSSResultGroup {
    return css`
      :host {
      position: relative;
      }

      :host:after {
      content: "";
      display: block;
      padding-bottom: 100%;
      }

      :host > * {
      position: absolute;
      top: 0;
      left: 0;
      }
      
      
      #grid-background-target {
      width: 100%;
      height: 100%;
      border: 1px solid grey;
      }

      #grid-background-target > line {
      stroke: var(--ahw-grid-stroke, grey);
      }

    `
  }


  render(): TemplateResult {
    return html`
      <svg xmlns="http://www.w3.org/2000/svg" id="grid-background-target">
        <line x1="0" y1="0" x2="100%" y2="100%" />
        <line x1="100%" y1="0" x2="0" y2="100%" />
        <line x1="50%" y1="0" x2="50%" y2="100%" />
        <line x1="0" y1="50%" x2="100%" y2="50%" />
      </svg>
`
  }

}

declare global {
  interface HTMLElementTagNameMap {
    "hanzi-writer": HanziWriterComponent,
  }
}
