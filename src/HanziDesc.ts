import {CharDataItem, Matches} from "./HanziDictionary"

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
    mistakeCount: number;// TODO move somewhere else
    matches: Matches
    complete: boolean
};

const getCDLLen = (c: string): 0 | 2 | 3 => {
    if (!isCDLChar(c)) return 0;
    if ("⿲⿳".includes(c)) return 3;
    return 2;
};

const isCDLChar = (c: string) => {
    return c >= "⿰" && c <= "⿿";
};

export const getNextComponent = (
    decomposition: string,
    i: number = 0,
): [number, ComponentDefinition] => {
    const component = getEmptyComponent()
    const c: string = decomposition.charAt(i);
    const cdlLen = getCDLLen(c);
    i++;
    if (cdlLen) {
        component.cdl = <CDLChar>c
        for (let j = 0; j < cdlLen; j++) {
            const [nextI, subComponent] = getNextComponent(decomposition, i);
            i = nextI;
            subComponent.parent = component
            component.components.push(subComponent);
        }
    } else {
        component.character = c;
    }
    return [i, component];
};

const getEmptyComponent = ():ComponentDefinition =>{
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
        complete: false
    };
}

export const getComponentAtStrokeIdx =(strokeIdx: number,matches:Matches, cmp: ComponentDefinition):ComponentDefinition => {// TODO typing
    const match = matches[strokeIdx]
    if (match === null)
        return cmp
    for (const cmpIdx of match) {
       cmp = cmp.components[cmpIdx]
    }
    return cmp
}

export const getDecomposition = (charData: CharDataItem): ComponentDefinition => {
    const { decomposition, character, matches } = charData;
    if (!character) {
        console.warn(
            "The character data does not specify the character.",
            charData,
        );
        return getEmptyComponent();
    }

    if (decomposition.length === 0) {
        console.warn("Decomposition for character ${character} is empty.");
        return getEmptyComponent();
    }
    const [_,component] = getNextComponent(decomposition, 0);
    component.character = character;
    component.firstIdx = 0;
    component.lastIdx = matches.length-1;
    component.strokeCount = matches.length-1;
    component.matches = matches
    //if (match == null) {
    //    component.strokeCount = match.length
    //    component.firstIdx = 0
    //    component.lastIdx = strokeCount -1;
    //    return component
    //}
    matches.forEach((strokeMatch: number[] | null, strokeIdx: number) =>{
        let cmp = component
        if (strokeMatch === null) // TODO handle for example ⺈
            return
        for (const i of strokeMatch) {
            cmp = cmp.components[i]
            if (cmp.firstIdx == -1)
                cmp.firstIdx = strokeIdx;
            if (strokeIdx > cmp.lastIdx)
                cmp.lastIdx = strokeIdx
           cmp.strokeCount++;
        }
    });

    return component;
    /*
⿰ 	U+2FF0 	Ideographic description character left to right
⿱ 	U+2FF1 	Ideographic description character above to below
⿲ 	U+2FF2 	Ideographic description character left to middle and right
⿳ 	U+2FF3 	Ideographic description character above to middle and below
⿴ 	U+2FF4 	Ideographic description character full surround
⿵ 	U+2FF5 	Ideographic description character surround from above
⿶ 	U+2FF6 	Ideographic description character surround from below
⿷ 	U+2FF7 	Ideographic description character surround from left
⿼ 	U+2FFC 	Ideographic description character surround from right
⿸ 	U+2FF8 	Ideographic description character surround from upper left
⿹ 	U+2FF9 	Ideographic description character surround from upper right
⿺ 	U+2FFA 	Ideographic description character surround from lower left
⿽ 	U+2FFD 	Ideographic description character surround from lower right
⿻ 	U+2FFB 	Ideographic description character overlaid
⿾ 	U+2FFE 	Ideographic description character horizontal reflection
⿿ 	U+2FFF 	Ideographic description character rotation
*/
};
