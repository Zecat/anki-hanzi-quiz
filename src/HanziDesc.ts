import { CharDataItem } from "./HanziDictionary";

//import HanziWriter from "hanzi-writer";

type Matches = ComponentDefinition[];

type CDLChar =
    | "⿰"
    | "⿱"
    | "⿴"
    | "⿵"
    | "⿶"
    | "⿷"
    | "⿼"
    | "⿸"
    | "⿹"
    | "⿺"
    | "⿽"
    | "⿻"
    | "⿾"
    | "⿿"
    | "⿲"
    | "⿳";

//type SingleChar = string & { length: 1 };

export type ComponentDefinition = {
    character: string;
    firstIdx: number;
    lastIdx: number;
    strokeCount: number;
    parent: ComponentDefinition | null;
    components: ComponentDefinition[];
    cdl: CDLChar | null;
    mistakeCount: number; // TODO move somewhere else
    matches: Matches;
    complete: boolean;
    svgGroup: Element | undefined;
    gridEl: HTMLElement | undefined;
    scaleFactor: number,
    cumulativeScaleFactor: number,
};

const getCDLLen = (c: string): 0 | 2 | 3 => {
    if (!isCDLChar(c)) return 0;
    if ("⿲⿳".includes(c)) return 3;
    return 2;
};

const isCDLChar = (c: string) => {
    return c >= "⿰" && c <= "⿿";
};
function getNextNumber(input: string[], idx: number): { number: number | null, length: number } {
    let numberStr = '';
    input = input.slice(idx)

    for (const char of input) {
        if (/[0-9]/.test(char)) {
            numberStr += char;
        } else {
            break;
        }
    }

    const nextNumber = numberStr.length > 0 ? parseInt(numberStr, 10) : null;

    return { number: nextNumber, length: numberStr.length };
}

const handleCdl = (component: ComponentDefinition, cdl: CDLChar,cdlLen:number,
                    acjk: string[],
                    acjkIdx:number,
                    strokeIdx:number,) : [number, number]=> {
            component.cdl = cdl;
            for (let j = 0; j < cdlLen; j++) {
                const [nextDecIdx, nextStrokeIdx, subComponent] = getNextComponent(
                    acjk,
                    acjkIdx,
                    strokeIdx,
                );
                acjkIdx = nextDecIdx;
                strokeIdx = nextStrokeIdx;
                subComponent.parent = component;
                component.components.push(subComponent);
                if (subComponent.lastIdx > component.lastIdx)
                    component.lastIdx = subComponent.lastIdx
            }
    return [acjkIdx, strokeIdx]
}
export const getNextComponent = (
    acjk: string[],
    acjkIdx: number = 0,
    strokeIdx: number = 0,
): [number, number, ComponentDefinition] => {
    const component = getEmptyComponent();
    const c: string = acjk[acjkIdx];

    let cdlLen = getCDLLen(c);
    acjkIdx++;
    component.firstIdx = strokeIdx;
    if (cdlLen) {
       [acjkIdx, strokeIdx] = handleCdl(component, c as CDLChar, cdlLen, acjk, acjkIdx, strokeIdx,)
        if (acjkIdx >= acjk.length)
            return [acjkIdx, strokeIdx, component];
    } else {
        component.character = c;
    }
    const {number: charLen, length: forward} = getNextNumber(acjk, acjkIdx)
    const c2: string = acjk[acjkIdx];
    if (charLen != null) {
        component.lastIdx = strokeIdx + charLen - 1;
        acjkIdx+=forward;
        strokeIdx += charLen;
    } else if (c2 == ":") {
        acjkIdx++;
        const c3: string = acjk[acjkIdx];
        const partialCharLen = toDigit(c3);
        if (isNaN(partialCharLen)) throw new Error("Digit expected");
        component.lastIdx += partialCharLen;
        strokeIdx += partialCharLen;
    } else {
        cdlLen = getCDLLen(c2);
        if (cdlLen) {
            acjkIdx++;
            [acjkIdx, strokeIdx] = handleCdl(component, c2 as CDLChar, cdlLen, acjk, acjkIdx, strokeIdx,)
        } else {
            throw new Error(`Unexpected character ${c2} in acjk:"${acjk}"`)
        }
    }
    return [acjkIdx, strokeIdx, component];
};

function toDigit(char: string) {
    if (isDigit(char)) {
        return parseInt(char);
    } else {
        return NaN; // Not a digit
    }
}

const getEmptyComponent = (): ComponentDefinition => {
    return {
        character: "",
        firstIdx: -1,
        lastIdx: -1,
        strokeCount: 0,
        parent: null,
        components: [],
        cdl: null,
        mistakeCount: 0,
        matches: [],
        complete: false,
        svgGroup: undefined,
        gridEl: undefined,
    scaleFactor: 1,
    cumulativeScaleFactor: 1,
    };
};

function isDigit(char: string) {
    return /^\d$/.test(char);
}

function removeDots(str: string) {
    return str.replace(/\./g, "");
}

function assignSubMatches(cmp: ComponentDefinition, matches: Matches) {
    for (const subCmp of cmp.components) {
        for (let i = subCmp.firstIdx; i <= subCmp.lastIdx; i++) {
            matches[i] = subCmp;
            assignSubMatches(subCmp, matches);
        }
    }
}

export const getDecomposition = (
    charData: CharDataItem,
): ComponentDefinition => {
    const { character, acjk } = charData;
    const acjk_cleaned = [...removeDots(acjk)];
    if (!character) {
        console.warn(
            "The character data does not specify the character.",
            charData,
        );
        return getEmptyComponent();
    }

    if (acjk_cleaned.length === 0) {
        console.warn("acjk for character ${character} is empty.");
        return getEmptyComponent();
    }
    const [_, lastStrokeIdx, component] = getNextComponent(acjk_cleaned, 0, 0);
    //component.character = character;
    component.mistakeCount = 0;
    component.firstIdx = 0;
    component.lastIdx = lastStrokeIdx;
    component.matches = Array(lastStrokeIdx + 1).fill(component);
    assignSubMatches(component, component.matches);
    //if (component.character)
    //    component.characterDataPromise = HanziWriter.loadCharacterData(component.character)

    return component;
    /*⿰*
⿰   ⿱   U+2FF0 	Ideographic description character left to right
⿱   ⿲   U+2FF1 	Ideographic description character above to below
⿲   ⿳   U+2FF2 	Ideographic description character left to middle and right
⿳   ⿴   U+2FF3 	Ideographic description character above to middle and below
⿴   ⿵   U+2FF4 	Ideographic description character full surround
⿵   ⿶   U+2FF5 	Ideographic description character surround from above
⿶   ⿷   U+2FF6 	Ideographic description character surround from below
⿷   ⿼   U+2FF7 	Ideographic description character surround from left
⿼ 	U⿸+2FFC 	Ideographic description character surround from right
⿸   ⿹   U+2FF8 	Ideographic description character surround from upper left
⿹   ⿺   U+2FF9 	Ideographic description character surround from upper right
⿺   ⿽   U+2FFA 	Ideographic description character surround from lower left
⿽ 	U⿻+2FFD 	Ideographic description character surround from lower right
⿻   ⿾   U+2FFB 	Ideographic description character overlaid
⿾ 	U⿿+2FFE 	Ideographic description character horizontal reflection
⿿ 	U+2FFF 	Ideographic description character rotation
*/
};
