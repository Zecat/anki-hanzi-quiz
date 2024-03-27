import { interpolate } from "flubber"; // ES6
import { ComponentDefinition } from "./HanziDesc";

export default class CharacterInterpolator {
    animStartTime = 0;
    interpolators: any[] = [];
    initialStrokes: any[] = [];
    paths: any[] = [];
    interpolationBackward: Promise<any> | undefined = undefined;
    interpolationForward: Promise<any> | undefined = undefined;
    animDuration: number;

    constructor(
        cmp: ComponentDefinition,
        initialStrokes: any[],
        animDuration: number,
        svgPaths: any[],
    ) {
        this.initialStrokes = initialStrokes;
        this.animDuration = animDuration;
        this.paths = svgPaths;
        console.log(cmp, this.paths);
    }

    resetInterpolators() {
        this.interpolators = Array(this.initialStrokes.length).fill(undefined);
    }
    //getInterpolation(cmp: ComponentDefinition, backward: Boolean = false) {

    //}
    async run(cmp: ComponentDefinition, backward: Boolean = false) {
        console.log("run", cmp);
        this.resetInterpolators();
        if (backward)
            return this.interpolationBackward
                ?.then(this.anim.bind(this))
                .catch((e: any) => console.warn(e));
        else
            return this.interpolationForward
                ?.then(this.anim.bind(this))
                .catch((e: any) => console.warn(e));
    }

    async computeInterpolation(
        cmp: ComponentDefinition,
        backward: Boolean = false,
    ) {
        let initialStrokes: any;
        if (!cmp.character)
            initialStrokes = this.initialStrokes.slice(cmp.firstIdx);
        else {
            try {
                const cmpData: any = await cmp.strokesPromise;

                initialStrokes = cmpData.strokes;
            } catch (e) {
                console.log(e);
                initialStrokes = this.initialStrokes.slice(cmp.firstIdx);
            }
        }
        const promises = cmp.components
            .map((subCmp: ComponentDefinition) => {
                return this.computeInterpolations(
                    subCmp,
                    0,
                    initialStrokes,
                    backward,
                );
            })
            .flat();

        return Promise.all(promises);
    }

    computeInterpolations(
        cmp: ComponentDefinition,
        initialStrokesFirstIdx: number,
        initialStrokes: any,
        backward: Boolean = false,
    ): Promise<any>[] {
        if (!cmp.character) {
            return cmp.components
                .map((subCmp: ComponentDefinition) =>
                    this.computeInterpolations(
                        subCmp,
                        initialStrokesFirstIdx,
                        initialStrokes,
                        backward,
                    ),
                )
                .flat();
        }

        if (!cmp.strokesPromise) return []; // TODO recursivly develop character

        //return this.computeInterpolations()
        return [
            cmp.strokesPromise
                .then((charData: any) => {
                    if (charData.strokes === undefined)
                        // edge case, strokes not found
                        return;
                    charData.strokes.forEach((strokePath: any, idx: number) => {
                        if (backward)
                            this.interpolators[idx + cmp.firstIdx] =
                                interpolate(
                                    strokePath,
                                    initialStrokes[
                                        idx +
                                            cmp.firstIdx -
                                            initialStrokesFirstIdx
                                    ],
                                );
                        else
                            this.interpolators[idx + cmp.firstIdx] =
                                interpolate(
                                    initialStrokes[
                                        idx +
                                            cmp.firstIdx -
                                            initialStrokesFirstIdx
                                    ],
                                    strokePath,
                                );
                    });
                })
                .catch((e: any) => {
                    console.warn(e);
                }),
        ];
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
