import "@material/mwc-icon-button";
import "@material/mwc-icon-button-toggle";
import "@material/mwc-tab";
import "@material/mwc-tab-bar";
import {
  css,
  html,
  LitElement,
  TemplateResult,
  CSSResultGroup,
} from "lit-element";
import {customElement, property} from 'lit/decorators.js';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

import HanziWriterComponent from "./HanziWriter";
import "./HanziWriter";
import HanziWriter from "hanzi-writer";

//todo use a font builder https://github.com/Templarian/MaterialDesign-Font-Build

@customElement("hanzi-quiz")
export default class HanziQuiz extends LitElement {
  @property({ type: Boolean })
  strokesVisible = false;

  @property({ type: Number })
  rating = 4;

  @property({ type: String })
  pinyin = "";

  @property({ type: String })
  description = "";

  @property({ type: String })
  hanzi = "";

  hanziWriter: HanziWriter | undefined;

  @property({ type: Number })
  currentCharacterIndex = 0;

  getOcclusedDescription(description: string, hanzi: string): string {
    // Apply regex replacement to the description
    const occlused =  description.replace(new RegExp('['+hanzi+']', 'g'), '?');
    return occlused
  }

  get nextCharacter(): string {
    const i = this.currentCharacterIndex;
    this.currentCharacterIndex++;
    return this.hanzi[i];
  }

  get isWordCompleted(): boolean {
    return this.currentCharacterIndex > this.hanzi.length;
  }

  get hanziWriterComponent(): HanziWriterComponent {
    return (this.renderRoot as ShadowRoot).getElementById(
      "hanzi-writer"
    ) as HanziWriterComponent;
  }

  async firstUpdated(): Promise<void> {
    this.hanziWriter = await this.hanziWriterComponent.createHanziWriter(
      this.nextCharacter
    );
    this.startQuiz();
  }

  startQuiz() {
    this.hanziWriter?.quiz({
      onMistake: this.onMistake.bind(this),
      onComplete: this.onComplete.bind(this),
    });
  }

  fixTabBarMinWidth() {
    // HACK mwc is a hell and at that time does not provide a way tu customise min-width
    setTimeout(() => {
      const tabs = this.shadowRoot?.querySelectorAll("mwc-tab");
      if (!tabs) return;
      for (const tab of tabs) {
        const button = tab.shadowRoot?.querySelector("button");
        if (!button) continue;
        button.style.minWidth = "0";
      }
    }, 0);
  }

  connectedCallback() {
    super.connectedCallback();
    this.fixTabBarMinWidth();
  }

  onVisibilityButtonTapped(e: CustomEvent): void {
    e.detail.isOn ? this.revealStrokes() : this.hideStrokes();
  }

  revealStrokes(): void {
    this.hanziWriter?.showOutline();
    this.rating = 1;
  }

  hideStrokes(): void {
    this.hanziWriter?.hideOutline();
  }

  onEraserButtonClick(): void {
    this.hanziWriter?.quiz();
  }

  onMistake(): void {
    this.rating = Math.max(1, this.rating - 1);
  }

  onComplete(): void {
    setTimeout(() => {
      this.hanziWriter?.setCharacter(this.nextCharacter);
      if (this.isWordCompleted) {
        // TODO better typing ?
        const androidAnswerMethodKey = <keyof Window>(
          `buttonAnswerEase${this.rating}`
        );
        const method = <() => void>window[androidAnswerMethodKey];
        method && method();
      } else {
        this.startQuiz();
      }
    }, 1000);
  }

  // TODO DO this the clean way
  ratingButtonClicked(e: CustomEvent): void {
    const tabIndex = e.detail.index;
    if (tabIndex + 1 !== this.rating) {
      this.rating = tabIndex + 1;
    }
  }

  revealCharacters(hanzi: string, currentCharacterIndex: number): string {
    if (!hanzi) return "";
    return hanzi.substring(0, currentCharacterIndex - 1);
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        position: relative;
        --quiz-background: white;
        display: flex;
        flex-direction: column;
        --mdc-tab-horizontal-padding: 0px;
        background: var(--quiz-background);
        margin-bottom: 48px;
      }

      @media (orientation: landscape) {
        #top-bar {
          grid-area: topbar;
        }
        #translation {
          grid-area: translation;
        }
        #hanzi {
          grid-area: hanzi;
        }
        #hanzi-writer {
          grid-area: hanziwriter;
        }

        :host {
          display: grid;
          grid-template-rows: [row1-start] 25px [row1-end row2-start] 25px [row2-end];
          grid-template-columns: auto min(500px, calc(-40px + 100vh));
          grid-template-areas:
            "topbar hanziwriter"
            "hanzi hanziwriter"
            "translation hanziwriter"
        }
      }

      #top-bar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }

      #button-easy {
        --mdc-theme-primary: green;
        --mdc-theme-on-primary: white;
      }

      #tab-bar {
        position: fixed;
        bottom: 0;
        width: 100%;
        --mdc-tab-horizontal-padding: 0px;
        background: white;
      }

      #tab-bar mwc-tab {
        width: 25%;
      }

      #pinyin {
        padding-left: 12px;
        flex: 1;
      }

      #hanzi-writer {
        position: relative;
        flex: 1;
        margin: 12px;
        aspect-ratio: 1;
      }

      #hanzi {
        width: 100%;
        padding: 0 12px;
        margin: 0;
        height: 36px;
        box-sizing: border-box;
      }

      #translation {
        padding: 0 12px;
      }
    `;
  }

  render(): TemplateResult {
    return html`

    <div id="top-bar">
    <h2 id="pinyin">${unsafeHTML(this.pinyin)}</h2>

      <mwc-icon-button-toggle label="stroke visibility" ?on="${
        this.strokesVisible
      }"
        @icon-button-toggle-change="${this.onVisibilityButtonTapped}">
        <svg slot="offIcon" xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor"
            d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
        </svg>
        <svg slot="onIcon" xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor"
            d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z" />
        </svg>
      </mwc-icon-button-toggle>
      <mwc-icon-button @click="${this.onEraserButtonClick}">
        <svg xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor"
            d="M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z" />
        </svg>
  
      </mwc-icon-button>
  
    </div>
    <h2 id="hanzi">${this.revealCharacters(this.hanzi, this.currentCharacterIndex)}</h2>
    <hanzi-writer id="hanzi-writer" .character="${this.hanzi}"></hanzi-writer>
  </div>
  <span id="translation">${unsafeHTML(this.getOcclusedDescription(this.description, this.hanzi))}</span>
  
  <mwc-tab-bar id="tab-bar" @MDCTabBar:activated="${
    this.ratingButtonClicked
  }" .activeIndex="${this.rating - 1}">
    <mwc-tab label="Again" min>
    </mwc-tab>
    <mwc-tab label="Hard">
    </mwc-tab>
    <mwc-tab label="Good">
    </mwc-tab>
    <mwc-tab label="Easy">
    </mwc-tab>
  
  </mwc-tab-bar>
       `;
  }
}
