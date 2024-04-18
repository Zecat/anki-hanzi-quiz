import { interpolate } from "flubber"; // ES6

export type ComponentWorkerDefinition = {
    character: string;
    firstIdx: number;
    components: ComponentWorkerDefinition[];
    strokes: any | undefined;
};

addEventListener('message', ({ data }) => {
    getInterpolators(data.cmp, data.backward, data.initialStrokes).then(postMessage)
});

    export const getInterpolators = async (
        cmp: ComponentWorkerDefinition,
        backward: Boolean = false,
        initialStrokes: any, // TODO typing
    ) =>{
        return 'a'
        const interpolators = Array(initialStrokes.length).fill(undefined);
        let usedInitialStrokes: any;
        if (!cmp.character)
            usedInitialStrokes = initialStrokes.slice(cmp.firstIdx);
        else {
            try {
                const cmpData: any = cmp.strokes;

                usedInitialStrokes = cmpData.strokes;
            } catch (e) {
                console.log(e);
                usedInitialStrokes = initialStrokes.slice(cmp.firstIdx);
            }
        }
        const promises = cmp.components
            .map((subCmp: ComponentWorkerDefinition) => {
                return updateInterpolators(
                    subCmp,
                    0,
                    usedInitialStrokes,
                    backward,
                    interpolators,
                );
            })
            .flat();

        return Promise.all(promises).then(() => interpolators);
    }

    const updateInterpolators = (
        cmp: ComponentWorkerDefinition,
        initialStrokesFirstIdx: number,
        initialStrokes: any[],
        backward: Boolean = false,
        interpolators: any[],
    )  => {
        if (!cmp.character) {
            cmp.components
                .forEach((subCmp: ComponentWorkerDefinition) =>
                    updateInterpolators(
                        subCmp,
                        initialStrokesFirstIdx,
                        initialStrokes,
                        backward,
                        interpolators,
                    ),
                )
            return
        }

        if (!cmp.strokes) return  // TODO recursivly develop character

        if (cmp.strokes === undefined)
            // edge case, strokes not found
            return;
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
