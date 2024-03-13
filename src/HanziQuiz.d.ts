/// <reference path="pouic.d.ts" />
import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";
import "@material/web/button/filled-button";
import "@material/web/button/outlined-button";
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
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
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, _: string, newValue: string): void;
    getOcclusedDescription(description: string, hanzi: string): string;
    get nextCharacter(): string;
    setData(data: any): void;
    onVisibilityButtonTapped(e: CustomEvent): void;
    next(): void;
    ratingButtonChange(e: CustomEvent): void;
    isHintHidden(complete: boolean, strokesVisible: boolean): boolean;
    cleanPinyin(str: string): string | undefined;
    getPinyinTone(pinyin: string): number;
    getPlecoLink(hanzi: string): string;
    static template: any;
    static css: any;
}
