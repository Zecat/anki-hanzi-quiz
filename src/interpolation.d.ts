import { InteractiveCharacter } from "./InteractiveCharacter";
export default class CharacterInterpolator {
    animStartTime: number;
    interpolators: any[];
    initialStrokes: any[];
    paths: any[];
    interpolationBackward: Promise<any> | undefined;
    interpolationForward: Promise<any> | undefined;
    animDuration: number;
    precomputedForward: any;
    precomputedBackward: any;
    constructor(cmp: InteractiveCharacter, initialStrokes: any[], animDuration: number, svgPaths: any[]);
    precompute(cmp: InteractiveCharacter): void;
    getPrecomputedInterpolators(cmp: InteractiveCharacter, backward?: Boolean): any;
    run(cmp: InteractiveCharacter, backward?: Boolean): Promise<void>;
    anim(): void;
    _anim(time: number): void;
    _drawAnim(time: number): void;
    strokeUpdate(progress: number): void;
    progress(time: number): number;
}
