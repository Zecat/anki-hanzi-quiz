/// <reference path="pouic.d.ts" />
import { Component } from 'pouic';
import "./CharacterQuiz";
import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";
export default class CharactersSlideshowQuiz extends Component {
    hanzi: string;
    charactersData: any[];
    currentCharacterComplete: boolean;
    sliderWidth: number;
    static css: any;
    getShiftWidth(idx: number): number;
    getSlideshowTransform(idx: number): string;
    connectedCallback(): void;
    static template: any;
}
