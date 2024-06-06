import { setup, observe, computedProperty } from 'pouic'
//import { getDecomposition, ComponentDefinition } from "./HanziDesc";


//import { fetchCharacter, CharDataItem } from "./fetchCharacter";
import { getCharacterData } from './decompose'

import { cleanDescription, cleanPinyin, getPinyinTone, cleanAndGetPinyinTone } from './processData'
import { InteractiveCharacter, generateInteractiveCharacter } from './InteractiveCharacter'
import { getAnkiCardType } from './anki_api'

const initialState: any = {
  ankiCardType: -2, // indicating unfetched
  minusone: (a: any) => a - 1,
  equal: (a: any, b: any) => a === b,
  hanzi: '',
  hanziData: [],
  selectedIdx: 0,
  strokesVisible: false,
  rating: 4,
  hanziWriters: {},
  lastFirstOrderCmp: undefined,
  sentences: [],
  sentence: "",

  pinyinAsQuestion: computedProperty(['ankiCardType', 'sentence'], function (ankiCardType: number, sentence: string) {
    return ankiCardType == 2 && sentence // 2 for card state 'review' // TODO create enum
  }),

  sentenceDisplayed: computedProperty(['sentences.length'], function (sentencesCount: number) {
    return sentencesCount > 0
  }),

  canChangeSentence: computedProperty(['sentences.length'], function (sentencesCount: number) {
    return sentencesCount > 1
  }),

  selectCharacterIdx: (idx: number) => {
    state.selectedIdx = idx;
  },

  cleanPinyin,
  cleanDescription,
  getPinyinTone,
  cleanAndGetPinyinTone,

  prev: () => {
    state.selectedIdx = Math.max(0, state.selectedIdx - 1)
  },
  next: () => {
    state.selectedIdx = Math.min(state.hanziData.length - 1, state.selectedIdx + 1)
  },

  prevBtnVisible: computedProperty(['selectedIdx', 'currentComponent.complete'], function (idx: number, complete: boolean) {
    return idx > 0 && complete
  }),

  nextBtnVisible: computedProperty(['selectedIdx', 'hanziData.length', 'currentComponent.complete'], function (idx: number, len: number, complete: boolean) {
    return idx < len - 1 && complete
  }),

  recomposeDisabled: computedProperty(['currentComponent.decompositionVisible', 'currentComponent.opened'], function (visible: boolean, opened: boolean) {
    return visible && !opened
  }),

  complete: computedProperty(['selectedIdx', 'hanziData.length', 'currentComponent.complete'], function () {
    if (state.hanziData.length && state.hanziData.every((cmp: InteractiveCharacter) => cmp.complete))
      return true
    return false
  }),

  currentComponent: computedProperty(['selectedIdx', 'hanziData', 'hanziData.length'], function (idx: number) {
    return state.hanziData && state.hanziData[idx]
  }),

  getCurrentHanziWriter: () => state.hanziWriters[state.currentComponent?.data?.character]?.__target,

  resetComponentMistakes: (cmp: InteractiveCharacter = state.currentComponent) => {
    cmp.mistakeCount = 0;
    cmp.components.forEach(state.resetComponentMistakes)
  },

  restartCurrentQuiz: () => {
    state.currentComponent.decompositionVisible = false
    state.resetComponentMistakes()
    state.getCurrentHanziWriter()?.quiz({ quizStartStrokeNum: 0 })
    state.lastFirstOrderCmp = undefined
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

observe('selectedIdx', () => {
  state.lastFirstOrderCmp = undefined
})

observe('hanzi', (newValue: string) => {
  const promises = Array.from(newValue).map(getCharacterData)
  Promise.all(promises).then((data) => state.hanziData = data.map(d => generateInteractiveCharacter(d)))
})

getAnkiCardType().then((type:number) => {
  state.ankiCardType = type
})
