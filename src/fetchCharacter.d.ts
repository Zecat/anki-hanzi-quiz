export declare const fetchCharacter: (char: string) => Promise<any>;
export type CharDataItem = {
    character: string;
    definition: string;
    pinyin: string[];
    decomposition: string;
    radical: string;
    acjk: string;
    strokes: string[];
    medians: string[];
};
