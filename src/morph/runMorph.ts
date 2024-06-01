import { InteractiveCharacter, getComponentAbsoluteFirstIndex } from "../InteractiveCharacter";
import { getMediaUrl } from "../anki_api";

const worker = new Worker(getMediaUrl('_morphWorker.js'))
// TODO fallback with no worker ?

// TODO paths typing
 export const runMorph = (paths: any, cmp: InteractiveCharacter, backward: boolean = false) => {
    //const morphs = this.getMorphs(cmp.data)

    //morphs.forEach((m: any, i: number) => {
    //  this.paths[firstIdx + i].setAttribute("d", m[backward ? 1 : 0]);
    //})

    //requestAnimationFrame(() => {
    //  morphs.forEach((m: any, i: number) => {
    //    this.paths[firstIdx + i].setAttribute("d", m[backward ? 0 : 1]);
    //  })
    //})
    const { promise, resolve } = Promise.withResolvers();

    const firstIdx = getComponentAbsoluteFirstIndex(cmp)

    worker.onmessage = (event) => {
    requestAnimationFrame(() => {
      const morphs = event.data as string[][]
    morphs.forEach((m, i) => {
      paths[firstIdx + i].setAttribute("d", m[backward ? 1 : 0]);
    })
    requestAnimationFrame(() => {

      morphs.forEach((m, i) => {
        paths[firstIdx + i].setAttribute("d", m[backward ? 0 : 1]);
      })
      resolve('')
    })
    })
    };

    worker.postMessage(cmp.data)
    return promise

  }
