import HanziWriter from "hanzi-writer";

import { Component, register, html, css } from 'pouic'
import { fetchCharacter } from "./fetchCharacter";

export default class CharacterAnim extends Component {
  options = {};
  hanziWriter: HanziWriter | undefined;
  static get observedAttributes() {
    return ['character', 'reveal'];
  }

 attributeChangedCallback(name: string, oldValue: string|null, newValue:string|null) {
    if (newValue && newValue[0] == "{")
      return
    if (name === 'character' && newValue != null) {
      this.createHanziWriter(newValue)
    }
   if (name == "reveal")  {
     if (newValue != null && oldValue==null) {
         this.hanziWriter?.animateCharacter();
     }
      // this.hanziWriter?.showOutline() : this.hanziWriter?.hideOutline()
   }
  }

  createHanziWriter(hanzi: string): HanziWriter {
    const target = this.shadowRoot;

    this.hanziWriter = HanziWriter.create(
      <HTMLElement>(<unknown>target),
      hanzi,
      {
      strokeAnimationSpeed: 1.2, // 5x normal speed
      delayBetweenStrokes: 100, // milliseconds
      showCharacter: false,
      showOutline: false,
      padding: 0,
      charDataLoader: (char, onComplete) => {fetchCharacter(char).then(onComplete)},
    }

      //{...hanziWriterAnimOptions, renderer: "canvas"}
    );
    return this.hanziWriter;
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
    `;

	static template = html`
    `;
}

register(CharacterAnim)
