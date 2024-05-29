
import { CharacterData } from './decompose'
import { makeUniform } from "./uniformPath";

const getCmpStrokeData = (cmp: CharacterData, i: number) : {data: CharacterData, idx: number} | undefined=> {
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

self.onmessage = ((msg: any) => {
    const morphs =  getMorphs(msg.data)
  self.postMessage(morphs);
});



  const getMorphs = (cmpData: CharacterData)  =>{

    const len = cmpData.len || 0
    const morphs = []
    for (let i = 0; i < len; i++) {
      const ret = getCmpStrokeData(cmpData, i)

      if (!ret)
        continue

      const { data, idx } = ret

      if (!data.strokes || !data.medians) // HACK
        continue
      if (!data.repartition) {
        console.warn('No repartition', data.character)
        throw new Error('ERR')
      }

      let initialPath = cmpData.strokes ? cmpData.strokes[i] : undefined; //this.paths[firstIdx + i].getAttribute('d')
      // TODO change fallback to the deepest stroke found in in the main cmp instead of this.paths[fi+i] ?
      //const initialPath = this.paths[firstIdx + i].getAttribute('d')
      //if (!initialPath) {
      //  const a = getCmpStrokeData(cmp.parent, i)
      //  if (!a)
      //    throw new Error('ERR')
      //  const { data:data2, idx:idx2 } = ret
      //  initialPath = data2.strokes[idx2]
      //}
      if (!initialPath) {
        console.log()
        console.warn('No initial path', cmpData.character, i)
        throw new Error('ERR')
      }
      if (!cmpData.strokes) {

        console.warn('No strokes', cmpData.character, i)
        throw new Error('ERR')
      }
      if (!cmpData.repartition) {
        console.warn('No repartition', cmpData.character, i)
        throw new Error('ERR')
      }

        const morph = makeUniform(
        cmpData.strokes[i],
        cmpData.repartition[i],
        data.strokes[idx],
        data.repartition[idx])

      morphs.push(morph)
    }
    return morphs
  }
