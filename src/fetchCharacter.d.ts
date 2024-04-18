import { StrokeAnalysis } from './uniformPath';
export declare const fetchCharacter: (char: string) => Promise<any>;
export type CharDataItem = {
    character: string;
    definition: string;
    pinyin: string[];
    decomposition: string;
    len: number;
    radical: string;
    acjk: string;
    strokes: string[];
    medians: string[];
    repartition: StrokeAnalysis[];
};
