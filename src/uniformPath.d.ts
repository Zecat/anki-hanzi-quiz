import { Segment } from 'path-data-parser/src/parser';
export declare const makeUniform: (pStr1: string, rep1: StrokeAnalysis, pStr2: string, rep2: StrokeAnalysis) => string[];
export declare const _makeUniform: (pStr1: string, rep1: StrokeAnalysis, pStr2: string, rep2: StrokeAnalysis) => string;
export declare const rotateStartPathToMedianBottom: (p: string, median: any) => string | undefined;
export declare const ask: (p: any) => void;
type SegProgress = {
    seg: Segment;
    t: number;
};
type SegAnalysis = {
    ratio: number;
    cumulRatio: number;
    len: number;
    seg: Segment;
};
export type StrokeAnalysis = {
    top: SegProgress;
    bot: SegProgress;
    left: SegAnalysis[];
    right: SegAnalysis[];
    lLen: number;
    rLen: number;
};
export declare const computeRepartition: (p: string, median: any) => StrokeAnalysis;
export {};
