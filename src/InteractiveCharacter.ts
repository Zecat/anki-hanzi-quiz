import { CharacterData } from "./decompose";

const sum = (array: number[]): number =>
  array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

export type InteractiveCharacter = {
    mistakeCount: number; // TODO move somewhere else
    //matches: Matches;
    complete: boolean;
    svgGroup: Element | undefined;
    gridEl: HTMLElement | undefined;
    opened: boolean;
    data: CharacterData;
    parent: InteractiveCharacter|undefined;
    components: InteractiveCharacter[];
    decompositionVisible: boolean;// TODO move this
}

  export const getCmpForGridEl = (
    target: HTMLElement,
    cmp: InteractiveCharacter,
  ): InteractiveCharacter | undefined => {
    if (cmp.gridEl === target) return cmp;
    for (const subCmp of cmp.components)
      if (subCmp.gridEl === target) return subCmp;
    for (const subCmp of cmp.components) {
        const found = getCmpForGridEl(target, subCmp)
        if (found)
            return found
    }
    return undefined;
  }


export const _getEmptyInteractiveCharacter = (data: CharacterData, parent: InteractiveCharacter|undefined): InteractiveCharacter => {
   return {
    mistakeCount: 0, // TODO move somewhere else
    //matches: Matches,
    complete: false,
    svgGroup: undefined,
    gridEl: undefined,
    opened: false,
    data,
       parent,
    components: [],
    decompositionVisible: false,// TODO move this
   }
}


export const generateInteractiveCharacter = (data: CharacterData, parent: InteractiveCharacter | undefined = undefined): InteractiveCharacter => {
    const interChar = _getEmptyInteractiveCharacter(data, parent)
    interChar.components = data.components.map((dataCmp: CharacterData) => generateInteractiveCharacter(dataCmp, interChar))
    return interChar
  }

export const getComponentAbsoluteIndexes= (cmp: InteractiveCharacter): [number,number] => {
    const firstIdx = getComponentAbsoluteFirstIndex(cmp)
    const lastIdx = cmp.data.len? firstIdx + cmp.data.len -1 : 0
    return [firstIdx, lastIdx]
}
export const getComponentAbsoluteFirstIndex= (cmp: InteractiveCharacter): number => {
    const parent = cmp.parent;
    if (!parent)
        return 0
    const i = parent.components.indexOf(cmp)
    const prevSiblings = parent.components.slice(0, i)
    const prevSiblingsStrokesLen = prevSiblings.map((ps:InteractiveCharacter)=>ps.data.len||0)
    const relativeFirstIdx = sum(prevSiblingsStrokesLen)
    const firstIdx = getComponentAbsoluteFirstIndex(parent) + relativeFirstIdx
    return firstIdx
}

export const strokeIdxToCmp = (cmp: InteractiveCharacter, i: number) : InteractiveCharacter=> {
    const len = cmp.data.len || 0
    if (!cmp.components.length) {
        if (i >= len)
            throw new Error(`Stroke idx${i} not in ${cmp}`)
        return cmp
    }
    let j= 0
    for (const subCmp of cmp.components) {
        const subLen = subCmp.data.len || 0
        j+=subLen
        if (i < j)
            return strokeIdxToCmp(subCmp, i-j+subLen)
    }
            throw new Error(`Stroke idx${i} not in ${cmp}`)

}

//export const strokeIdxToSubStroke = (cmp: InteractiveCharacter, i: number) : string | undefined=> {
//    const len = cmp.data.len || 0
//    if (!cmp.components.length) {
//        if (i >= len || !cmp.data.strokes)
//            throw new Error(`Stroke idx${i} not in ${cmp}`)
//        return cmp.data.strokes[i]
//    }
//    let j= 0
//    for (const subCmp of cmp.components) {
//        const subLen = subCmp.data.len || 0
//        j+=subLen
//        if (i < j)
//            return strokeIdxToCmp(subCmp, i-j+subLen)
//    }
//            throw new Error(`Stroke idx${i} not in ${cmp}`)
//
//}

export const getCmpStrokeData = (cmp: InteractiveCharacter, i: number) : {data: CharacterData, idx: number} | undefined=> {
    let j = 0
   for (const subCmp of cmp.components) {
       const len = subCmp.data.len || 0
      j+=len
       if (i<j) {
           const relIdx = i - j + len
           if (subCmp.data.strokes)
               return {data: subCmp.data, idx:relIdx}
           else
               return getCmpStrokeData(subCmp, relIdx)
       }
   }
    return undefined
}
export const getCmpStroke = (cmp: InteractiveCharacter, i: number) : string | undefined=> {
    let j = 0
   for (const subCmp of cmp.components) {
       const len = subCmp.data.len || 0
      j+=len
       if (i<j) {
           const relIdx = i - j + len
           if (subCmp.data.strokes)
               return subCmp.data.strokes[relIdx]
           else
               return getCmpStroke(subCmp, relIdx)
       }
   }
    return undefined
}
