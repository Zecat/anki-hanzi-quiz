import { CharacterData } from "./decompose";
//import { makeUniform } from "./uniformPath";


const sum = (array: number[]): number =>
  array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

export type InteractiveCharacter = {
    mistakeCount: number; // TODO move somewhere else
    //matches: Matches;
    complete: boolean;
    svgGroup: Element | undefined;
    gridEl: HTMLElement | undefined;
    charContentEl: HTMLElement | undefined;
    charAreaEl: HTMLElement | undefined;
    opened: boolean;
    data: CharacterData;
    parent: InteractiveCharacter|undefined;
    components: InteractiveCharacter[];
    decompositionVisible: boolean;// TODO move this
    prevRect: any;
    //morph: any
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
       prevRect: undefined,
     charContentEl: undefined,
     charAreaEl: undefined,
    //morph: undefined
   }
}


  //const getMorphs = (cmpData: CharacterData) =>{

  //  const len = cmpData.len || 0
  //  const morphs = []
  //  for (let i = 0; i < len; i++) {
  //    const ret = getCmpStrokeData(cmpData, i)

  //    if (!ret)
  //      continue

  //    const { data, idx } = ret

  //    if (!data.strokes || !data.medians) // HACK
  //      continue
  //    if (!data.repartition) {
  //      console.warn('No repartition', data.character)
  //      throw new Error('ERR')
  //    }

  //    let initialPath = cmpData.strokes ? cmpData.strokes[i] : undefined; //this.paths[firstIdx + i].getAttribute('d')
  //    // TODO change fallback to the deepest stroke found in in the main cmp instead of this.paths[fi+i] ?
  //    //const initialPath = this.paths[firstIdx + i].getAttribute('d')
  //    //if (!initialPath) {
  //    //  const a = getCmpStrokeData(cmp.parent, i)
  //    //  if (!a)
  //    //    throw new Error('ERR')
  //    //  const { data:data2, idx:idx2 } = ret
  //    //  initialPath = data2.strokes[idx2]
  //    //}
  //    if (!initialPath) {
  //      console.log()
  //      console.warn('No initial path', cmpData.character, i)
  //      throw new Error('ERR')
  //    }
  //    if (!cmpData.strokes) {

  //      console.warn('No strokes', cmpData.character, i)
  //      throw new Error('ERR')
  //    }
  //    if (!cmpData.repartition) {
  //      console.warn('No repartition', cmpData.character, i)
  //      throw new Error('ERR')
  //    }

  //      const morph = makeUniform(
  //      cmpData.strokes[i],
  //      cmpData.repartition[i],
  //      data.strokes[idx],
  //      data.repartition[idx])

  //    morphs.push(morph)
  //  }
  //  return morphs
  //}

export const generateInteractiveCharacter = (data: CharacterData, parent: InteractiveCharacter | undefined = undefined): InteractiveCharacter => {
    const interChar = _getEmptyInteractiveCharacter(data, parent)
    //interChar.morph = getMorphs(data)
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


export const getCmpStrokeData = (cmp: CharacterData, i: number) : {data: CharacterData, idx: number} | undefined=> {
    let j = 0
   for (const subCmp of cmp.components) {
       const len = subCmp.len || 0
      j+=len
       if (i<j) {
           const relIdx = i - j + len
           if (subCmp.strokes)
               return {data: subCmp, idx:relIdx}
           //else if (subCmp.character && subCmp.pinyin)
           //    // NOTE If stroke data not found, fallback to the parent stroke subset
           //    return {data: subCmp, idx:relIdx}
           else
               return getCmpStrokeData(subCmp, relIdx)
       }
   }
    return undefined
}

//export const getCmpStrokeData = (cmp: InteractiveCharacter, i: number) : {data: CharacterData, idx: number} | undefined=> {
//    let j = 0
//   for (const subCmp of cmp.components) {
//       const len = subCmp.data.len || 0
//      j+=len
//       if (i<j) {
//           const relIdx = i - j + len
//           console.log(subCmp.data.character, subCmp.data.strokes)
//           if (subCmp.data.strokes)
//               return {data: subCmp.data, idx:relIdx}
//           else if (subCmp.data.character && subCmp.data.pinyin)
//               // NOTE If stroke data not found, fallback to the parent stroke subset
//               return {data: subCmp.data, idx:relIdx}
//           else
//               return getCmpStrokeData(subCmp, relIdx)
//       }
//   }
//    return undefined
//}
//export const getCmpStroke = (cmp: InteractiveCharacter, i: number) : string | undefined=> {
//    let j = 0
//   for (const subCmp of cmp.components) {
//       const len = subCmp.data.len || 0
//      j+=len
//       if (i<j) {
//           const relIdx = i - j + len
//           if (subCmp.data.strokes)
//               return subCmp.data.strokes[relIdx]
//           else
//               return getCmpStroke(subCmp, relIdx)
//       }
//   }
//    return undefined
//}
