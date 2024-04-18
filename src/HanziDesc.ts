//import { fetchCharacter } from "./fetchCharacter";
//
////import {dict} from './state'
//
////import HanziWriter from "hanzi-writer";
//
////import { fetchCharacter } from "./fetchCharacter";
////const worker = new Worker('worker.js');
////
////worker.onmessage = (event) => {
////    const result = event.data;
////    console.log('Result:', result);
////    //const a = document.createElement('div');
////    //a.style.background = 'red'
////    //a.style.width = '200px'
////    //a.style.height = '200px'
////    //a.style.position = 'absolute'
////    //a.style.top = '0'
////    //document.body.appendChild(a)
////};
////
////// Start the expensive computation
////const data = 10; // Example input data
////worker.postMessage(data);
//
////const strokesDict = fetchMedia('graphicsZhHans.json')
////    .then((response) => {
////        if (!response.ok) {
////            throw new Error("Dictionnary fetch request was not ok");
////        }
////        //response.text().then(a => state.toto = `data: ${a.substring(0, 100)}`)
////        return response.json();
////    })
////    .catch((err) => {
////        throw new Error("Dictionary fetch request failed: " + err);
////    });
////const characterBaseFolder = '_characters'
////const getStrokesData = async (char: string) => {
////    return fetchMedia(`${characterBaseFolder}/${char}.json`)
////    .then((response) => {
////        if (!response.ok) {
////            throw new Error("Dictionnary fetch request was not ok");
////        }
////        return response.json();
////    })
////    .catch((err) => {
////        throw new Error("Dictionary fetch request failed: " + err);
////    });
////}
//
//type Matches = ComponentDefinition[];
//
//type CDLChar =
//    | "⿰"
//    | "⿱"
//    | "⿴"
//    | "⿵"
//    | "⿶"
//    | "⿷"
//    | "⿼"
//    | "⿸"
//    | "⿹"
//    | "⿺"
//    | "⿽"
//    | "⿻"
//    | "⿾"
//    | "⿿"
//    | "⿲"
//    | "⿳";
//
//
//export type CharacterComponent = {
//    firstIdx: number;
//    lastIdx: number;
//    parent: ComponentDefinition | undefined;
//    data: CharacterData | undefined;
//};
//
//export type CharacterData = {
//    character: string;
//    //strokeLen: number;
//    components: CharacterComponent[];
//    cdl: CDLChar | null;
//    strokes: string[] | undefined;
//    medians: string[] | undefined;
//    radical: string | undefined;
//    pinyin: string[];
//    decomposition: string;
//    definition: string;
//    acjk: string;
//};
//
//cachedCharacterData = {}
//
////type SingleChar = string & { length: 1 };
//
////export type ComponentDefinition = {
////    character: string;
////    firstIdx: number;
////    lastIdx: number;
////    parent: ComponentDefinition | null;
////    components: ComponentDefinition[];
////    cdl: CDLChar | null;
////    mistakeCount: number; // TODO move somewhere else
////    matches: Matches;
////    complete: boolean;
////    svgGroup: Element | undefined;
////    gridEl: HTMLElement | undefined;
////    scaleFactor: number;
////    cumulativeScaleFactor: number;
////    opened: boolean;
////    strokes: string[] | undefined;
////    medians: string[] | undefined;
////    radical: string | undefined;
////    pinyin: string[];
////    decomposition: string;
////    definition: string;
////    acjk: string;
////};
//
//const getCDLLen = (c: string): 0 | 2 | 3 => {
//    if (!isCDLChar(c)) return 0;
//    if ("⿲⿳".includes(c)) return 3;
//    return 2;
//};
//
//const isCDLChar = (c: string) => {
//    return c >= "⿰" && c <= "⿿";
//};
//function getNextNumber(
//    input: string[],
//    idx: number,
//): { number: number | null; length: number } {
//    let numberStr = "";
//    input = input.slice(idx);
//
//    for (const char of input) {
//        if (/[0-9]/.test(char)) {
//            numberStr += char;
//        } else {
//            break;
//        }
//    }
//
//    const nextNumber = numberStr.length > 0 ? parseInt(numberStr, 10) : null;
//
//    return { number: nextNumber, length: numberStr.length };
//}
//
//const handleCdl = async (
//    component: CharacterComponent,
//    cdl: CDLChar,
//    cdlLen: number,
//    acjk: string[],
//    acjkIdx: number,
//    strokeIdx: number,
//): Promise<[number, number]> => {
//    component.data.cdl = cdl;
//    for (let j = 0; j < cdlLen; j++) {
//        const [nextDecIdx, nextStrokeIdx, subComponent] =
//            await getNextComponent(acjk, acjkIdx, strokeIdx);
//        acjkIdx = nextDecIdx;
//        strokeIdx = nextStrokeIdx;
//        subComponent.parent = component;
//        component.data.components.push(subComponent);
//        if (subComponent.lastIdx > component.lastIdx)
//            component.lastIdx = subComponent.lastIdx;
//    }
//    return [acjkIdx, strokeIdx];
//};
//export const getNextComponent = async (
//    acjk: string[],
//    acjkIdx: number = 0,
//    strokeIdx: number = 0,
//): Promise<[number, number, CharacterComponent]> => {
//    const component = getEmptyComponent();
//    const c: string = acjk[acjkIdx];
//
//    let cdlLen = getCDLLen(c);
//    acjkIdx++;
//    component.firstIdx = strokeIdx;
//    if (cdlLen) {
//        [acjkIdx, strokeIdx] = await handleCdl(
//            component,
//            c as CDLChar,
//            cdlLen,
//            acjk,
//            acjkIdx,
//            strokeIdx,
//        );
//        if (acjkIdx >= acjk.length) return [acjkIdx, strokeIdx, component];
//    } else {
//        component.data.character = c;
//    }
//    const { number: charLen, length: forward } = getNextNumber(acjk, acjkIdx);
//    const c2: string = acjk[acjkIdx];
//    if (charLen != null) {
//        component.lastIdx = strokeIdx + charLen - 1;
//        acjkIdx += forward;
//        strokeIdx += charLen;
//    } else if (c2 == ":") {
//        acjkIdx++;
//        const c3: string = acjk[acjkIdx];
//        const partialCharLen = toDigit(c3);
//        if (isNaN(partialCharLen)) throw new Error("Digit expected");
//        component.lastIdx += partialCharLen;
//        strokeIdx += partialCharLen;
//    } else {
//        cdlLen = getCDLLen(c2);
//        if (cdlLen) {
//            acjkIdx++;
//            [acjkIdx, strokeIdx] = await handleCdl(
//                component,
//                c2 as CDLChar,
//                cdlLen,
//                acjk,
//                acjkIdx,
//                strokeIdx,
//            );
//        }
//        //else {
//        //    throw new Error(`Unexpected character ${c2} in acjk:"${acjk}"`)
//        //}
//    }
//
//    if (component.character) {
//        try {
//            const data = await fetchCharacter(component.character);
//            component.data = data
//            //component.pinyin = data.pinyin;
//            //component.decomposition = data.decomposition;
//            //component.definition = data.definition;
//            //component.acjk = data.acjk;
//            //component.strokes = data.strokes;
//            //component.medians = data.medians;
//          //
//            //if (
//            //    !component.components.length &&
//            //    component.decomposition != component.character &&
//            //    component.acjk
//            //) {
//            //    const cmp = await _getDecomposition(
//            //        component.acjk,
//            //        component.firstIdx,
//            //    );
//            //    component.components = cmp.components;
//            //    component.cdl = cmp.cdl;
//            //    component.components.forEach((sc: any) => {
//            //        sc.parent = component;
//            //        //sc.firstIdx += component.firstIdx
//            //        //sc.lastIdx += component.firstIdx
//            //    });
//            //}
//        } catch (e) {
//            console.warn(e);
//        }
//        //    component.strokes = await fetchCharacter(component.character)/*HanziWriter.loadCharacterData(component.character)*/.catch(e => {
//        //        console.warn(e)
//        //        return e
//        //    })
//    }
//    return [acjkIdx, strokeIdx, component];
//};
//
//function toDigit(char: string) {
//    if (isDigit(char)) {
//        return parseInt(char);
//    } else {
//        return NaN; // Not a digit
//    }
//}
//
//const getEmptyComponent = (): ComponentDefinition => {
//    return {
//
//    firstIdx: -1,
//    lastIdx: -1,
//    parent: undefined,
//    data: undefined,
//    //    character: "",
//    //    firstIdx: -1,
//    //    lastIdx: -1,
//    //    parent: null,
//    //    components: [],
//    //    cdl: null,
//    //    mistakeCount: 0,
//    //    matches: [],
//    //    complete: false,
//    //    svgGroup: undefined,
//    //    gridEl: undefined,
//    //    scaleFactor: 1,
//    //    cumulativeScaleFactor: 1,
//    //    opened: false,
//    //    strokes: undefined,
//    //    medians: undefined,
//    //    radical: undefined,
//    //    pinyin: [],
//    //    decomposition: "",
//    //    definition: "",
//    //    acjk: "",
//    };
//};
//
//function isDigit(char: string) {
//    return /^\d$/.test(char);
//}
//
//function removeDots(str: string) {
//    if (!str) return "";
//    return str.replace(/\./g, "");
//}
//
//function assignSubMatches(cmp: ComponentDefinition, matches: Matches) {
//    for (const subCmp of cmp.components) {
//        for (let i = subCmp.firstIdx; i <= subCmp.lastIdx; i++) {
//            matches[i] = subCmp;
//            assignSubMatches(subCmp, matches);
//        }
//    }
//}
//
//const _getDecomposition = async (
//    acjk: string,
//    strokeIdx: number,
//): Promise<ComponentDefinition> => {
//    const acjk_cleaned = [...removeDots(acjk)];
//    if (acjk_cleaned.length === 0) {
//        console.warn("acjk is empty.");
//        return getEmptyComponent();
//    }
//    const ret = await getNextComponent(acjk_cleaned, strokeIdx, 0);
//    return ret[2];
//};
//
//export const getDecomposition = async (
//    //charData: CharDataItem,
//    acjk: string,
//): Promise<ComponentDefinition> => {
//    const acjk_cleaned = [...removeDots(acjk)];
//    //if (!character) {
//    //    console.warn(
//    //        "The character data does not specify the character.",
//    //        charData,
//    //    );
//    //    return getEmptyComponent();
//    //}
//
//    if (acjk_cleaned.length === 0) {
//        console.warn("acjk is empty.");
//        return getEmptyComponent();
//    }
//    // TODO To handle alternative radical, the interface should handle interpolation between character with different stroke number
//    //const radDesc = [...charData.radical] // convert to array because charatcer might have len of 2
//    //const rad = radDesc[0]
//    //const alternativeRad = radDesc[3]
//    //if (rad && alternativeRad) {
//    //    acjk_cleaned = acjk_cleaned.map(item => item === rad ? alternativeRad : item);
//    //}
//
//    const [_, lastStrokeIdx, component] = await getNextComponent(
//        acjk_cleaned,
//        0,
//        0,
//    );
//    component.mistakeCount = 0;
//    component.matches = Array(lastStrokeIdx + 1).fill(component);
//    assignSubMatches(component, component.matches);
//    //if (component.character)
//    //    component.characterDataPromise = HanziWriter.loadCharacterData(component.character)
//
//    return component;
//    /*⿰*
//⿰   ⿱   U+2FF0 	Ideographic description character left to right
//⿱   ⿲   U+2FF1 	Ideographic description character above to below
//⿲   ⿳   U+2FF2 	Ideographic description character left to middle and right
//⿳   ⿴   U+2FF3 	Ideographic description character above to middle and below
//⿴   ⿵   U+2FF4 	Ideographic description character full surround
//⿵   ⿶   U+2FF5 	Ideographic description character surround from above
//⿶   ⿷   U+2FF6 	Ideographic description character surround from below
//⿷   ⿼   U+2FF7 	Ideographic description character surround from left
//⿼ 	U⿸+2FFC 	Ideographic description character surround from right
//⿸   ⿹   U+2FF8 	Ideographic description character surround from upper left
//⿹   ⿺   U+2FF9 	Ideographic description character surround from upper right
//⿺   ⿽   U+2FFA 	Ideographic description character surround from lower left
//⿽ 	U⿻+2FFD 	Ideographic description character surround from lower right
//⿻   ⿾   U+2FFB 	Ideographic description character overlaid
//⿾ 	U⿿+2FFE 	Ideographic description character horizontal reflection
//⿿ 	U+2FFF 	Ideographic description character rotation
//*/
//};
