//import { interpolate } from "flubber"; // ES6
//import { ComponentDefinition } from "./HanziDesc";
//
//export default class CharacterInterpolator {
//    animStartTime = 0;
//    interpolators: any[] = [];
//    initialStrokes: any[] = [];
//    paths: any[] = [];
//    interpolationBackward: Promise<any> | undefined = undefined;
//    interpolationForward: Promise<any> | undefined = undefined;
//    animDuration: number;
//    precomputedForward: any = {};
//    precomputedBackward: any = {};
//
//    constructor(
//        cmp: ComponentDefinition,
//        initialStrokes: any[],
//        animDuration: number,
//        svgPaths: any[],
//    ) {
//        this.initialStrokes = initialStrokes;
//        this.animDuration = animDuration;
//        this.paths = svgPaths;
//        this.precompute(cmp);
//    }
//
//    precompute(cmp: ComponentDefinition) {
//        if (cmp.character && cmp.components.length) {
//        this.precomputedForward = {
//            [cmp.character]: this.getInterpolators(cmp, false, this.initialStrokes),
//        };
//        this.precomputedBackward = {
//            [cmp.character]: this.getInterpolators(cmp, true, this.initialStrokes),
//        };
//        }
//        cmp.components.forEach(this.precompute.bind(this))
//    }
//
//    getPrecomputedInterpolators(cmp: ComponentDefinition, backward: Boolean = false) {
//        return backward
//            ? this.precomputedBackward[cmp.character]
//            : this.precomputedForward[cmp.character];
//    }
//
//    async run(cmp: ComponentDefinition, backward: Boolean = false) {
//        try {
//            this.interpolators = await this.getPrecomputedInterpolators(cmp, backward);
//            if (!this.interpolators) {
//                console.warn("No interpolation found");
//                return;
//            }
//            this.anim();
//        } catch (e) {
//            console.warn(e);
//        }
//    }
//
//    async getInterpolators(
//        cmp: ComponentDefinition,
//        backward: Boolean = false,
//        initialStrokes: any, // TODO typing
//    ) {
//        const interpolators = Array(initialStrokes.length).fill(undefined);
//        let usedInitialStrokes: any;
//        if (!cmp.character)
//            usedInitialStrokes = initialStrokes.slice(cmp.firstIdx);
//        else {
//            try {
//                const cmpData: any = await cmp.strokesPromise;
//
//                usedInitialStrokes = cmpData.strokes;
//            } catch (e) {
//                console.log(e);
//                usedInitialStrokes = initialStrokes.slice(cmp.firstIdx);
//            }
//        }
//        const promises = cmp.components
//            .map((subCmp: ComponentDefinition) => {
//                return this.updateInterpolators(
//                    subCmp,
//                    0,
//                    usedInitialStrokes,
//                    backward,
//                    interpolators,
//                );
//            })
//            .flat();
//
//        return Promise.all(promises).then(() => interpolators);
//    }
//
//    updateInterpolators(
//        cmp: ComponentDefinition,
//        initialStrokesFirstIdx: number,
//        initialStrokes: any[],
//        backward: Boolean = false,
//        interpolators: any[],
//    ): Promise<any>[] {
//        if (!cmp.character) {
//            return cmp.components
//                .map((subCmp: ComponentDefinition) =>
//                    this.updateInterpolators(
//                        subCmp,
//                        initialStrokesFirstIdx,
//                        initialStrokes,
//                        backward,
//                        interpolators,
//                    ),
//                )
//                .flat();
//        }
//
//        if (!cmp.strokesPromise) return []; // TODO recursivly develop character
//
//        return [
//            cmp.strokesPromise
//                .then((charData: any) => {
//                    if (charData.strokes === undefined)
//                        // edge case, strokes not found
//                        return;
//                    charData.strokes.forEach((strokePath: any, idx: number) => {
//                        if (!initialStrokes[idx + cmp.firstIdx - initialStrokesFirstIdx])// TODO clarify behavior here
//                            return
//                        if (backward)
//                            interpolators[idx + cmp.firstIdx] = interpolate(
//                                strokePath,
//                                initialStrokes[
//                                    idx + cmp.firstIdx - initialStrokesFirstIdx
//                                ],
//                            );
//                        else
//                            interpolators[idx + cmp.firstIdx] = interpolate(
//                                initialStrokes[
//                                    idx + cmp.firstIdx - initialStrokesFirstIdx
//                                ],
//                                strokePath,
//                            );
//                    });
//                })
//                .catch((e: any) => {
//                    console.warn(e);
//                }),
//        ];
//    }
//
//    anim() {
//        //const animationOptions = {
//        //    duration: 1000, // Animation duration in milliseconds
//        //    easing: 'ease', // Timing function
//        //};
//        //const keyframeEffect = new KeyframeEffect(null, null, animationOptions);
//        //this.animation = new Animation(keyframeEffect, document.timeline);
//        //this.animation.play();
//
//        requestAnimationFrame(this._anim.bind(this));
//    }
//    _anim(time: number) {
//        this.animStartTime = time;
//        this._drawAnim(this.animStartTime);
//    }
//
//    _drawAnim(time: number) {
//        let progress = this.progress(time);
//
//        this.strokeUpdate(progress);
//
//        if (progress < 1) {
//            requestAnimationFrame(this._drawAnim.bind(this));
//        }
//    }
//
//    strokeUpdate(progress: number) {
//        for (let i = 0; i < this.interpolators.length; i++) {
//            if (!this.interpolators[i]) continue;
//            const strokePath = this.interpolators[i](progress);
//            this.paths[i].setAttribute("d", strokePath);
//        }
//    }
//
//    progress(time: number) {
//        const progressDuration = time - this.animStartTime;
//        return progressDuration / this.animDuration;
//    }
//}
