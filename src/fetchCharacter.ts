import {fetchMedia} from './anki_api'
import { computeRepartition, rotateStartPathToMedianBottom, StrokeAnalysis } from './uniformPath';

import storage from "localforage";

storage.config({
    driver: storage.INDEXEDDB, // Force IndexedDB; same as using setDriver()
    name: 'hanziApp',
    version: 1.0,
    storeName: 'hanzi_data', // Should be alphanumeric, with underscores.
    description: 'hanzi data, strokes and components'
});


const _cachedChar: any = {} // TODO typing
export const fetchCharacter = async (char: string) => {
    if (char in _cachedChar)
        return _cachedChar[char]
    // TODO _cachedChar now useless ?
    const storageValue = await storage.getItem(char).catch(() => {})
    if (storageValue)
        return storageValue

    return fetchMedia(`_${char}.json`)
    .then((response) => {
        if (!response.ok) {
            throw new Error("Dictionnary fetch request was not ok");
        }
        return response.json();
    }).then((data) => {
        data.character = char
        if (data.strokes && data.strokes.length && data.medians) {
            if (data.strokes.length != data.medians.length){
                console.warn('strokes and medians length do not match for ', data.character)
            } else {
                data.strokes = data.strokes.map((stroke: string, i: number) =>
                rotateStartPathToMedianBottom(stroke, data.medians[i])
                )

                data.repartition = data.strokes.map((_:any, i: number) => {
                    try {
                    return computeRepartition(data.strokes[i],data.medians[i])
                    } catch(err) {
                        throw new Error(`char ${char} stroke ${i}: ${err}`);
                    }
                })

            }
        }
        storage.setItem(char, data);
        _cachedChar[char] = data
        return data
    })
    .catch((err) => {
        throw new Error(char + "Dictionary fetch request failed: " + err);
    });

}


export type CharDataItem = {
    character: string;
    definition: string;
    pinyin: string[];
    decomposition: string;
    len: number;
    //etymology: {
    //    type: string;
    //    semantic: string;
    //    hint: string;
    //};
    radical: string;
    acjk: string;
    strokes: string[];
    medians: string[];
    repartition: StrokeAnalysis[]
};
