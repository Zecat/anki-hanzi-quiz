/// <reference path="pouic.d.ts" />
import HanziWriter from "hanzi-writer";
import { Component } from 'pouic';
import { InteractiveCharacter } from "./InteractiveCharacter";
export default class CharacterQuiz extends Component {
    backboard: boolean;
    active: boolean;
    options: {};
    hanzicomponent?: InteractiveCharacter;
    cmpMistakeThreshold: number;
    lastMistakeStrokeNum: number;
    ignoreMistake: boolean;
    hanziWriter: HanziWriter | undefined;
    quizStarted: boolean;
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, _: string, newValue: string | null): void;
    createHanziWriter(hanzi: string): HanziWriter;
    startQuiz(quizStartStrokeNum?: number): void;
    checkCompleteRec(cmp: any): void;
    mistakeCheck(cmp: InteractiveCharacter): boolean;
    hasIntermediateCmpParent(cmp: InteractiveCharacter): boolean;
    isFirstOrderCmp(cmp: InteractiveCharacter): boolean;
    onCorrectStrokeForCmpRec(strokeIdx: number, cmp: InteractiveCharacter): boolean;
    onCorrectStroke(strokeData: any): void;
    incrementMistakeRec(cmp: InteractiveCharacter): void;
    onMistake(strokeData: any): void;
    static css: any;
    static template: any;
}
