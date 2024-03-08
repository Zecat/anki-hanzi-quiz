/// <reference path="pouic.d.ts" />
import "@material/mwc-icon-button";
import "@material/mwc-button";
import "@material/mwc-icon-button-toggle";
import "@material/mwc-tab";
import "@material/mwc-tab-bar";
import "./CharactersSlideshowQuiz";
import "./CharacterAnim";
import "./HanziWriter";
import HanziWriter from "hanzi-writer";
import { Component } from 'pouic';
export default class HanziQuiz extends Component {
    strokesVisible: boolean;
    pinyin: string;
    hanziWriter: HanziWriter | undefined;
    nextCharIdx: number;
    currentCharacterComplete: boolean;
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, _: string, newValue: string): void;
    getOcclusedDescription(description: string, hanzi: string): string;
    get nextCharacter(): string;
    firstUpdated(): Promise<void>;
    fixTabBarMinWidth(): void;
    setData(data: any): void;
    connectedCallback(): void;
    onVisibilityButtonTapped(e: CustomEvent): void;
    onEraserButtonClick(): void;
    onTeachMe(): void;
    practice(): void;
    onMistake(): void;
    next(): void;
    ratingButtonClicked(e: CustomEvent): void;
    isHintHidden(complete: boolean, strokesVisible: boolean): boolean;
    static template: any;
    static css: any;
}
