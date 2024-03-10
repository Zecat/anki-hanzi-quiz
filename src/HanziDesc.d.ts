import { CharDataItem } from "./HanziDictionary";
type Matches = ComponentDefinition[];
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
export declare const getNextComponent: (acjk: string[], acjkIdx?: number, strokeIdx?: number) => [number, number, ComponentDefinition];
export declare const getDecomposition: (charData: CharDataItem) => ComponentDefinition;
export {};
