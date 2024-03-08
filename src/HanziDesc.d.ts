import { CharDataItem, Matches } from "./HanziDictionary";
type CDLChar = "⿰" | "⿱" | "⿴" | "⿵" | "⿶" | "⿷" | "⿼" | "⿸" | "⿹" | "⿺" | "⿽" | "⿻" | "⿾" | "⿿" | "⿲" | "⿳";
export type ComponentDefinition = {
    character: string;
    firstIdx: number;
    lastIdx: number;
    strokeCount: number;
    parent: ComponentDefinition | null;
    components: ComponentDefinition[];
    cdl: CDLChar | null;
    mistakeCount: number;
    matches: Matches;
    complete: boolean;
};
export declare const getNextComponent: (decomposition: string, i?: number) => [number, ComponentDefinition];
export declare const getComponentAtStrokeIdx: (strokeIdx: number, matches: Matches, cmp: ComponentDefinition) => ComponentDefinition;
export declare const getDecomposition: (charData: CharDataItem) => ComponentDefinition;
export {};
