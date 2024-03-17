import { setup, observe, computedProperty } from 'pouic'
import { getDecomposition, ComponentDefinition } from "./HanziDesc";


import HanziDictionary, {CharDataItem} from "./HanziDictionary";
//import {CharDataItem} from "./HanziDesc";

const dict: HanziDictionary = new HanziDictionary();

export type ComponentData = CharDataItem & ComponentDefinition

const initialState:any = {
  minusone: (a: any) => a - 1,
  equal: (a:any, b:any) => a === b,
  hanzi: '',
  toto: false,
  hanziData: [],
  selectedIdx: 0,
  strokesVisible: false,
  rating: 4,
  hanziWriters: {},

  selectCharacterIdx: (idx: number)  => {
   state.selectedIdx = idx;
  },

  prev:() => state.selectedIdx = Math.max(0, state.selectedIdx-1),
  next:()=> state.selectedIdx = Math.min(state.hanziData.length-1, state.selectedIdx+1),

  prevBtnVisible: computedProperty(['selectedIdx', 'currentComponent.complete'], function (idx: number, complete: boolean) {
    return idx > 0 && complete
  }),

  nextBtnVisible: computedProperty(['selectedIdx', 'hanziData.length','currentComponent.complete'], function (idx: number, len: number, complete: boolean) {
    return idx < len - 1 && complete
  }),

  complete: computedProperty(['selectedIdx', 'hanziData.length','currentComponent.complete'], function () {
    if (state.hanziData.length && state.hanziData.every((cmp: ComponentData) => cmp.complete))
      return true
    return false
  }),

  currentComponent: computedProperty(['selectedIdx', 'hanziData', 'hanziData.length'], function (idx: number) {
    return state.hanziData && state.hanziData[idx]
  }),

  getCurrentHanziWriter: () => state.hanziWriters[state.currentComponent?.character]?.__target,

  resetComponentMistakes: (cmp:ComponentData = state.currentComponent)=>{
    cmp.mistakeCount = 0;
    cmp.components.forEach(state.resetComponentMistakes)
  },

  restartCurrentQuiz: () => {
    state.resetComponentMistakes()
    state.getCurrentHanziWriter()?.quiz({quizStartStrokeNum:0})
  },

  breiflyShowAndRestartQuiz: () => {
    const hw = state.getCurrentHanziWriter()
    state.rating = 1
    if (!hw)
      return
    hw.showOutline();
    setTimeout(() => {
      hw.hideOutline();
      state.restartCurrentQuiz()
    }, 3000);
  }

}

export const state = setup(initialState)

observe('hanzi', (newValue: string) => {
  const hanziData: CharDataItem[] = []
  const promisesArray = Array.from(newValue).map((char:string, i:number) => {
    return dict.get(char).then((charData: CharDataItem ) => {
      const cmpDef: ComponentDefinition = getDecomposition(charData)
      hanziData[i] = Object.assign(cmpDef, charData) ; // TODO better typing
    })
  })
  Promise.all(promisesArray).then(() => {
hanziData.forEach(hd => state.hanziData.push(hd))
                   })
})
