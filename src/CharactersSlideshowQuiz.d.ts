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
    getShiftWidth(idx: number): string;
    isMorphHidden(opened: boolean): boolean;
    static template: any;
}
