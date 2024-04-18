export type ComponentWorkerDefinition = {
    character: string;
    firstIdx: number;
    components: ComponentWorkerDefinition[];
    strokes: any | undefined;
};
export declare const getInterpolators: (cmp: ComponentWorkerDefinition, backward: Boolean | undefined, initialStrokes: any) => Promise<any[] | "a">;
