import HanziWriter from "hanzi-writer";
import {
  css,
  html,
  LitElement,
  TemplateResult,
  CSSResultGroup,
} from "lit-element";

import {when} from 'lit/directives/when.js';
import {customElement, property} from 'lit/decorators.js';

/*
 * This element
 *  - initiates hanzi writer
 *  - exposes hanzi writer
 *  - handle resize
 *  - draws a background sheet
 *  - handle hanzi changes
 */
@customElement("hanzi-writer")
export default class HanziWriterComponent extends LitElement {
  @property({ type: String })
  hanzi = "";

  @property({ type: Boolean })
  backboard = false;

  @property({ type: Boolean })
  showAnimated = false;

  @property({ type: Object })
  options = {}

  hanziWriter: HanziWriter | undefined;

  isPropBecomingTrue(propName: string, changedProperties: Map<string, unknown>) {
    if (changedProperties.has(propName)) {
      const oldValue = changedProperties.get(propName) as boolean;
      const newValue = Reflect.get(this,propName);

      if (!oldValue && newValue)
        return true;
    }
    return false;
  }

  updated(changedProperties: Map<string, unknown>) {
    if (this.isPropBecomingTrue("showAnimated", changedProperties))
        this.animateCharacter()
  }

  // Animate this.hanzi character, creating hanziWriter if required
  animateCharacter():void {
     if (!this.hanziWriter) {
       if (!this.hanzi) {
         console.warn("hanzi-writer should be given a hanzi attribute when using showAnimated.")
         return
       }
       this.createHanziWriter(this.hanzi).then(()=> {
         if (this.hanziWriter)
           //this.hanziWriter.option.strokeAnimationSpeed= 5, // 5x normal speed
  //delayBetweenStrokes: 10, // milliseconds
         this.hanziWriter?.animateCharacter();
       });
     } else {
         this.hanziWriter?.animateCharacter();
     }
  }

  async createHanziWriter(hanzi: string): Promise<HanziWriter> {
    await this.updateComplete;
    const target = this.renderRoot;

    this.hanziWriter = HanziWriter.create(
      <HTMLElement>(<unknown>target),
      hanzi,
      {
        showCharacter: false,
        showOutline: false,
        showHintAfterMisses: 1,
        highlightOnComplete: false,
        ...this.options
        //onLoadCharDataSuccess: () => console.log("success"),
      }
    );

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        // TODO prevent calling on first render ?
        this.hanziWriter?.updateDimensions({ width: cr.width, height: cr.height });
      }
    });

    resizeObserver.observe((this.renderRoot as ShadowRoot).host);

    return this.hanziWriter;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        position: relative;
        display: block;
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
        border: 1px solid #dfdfdf;
      }

      #grid-background-target > line {
        stroke: #f0f0f0;
      }
    `;
  }

  render(): TemplateResult {
    return html`
      ${when(this.backboard, () => html`
      <svg xmlns="http://www.w3.org/2000/svg" id="grid-background-target">
        <line x1="0" y1="0" x2="100%" y2="100%" />
        <line x1="100%" y1="0" x2="0" y2="100%" />
        <line x1="50%" y1="0" x2="50%" y2="100%" />
        <line x1="0" y1="50%" x2="100%" y2="50%" />
      </svg>`)}
    `;
  }
}
