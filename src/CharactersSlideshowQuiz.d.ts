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
    updated(changedProperties: Map<string, unknown>): void;
    static css: any;
    _triggerEventHanziComplete(): void;
    getShiftWidth(idx: number): string;
    static template: any;
}
