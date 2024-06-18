/// <reference path="pouic.d.ts" />
/// <reference path="../custom.d.ts" />
import HanziWriter from "hanzi-writer";
import { Component } from 'pouic';
import { InteractiveCharacter } from "./InteractiveCharacter";
import { Bezier } from 'bezier-js';
import { Segment } from "path-data-parser/lib/parser";
type Point = {
    x: number;
    y: number;
};
type Cubic = [number, number, number, number, number, number, number, number];
type Cubic6 = [number, number, number, number, number, number];
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
    cmpFadeOut(cmp: InteractiveCharacter): Promise<any[]>;
    mistakeCheck(cmp: InteractiveCharacter): boolean;
    hasIntermediateCmpParent(cmp: InteractiveCharacter): boolean;
    isFirstOrderCmp(cmp: InteractiveCharacter): boolean;
    onCorrectStrokeForCmpRec(strokeIdx: number, cmp: InteractiveCharacter): boolean;
    calculateCumulativeDistances(path: [number, number][]): number[];
    interpolatePath(pathA: [number, number][], pathB: [number, number][]): [number, number][];
    convertArrayToSVGPath(p: Cubic): string;
    convertArrayToSVGPathPartial(p: Cubic6): string;
    convertBezierArrayToSVGPath(bezierArray: any[]): string;
    convertBezierArrayToSVGPath2(bezierArray: any[]): string;
    convertToSVGPath(bezierCurves: [number, number][]): string;
    convertToCubicBezierCurves(points: [number, number][]): [number, number, number, number, number, number, number, number][];
    approximateHalfCircle(A: [number, number], B: [number, number]): [number, number][];
    createHalfCircleBezier(start: Point, end: Point): [Point, Point];
    invertBezierArr(bezArr: any): Bezier[];
    segmentsToValues(segs: Segment[]): Cubic[];
    getDrawnPointsMorph(points: any, fStrokes: any, fRep: any): string[];
    applyDrawingMorph(strokeIdx: number, morph: any): void;
    onCorrectStroke(strokeData: any): void;
    incrementMistakeRec(cmp: InteractiveCharacter): void;
    onMistake(strokeData: any): void;
    static css: any;
    static template: any;
}
export {};
