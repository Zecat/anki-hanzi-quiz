import { ComponentDefinition } from "./HanziDesc";

import { interpolate } from "flubber"; // ES6
//import {ComponentWorkerDefinition} from './interpolationWorker'

//const worker = new Worker(new URL('../workers/kute.worker', import.meta.url));

//import KUTE from 'kute.js';

//export interface TweenResultMessage {
//	error?: String;
//	data?: KUTE.Tween;
//}
//
//export interface TweenInputMessage {
//	elem: Element;
//	from: KUTE.tweenProps;
//	to: KUTE.tweenProps;
//	opts?: KUTE.tweenOptions;
//}

//const fromToAsync = (elem:Element, from:KUTE.tweenProps, to:KUTE.tweenProps, opts:KUTE.tweenOptions):Promise<KUTE.Tween> => {
//    //const worker = new TweenCalculationWorker();
//    worker.postMessage({elem, from, to, opts} as TweenInputMessage);
//    return new Promise((resolve, reject) => {
//        worker.onmessage = (e:MessageEvent<TweenResultMessage>) => {
//            const m = e.data;
//            if (m.error) reject(m.error);
//            else resolve(m.data);
//        }
//    });
//}


//const getWorkerDef = (cmpBase:ComponentDefinition): ComponentWorkerDefinition => {
//    return {
//    character: cmpBase.character,
//    firstIdx: cmpBase.firstIdx,
//    components: cmpBase.components.map(getWorkerDef),
//    strokes: cmpBase.strokes,
//    }
//}


const getInterpolators = (
    cmp: ComponentDefinition,
    backward: Boolean = false,
    initialStrokes: any, // TODO typing
) => {
    const interpolators = Array(initialStrokes.length).fill(undefined);
    let usedInitialStrokes: any;
    //if (cmp.character)//TODO update this
    //    usedInitialStrokes = initialStrokes.slice(cmp.firstIdx);
    if (cmp.strokes)
        usedInitialStrokes = cmp.strokes;
    else
        usedInitialStrokes = initialStrokes.slice(cmp.firstIdx);

    cmp.components
        .forEach((subCmp: ComponentDefinition) => {
            return updateInterpolators(
                subCmp,
                cmp.firstIdx,
                usedInitialStrokes,
                backward,
                interpolators,
            );
        })
    return interpolators

    //return Promise.all(promises).then(() => interpolators);
}

const updateInterpolators = (
    cmp: ComponentDefinition,
    initialStrokesFirstIdx: number,
    initialStrokes: any[],
    backward: Boolean = false,
    interpolators: any[],
) => {
    if (!initialStrokes) {
        console.warn('no initialStrokes')
        return
    }
    console.log("update interpol", cmp)
    //if (cmp.cdl && (!cmp.pinyin || !cmp.pinyin[0])) {
    //    console.log('====== recusr', cmp.character)
    //    cmp.components
    //        .forEach((subCmp: ComponentDefinition) =>
    //            updateInterpolators(
    //                subCmp,
    //                initialStrokesFirstIdx,
    //                initialStrokes,
    //                backward,
    //                interpolators,
    //            ),
    //        )
    //    return
    //}

    if (cmp.strokes === undefined)
        return;
    // edge case, strokes not found
    cmp.strokes.forEach((strokePath: any, idx: number) => {
        if (!initialStrokes[idx + cmp.firstIdx - initialStrokesFirstIdx])// TODO clarify behavior here
            return
        if (backward)
            interpolators[idx + cmp.firstIdx] = interpolate(
                strokePath,
                initialStrokes[
                idx + cmp.firstIdx - initialStrokesFirstIdx
                ],
            );
        else
            interpolators[idx + cmp.firstIdx] = interpolate(
                initialStrokes[
                idx + cmp.firstIdx - initialStrokesFirstIdx
                ],
                strokePath,
            );
    });
}


export default class CharacterInterpolator {
    animStartTime = 0;
    interpolators: any[] = [];
    initialStrokes: any[] = [];
    paths: any[] = [];
    interpolationBackward: Promise<any> | undefined = undefined;
    interpolationForward: Promise<any> | undefined = undefined;
    animDuration: number;
    precomputedForward: any = {};
    precomputedBackward: any = {};


    constructor(
        cmp: ComponentDefinition,
        initialStrokes: any[],
        animDuration: number,
        svgPaths: any[],
    ) {
        this.initialStrokes = initialStrokes;
        this.animDuration = animDuration;
        this.paths = svgPaths;
        this.precompute(cmp);
    }

    precompute(cmp: ComponentDefinition) {
        if (cmp.character && cmp.components.length) {
            //fromToAsync(this.paths[0], this.paths[0], this.paths[1], {})
            //            worker.postMessage({cmp: getWorkerDef(cmp), backward: false, initialStrokes: this.initialStrokes})
            //
            //worker.onmessage = (event) => {
            //
            //    //const result = event.data;
            //    //const fns = result.map((body:string) => {
            //    //    console.log(body)
            //    //     return new Function('e','a',`${body}`);
            //    //})
            //    //console.log(fns)
            //        //this.precomputedForward = {
            //        //    [cmp.character]: fns
            //        //};
            //};
            this.precomputedForward[cmp.character] = getInterpolators(cmp, false, this.initialStrokes);
            this.precomputedBackward[cmp.character] = getInterpolators(cmp, true, this.initialStrokes);
        }
        //cmp.components.forEach(this.precompute.bind(this))
    }

    getPrecomputedInterpolators(cmp: ComponentDefinition, backward: Boolean = false) {
        return backward
            ? this.precomputedBackward[cmp.character]
            : this.precomputedForward[cmp.character];
    }

    async run(cmp: ComponentDefinition, backward: Boolean = false) {
        try {
            this.interpolators = await this.getPrecomputedInterpolators(cmp, backward);
            if (!this.interpolators) {
                console.warn("No interpolation found");
                return;
            }
            this.anim();
        } catch (e) {
            console.warn(e);
        }
    }

    anim() {
        //const animationOptions = {
        //    duration: 1000, // Animation duration in milliseconds
        //    easing: 'ease', // Timing function
        //};
        //const keyframeEffect = new KeyframeEffect(null, null, animationOptions);
        //this.animation = new Animation(keyframeEffect, document.timeline);
        //this.animation.play();

        requestAnimationFrame(this._anim.bind(this));
    }
    _anim(time: number) {
        this.animStartTime = time;
        this._drawAnim(this.animStartTime);
    }

    _drawAnim(time: number) {
        let progress = this.progress(time);

        this.strokeUpdate(progress);

        if (progress < 1) {
            requestAnimationFrame(this._drawAnim.bind(this));
        }
    }

    strokeUpdate(progress: number) {
        for (let i = 0; i < this.interpolators.length; i++) {
            if (!this.interpolators[i]) continue;
            const strokePath = this.interpolators[i](progress);
            this.paths[i].setAttribute("d", strokePath);
        }
    }

    progress(time: number) {
        const progressDuration = time - this.animStartTime;
        return progressDuration / this.animDuration;
    }
}
