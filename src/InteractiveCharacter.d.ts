import { CharacterData } from "./decompose";
export type InteractiveCharacter = {
    mistakeCount: number;
    complete: boolean;
    svgGroup: Element | undefined;
    gridEl: HTMLElement | undefined;
    opened: boolean;
    data: CharacterData;
    parent: InteractiveCharacter | undefined;
    components: InteractiveCharacter[];
};
export declare const getCmpForGridEl: (target: HTMLElement, cmp: InteractiveCharacter) => InteractiveCharacter | undefined;
export declare const _getEmptyInteractiveCharacter: (data: CharacterData, parent: InteractiveCharacter | undefined) => InteractiveCharacter;
export declare const generateInteractiveCharacter: (data: CharacterData, parent?: InteractiveCharacter | undefined) => InteractiveCharacter;
export declare const getComponentAbsoluteIndexes: (cmp: InteractiveCharacter) => [number, number];
export declare const getComponentAbsoluteFirstIndex: (cmp: InteractiveCharacter) => number;
export declare const strokeIdxToCmp: (cmp: InteractiveCharacter, i: number) => InteractiveCharacter;
export declare const getCmpStrokeData: (cmp: InteractiveCharacter, i: number) => {
    data: CharacterData;
    idx: number;
} | undefined;
export declare const getCmpStroke: (cmp: InteractiveCharacter, i: number) => string | undefined;
