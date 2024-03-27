import { ComponentDefinition } from "./HanziDesc";
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
    constructor(cmp: ComponentDefinition, initialStrokes: any[], animDuration: number, svgPaths: any[]);
    precompute(cmp: ComponentDefinition): void;
    getPrecomputedInterpolators(cmp: ComponentDefinition, backward?: Boolean): any;
    run(cmp: ComponentDefinition, backward?: Boolean): Promise<void>;
    getInterpolators(cmp: ComponentDefinition, backward?: Boolean): Promise<any[]>;
    updateInterpolators(cmp: ComponentDefinition, initialStrokesFirstIdx: number, initialStrokes: any[], backward: Boolean | undefined, interpolators: any[]): Promise<any>[];
    anim(): void;
    _anim(time: number): void;
    _drawAnim(time: number): void;
    strokeUpdate(progress: number): void;
    progress(time: number): number;
}
