/// <reference path="pouic.d.ts" />
import HanziWriter from "hanzi-writer";
import { Component } from 'pouic';
import { InteractiveCharacter } from "./InteractiveCharacter";
type Point = {
    x: number;
    y: number;
};
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
    calculateCumulativeDistances(path: [number, number][]): number[];
    interpolatePath(pathA: [number, number][], pathB: [number, number][]): [number, number][];
    convertArrayToSVGPathPartial(p: any[]): string;
    convertBezierArrayToSVGPath(bezierArray: any[]): string;
    convertBezierArrayToSVGPath2(bezierArray: any[]): string;
    convertToSVGPath(bezierCurves: [number, number][]): string;
    convertToCubicBezierCurves(points: [number, number][]): [number, number, number, number, number, number, number, number][];
    approximateHalfCircle(A: [number, number], B: [number, number]): [number, number][];
    createHalfCircleBezier(start: Point, end: Point): [Point, Point];
    invertBezierArr(bezArr: any): any[];
    onCorrectStroke(strokeData: any): void;
    incrementMistakeRec(cmp: InteractiveCharacter): void;
    onMistake(strokeData: any): void;
    static css: any;
    static template: any;
}
export {};
