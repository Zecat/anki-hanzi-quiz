import "@material/mwc-icon-button";
import "@material/mwc-button";
import "@material/mwc-icon-button-toggle";
import "@material/mwc-tab";
import "@material/mwc-tab-bar";

//import HanziWriterComponent from "./HanziWriter";
//import CharacterQuiz from "./CharacterQuiz";
import "./CharactersSlideshowQuiz";
import "./CharacterAnim";
//import CharactersSlideshowQuiz from "./CharactersSlideshowQuiz";
import "./HanziWriter";
import HanziWriter from "hanzi-writer";
//import HanziDictionary from "./HanziDictionary";
//import { getDecomposition } from "./HanziDesc";


import { Component, register, html, css } from 'pouic'
import {state} from "./state"



//@customElement("hanzi-quiz")
export default class HanziQuiz extends Component {
  //@property({ type: Boolean })
  strokesVisible = false;

  //@property({ type: Number })
  //rating = 4;

  //@property({ type: String })
  pinyin = "";

  //@property({ type: String })

  //@property({ type: String })
  //hanzi = "";

  hanziWriter: HanziWriter | undefined;

  //@property({ type: Number })
  nextCharIdx = 0;


  //@property({ type: Boolean })
  currentCharacterComplete = false;
//this.getOcclusedDescription(this.description, this.hanzi)
  //@property({ type: Array })
  //hanziData: CharDataItem[] = [];
  static get observedAttributes() {
    // Define the attributes to observe
    return ['hanzi'];
  }

 attributeChangedCallback(name: string, _: string, newValue:string) {
    // Handle attribute changes
    if (name === 'hanzi') {
      state.hanzi = newValue
      //console.log(`Attribute '${name}' changed from '${oldValue}' to '${newValue}'`);
    }
  }

  //static observers = {
  //  'hanzi': (val: string)=>console.log("HEY", val)
  //}

  //dict: HanziDictionary = new HanziDictionary();

  getOcclusedDescription(description: string, hanzi: string): string {
    // Apply regex replacement to the description
    const occlused = description.replace(
      new RegExp("[" + hanzi + "]", "g"),
      "?",
    );
    return occlused;
  }

  get nextCharacter(): string {
    const i = this.nextCharIdx;
    this.nextCharIdx++;
    return this.hanzi[i];
  }

  //get isWordCompleted(): boolean {
  //  return this.nextCharIdx >= this.hanzi.length;
  //}

  //get hanziWriterComponent(): CharacterQuiz {
  //  return (this.renderRoot as ShadowRoot).getElementById(
  //    "hanzi-writer"
  //  ) as CharacterQuiz;
  //}

  async firstUpdated(): Promise<void> {
    //this.hanziWriter = await this.hanziWriterComponent.createHanziWriter(
    //  this.nextCharacter
    //);
  }

  //  startQuiz(quizStartStrokeNum: number = 0) {
  //
  //    this.currentCharacterComplete=false
  //    this.hanziWriter?.quiz({
  //      onMistake: this.onMistake.bind(this),
  //onCorrectStroke: this.onCorrectStroke.bind(this),
  //      onComplete: this.onComplete.bind(this),
  //quizStartStrokeNum
  //    });
  //  }

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

  setData(data: any) {
      this.shadowRoot.getElementById('pinyin').innerHTML = data.pinyin
      this.shadowRoot.getElementById('description').innerHTML = this.getOcclusedDescription(data.description, state.hanzi)
  }

  connectedCallback() {

//                setTimeout(()=> {
//                dict.getItem("一").then((a:any) => state.toto = a.definition)
//},1000)
    setTimeout(()=> {
      //this.dict.get("字").then(a => state.toto = a.character)
    }, 1000)

    //if (name === 'description') {
    //  this.shadowRoot.getElementById('description').innerHTML = this.getOcclusedDescription(this.description, this.hanzi)
    //  state.hanzi = newValue
    //super.connectedCallback();
    this.fixTabBarMinWidth();
    //this.hanziData = Array.from(this.hanzi).map((character: string) => {
    //  character;
    //});
    //const promisesArray = Array.from(this.hanzi).map((char: string, i: number) => {
    //  return this.dict.get(char).then((charData: CharDataItem) => {
    //    this.hanziData[i] = { ...charData, ...getDecomposition(charData) };
    //console.log("=",this.hanziData)
    //    //this.hanziWriterComponent.charData = this.hanziData[0]//this.nextCharIdx-1]// TODO currentCharIdx
    //    //this.hanziWriterComponent.startQuiz();
    //  });
    //});
    //Promise.all(promisesArray).then(() => {
    //    const slideshowEl = this.shadowRoot?.getElementById("hanzi-slideshow");
    //    if (slideshowEl)
    //      (slideshowEl as CharactersSlideshowQuiz).charactersData =
    //        this.hanziData;
    //})
  }

  onVisibilityButtonTapped(e: CustomEvent): void {
    state.rating = Math.min(state.rating, 1)
    state.strokesVisible = e.detail.isOn
  }

  //revealStrokes(): void {
  //  this.hanziwriter?.showoutline();
  //  state.rating = 1;
  //}

  //hideStrokes(): void {
  //  this.hanziWriter?.hideOutline();
  //}

  onEraserButtonClick(): void {
    this.hanziWriter?.quiz();
  }

  onTeachMe(): void {
    this.hanziWriter?.showOutline();
    setTimeout(() => {
      this.hanziWriter?.hideOutline();
      this.hanziWriter?.quiz();
    }, 3000);
  }

  //strokeIdxToCmp(strokeIdx: number) {
  //  const charData = this.hanziData[this.nextCharIdx-1]
  //  const cmp = getComponentAtStrokeIdx(strokeIdx, charData.matches, charData)
  //  return cmp
  //}

  // onCorrectStroke(strokeData: any): void {
  //   const cmp = this.strokeIdxToCmp(strokeData.strokeNum)
  //   if (cmp.mistakeCount >= this.cmpMistakeThreshold) {
  //     cmp.mistakeCount = 0;
  //     this.startQuiz(cmp.firstIdx)
  //   }
  // }

  //  onMistake(strokeData:any): void {// TODO typing
  //    const cmp = this.strokeIdxToCmp(strokeData.strokeNum)
  //    cmp.mistakeCount++;
  //    state.rating = Math.max(1, state.rating - 1);
  //  }

  practice(): void {
    //this.nextCharIdx = 0;
    //this.hanziWriter?.setCharacter(this.hanzi[0]);
    //this.startQuiz();
  }

  onMistake(): void {
    // TODO typing
    state.rating = Math.max(1, state.rating - 1);
  }

  next(): void {
    // TODO better typing ?
    const androidAnswerMethodKey = <keyof Window>(
      `buttonAnswerEase${state.rating}`
    );
    const method = <() => void>window[androidAnswerMethodKey];
    method && method();
  }

  // TODO DO this the clean way
  ratingButtonClicked(e: CustomEvent): void {
    const tabIndex = e.detail.index;
    if (tabIndex + 1 !== state.rating) {
      state.rating = tabIndex + 1;
    }
  }

  isHintHidden(complete: boolean, strokesVisible:boolean) {
    return !complete && !strokesVisible
  }

//<div hidden="{!toto}" style="background: red">{toto}</div>
	static template = html`
    <div id="quiz-area">
    <div id="top-bar">
<h2 id="pinyin"></h2>

      <!-- TODO mwc-icon-button should accept a href attribute but for some reason it's not working here -->
      <mwc-icon-button>
        <a href="plecoapi://x-callback-url/df?hw={hanzi}">
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
          <path fill="currentColor" d="M160-391h45l23-66h104l24 66h44l-97-258h-46l-97 258Zm81-103 38-107h2l38 107h-78Zm319-70v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-600q-38 0-73 9.5T560-564Zm0 220v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-380q-38 0-73 9t-67 27Zm0-110v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-490q-38 0-73 9.5T560-454ZM260-320q47 0 91.5 10.5T440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6Zm260 42q44-21 88.5-31.5T700-320q36 0 70.5 6t69.5 18v-396q-33-14-68.5-21t-71.5-7q-47 0-93 12t-87 36v394Zm-40 118q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740q51-30 106.5-45T700-800q52 0 102 12t96 36q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59ZM280-499Z"/></svg>
</a>
      </mwc-icon-button>

      <mwc-icon-button-toggle label="stroke visibility" ?on="{
        strokesVisible
      }"
        @icon-button-toggle-change="this.onVisibilityButtonTapped(event)">
        <svg slot="offIcon" xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor"
            d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
        </svg>
        <svg slot="onIcon" xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor"
            d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z" />
        </svg>
      </mwc-icon-button-toggle>

      <mwc-icon-button @click="this.onEraserButtonClick(event)">
        <svg xmlns="http://www.w3.org/2000/svg" style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor"
            d="M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z" />
        </svg>
      </mwc-icon-button>

      <mwc-icon-button @click="this.onTeachMe(event)">
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
        <path fill="currentColor" d="M240-80v-172q-57-52-88.5-121.5T120-520q0-150 105-255t255-105q125 0 221.5 73.5T827-615l52 205q5 19-7 34.5T840-360h-80v120q0 33-23.5 56.5T680-160h-80v80h-80v-160h160v-200h108l-38-155q-23-91-98-148t-172-57q-116 0-198 81t-82 197q0 60 24.5 114t69.5 96l26 24v208h-80Zm254-360Zm-14 120q17 0 28.5-11.5T520-360q0-17-11.5-28.5T480-400q-17 0-28.5 11.5T440-360q0 17 11.5 28.5T480-320Zm-30-128h61q0-25 6.5-40.5T544-526q18-20 35-40.5t17-53.5q0-42-32.5-71T483-720q-40 0-72.5 23T365-637l55 23q7-22 24.5-35.5T483-663q22 0 36.5 12t14.5 31q0 21-12.5 37.5T492-549q-20 21-31 42t-11 59Z"/></svg>
      </mwc-icon-button>

    </div>

    <characters-slideshow-quiz id="hanzi-slideshow"></characters-slideshow-quiz>
    <div id="after-buttons" >
      <mwc-button reveal="{currentComponent.complete}" label="Practice" @click="this.practice()"></mwc-button>
      <mwc-button reveal="{complete}" label="Next" @click="this.next()"></mwc-button>
    </div>

    <div id="character-def" hidden="{!currentComponent.complete}">{currentComponent.definition}</div>
    <div id="character-hint" hidden="{this.isHintHidden(currentComponent.complete, strokesVisible)}">
      {currentComponent.etymology.hint}
    </div>














<div id="revealed-hanzi-wrapper">
    <div id="revealed-hanzi" repeat="hanziData" as="hanziComponent">
      <div class="revealed-char">
        <character-anim
          character="{hanziComponent.character}"
          reveal="{hanziComponent.complete}"
        >

        </character-anim>
        <div class="pinyin">{hanziComponent.pinyin}</div>
      </div>
    </div>
</div>
          <!--?showAnimated="i < this.nextCharIdx - 1"-->

  <mwc-tab-bar id="tab-bar" @MDCTabBar:activated="ratingButtonClicked(event)" .active-index="{minusone(rating)}">
    <mwc-tab label="Again" min>
    </mwc-tab>
    <mwc-tab label="Hard">
    </mwc-tab>
    <mwc-tab label="Good">
    </mwc-tab>
    <mwc-tab label="Easy">
    </mwc-tab>
  </mwc-tab-bar>
  </div>

  <span id="description"></span>
       `;

	static css = css`
      #quiz-area {
        display: flex;
        flex-direction: column;
        min-height: 100vh;

      }

      :host {
        position: relative;
        --quiz-background: #fbfbfb;
        display: flex;
        flex-direction: column;
        --mdc-tab-horizontal-padding: 0px;
        background: var(--quiz-background);
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
        margin: 0;
      }

      #hanzi-slideshow {
        margin: 12px;
        aspect-ratio: 1;
        max-width: 500px;
        background: white;
      }

      #hanzi {
        width: 100%;
        padding: 0 12px;
        margin: 0;
        height: 36px;
        box-sizing: border-box;
        font-size: 40px;
        text-align: center;
      }

      .revealed-char {
        display: flex;
        flex-direction: column;
      }

      #revealed-hanzi-wrapper {
        display: flex;
flex: 1;
position: sticky;
  bottom: 48px;
}
      #revealed-hanzi {
        display: flex;
align-self: end;
 background: rgb(255,255,255);
background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%);

        justify-content: center;
flex: 1;

      }

      #revealed-hanzi .pinyin {
text-align: center;
}

      #revealed-hanzi > .revealed-char > character-anim {
        width: 60px;
        height: 60px;
      }

      #description {
        padding: 0 12px;
        margin-bottom: 42px;
      }

      mwc-icon-button a {
        color: initial;
      }

      #after-buttons {
        display: flex;
        justify-content: space-around;
margin-top: 8px;
  margin-bottom: 24px;
        pointer-events: none;
      }

#after-buttons > * {

        opacity: 0;
        transition: 0.3s opacity;
}

      #after-buttons > [reveal] {
        pointer-events: initial;
        opacity: 1;
      }

      #character-hint {
color: #878787;
padding: 0 8px ;
}
      #character-def {
padding: 0 8px;
}
#character-def:first-letter {
    text-transform: uppercase;
}

`


  //revealCharacters(hanzi: string, nextCharIdx: number): string {
  //  if (!hanzi) return "";
  //  return hanzi.substring(0, nextCharIdx - 1);
  //}
/*
  static get styles(): CSSResultGroup {
    return css`
      #quiz-area {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }

      :host {
        position: relative;
        --quiz-background: #fbfbfb;
        display: flex;
        flex-direction: column;
        --mdc-tab-horizontal-padding: 0px;
        background: var(--quiz-background);
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
        margin: 0;
      }

      #hanzi-slideshow {
        margin: 12px;
        aspect-ratio: 1;
        max-width: 500px;
        background: white;
      }

      #hanzi-slideshow:after {
        content: "";
        display: block;
        padding-bottom: 100%;
      }

      #hanzi {
        width: 100%;
        padding: 0 12px;
        margin: 0;
        height: 36px;
        box-sizing: border-box;
        font-size: 40px;
        text-align: center;
      }

      .revealed-char {
        display: flex;
        flex-direction: column;
      }

      #revealed-hanzi {
        display: flex;
        justify-content: center;
      }

      #revealed-hanzi > .revealed-char > hanzi-writer {
        width: 100px;
        height: 100px;
      }

      #description {
        padding: 0 12px;
      }

      mwc-icon-button a {
        color: initial;
      }

      #after-buttons {
        display: flex;
        justify-content: space-around;
        margin-top: 24px;
        opacity: 0;
        pointer-events: none;
        transition: 0.3s opacity;
      }

      #after-buttons[reveal] {
        pointer-events: initial;
        opacity: 1;
      }
    `;
  }

  render(): TemplateResult {
    //const revealCharacters = this.revealCharacters(this.hanzi, this.nextCharIdx)
    const hanziWriterAnimOptions = {
      strokeAnimationSpeed: 1.2, // 5x normal speed
      delayBetweenStrokes: 100, // milliseconds
      showCharacter: false,
      padding: 0,
    };
    const charData = this.hanziData[this.nextCharIdx - 1]; // TODO currentCharIdx
    console.log("==",charData)

    return html`

    <div id="quiz-area">
    <div id="top-bar">
<h2 id="pinyin">${unsafeHTML(this.pinyin)}</h2>
<div>${charData?.character}</div>

      <!-- TODO mwc-icon-button should accept a href attribute but for some reason it's not working here -->
      <mwc-icon-button>
        <a href="plecoapi://x-callback-url/df?hw=${this.hanzi}">
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
          <path fill="currentColor" d="M160-391h45l23-66h104l24 66h44l-97-258h-46l-97 258Zm81-103 38-107h2l38 107h-78Zm319-70v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-600q-38 0-73 9.5T560-564Zm0 220v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-380q-38 0-73 9t-67 27Zm0-110v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-490q-38 0-73 9.5T560-454ZM260-320q47 0 91.5 10.5T440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6Zm260 42q44-21 88.5-31.5T700-320q36 0 70.5 6t69.5 18v-396q-33-14-68.5-21t-71.5-7q-47 0-93 12t-87 36v394Zm-40 118q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740q51-30 106.5-45T700-800q52 0 102 12t96 36q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59ZM280-499Z"/></svg>
</a>
      </mwc-icon-button>

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

      <mwc-icon-button @click="${this.onTeachMe}">
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
        <path fill="currentColor" d="M240-80v-172q-57-52-88.5-121.5T120-520q0-150 105-255t255-105q125 0 221.5 73.5T827-615l52 205q5 19-7 34.5T840-360h-80v120q0 33-23.5 56.5T680-160h-80v80h-80v-160h160v-200h108l-38-155q-23-91-98-148t-172-57q-116 0-198 81t-82 197q0 60 24.5 114t69.5 96l26 24v208h-80Zm254-360Zm-14 120q17 0 28.5-11.5T520-360q0-17-11.5-28.5T480-400q-17 0-28.5 11.5T440-360q0 17 11.5 28.5T480-320Zm-30-128h61q0-25 6.5-40.5T544-526q18-20 35-40.5t17-53.5q0-42-32.5-71T483-720q-40 0-72.5 23T365-637l55 23q7-22 24.5-35.5T483-663q22 0 36.5 12t14.5 31q0 21-12.5 37.5T492-549q-20 21-31 42t-11 59Z"/></svg>
      </mwc-icon-button>
  
    </div>

    <characters-slideshow-quiz id="hanzi-slideshow" @hanzi-complete=${this.onHanziComplete}></characters-slideshow-quiz>
    <div id="after-buttons" ?reveal="${this.revealNextButtons}">
      <mwc-button label="Practice" @click="${this.practice}"></mwc-button>
      <mwc-button label="Next" @click="${this.next}"></mwc-button>
    </div>

    <div ?hidden="${!this.currentCharacterComplete && !this.strokesVisible}">Hint:${charData?.etymology?.hint}</div>
    <div ?hidden="${!this.currentCharacterComplete}">Def:${charData?.definition}</div>

    <div id="revealed-hanzi">
${map(
  this.hanzi,
  (char, i) =>
    html` <div class="revealed-char">
      <hanzi-writer
        hanzi="${char}"
        .options=${hanziWriterAnimOptions}
        ?showAnimated="${i < this.nextCharIdx - 1}"
      >
      </hanzi-writer>
      <div class="pinyin">${charData?.pinyin}</div>
    </div>`,
)}
    </div>

  </div>

  <mwc-tab-bar id="tab-bar" @MDCTabBar:activated="${
    state.ratingButtonClicked
  }" .activeIndex="${state.rating - 1}">
    <mwc-tab label="Again" min>
    </mwc-tab>
    <mwc-tab label="Hard">
    </mwc-tab>
    <mwc-tab label="Good">
    </mwc-tab>
    <mwc-tab label="Easy">
    </mwc-tab>
  </mwc-tab-bar>
  </div>

  <span id="description">${unsafeHTML(this.getOcclusedDescription(this.description, this.hanzi))}</span>
       `;
  }
*/
}

register(HanziQuiz)
