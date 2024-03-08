/// <reference path="pouic.d.ts" />
import HanziWriter from "hanzi-writer";
import { Component } from 'pouic';
import { ComponentDefinition } from "./HanziDesc";
export default class CharacterQuiz extends Component {
    backboard: boolean;
    active: boolean;
    options: {};
    hanzicomponent?: ComponentDefinition;
    cmpMistakeThreshold: number;
    hanziWriter: HanziWriter | undefined;
    quizStarted: boolean;
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, _: string, newValue: string | null): void;
    createHanziWriter(hanzi: string): HanziWriter;
    strokeIdxToCmp(strokeIdx: number): ComponentDefinition;
    startQuiz(quizStartStrokeNum?: number): void;
    onCorrectStroke(strokeData: any): void;
    onMistake(strokeData: any): void;
    static css: any;
    static template: any;
}
