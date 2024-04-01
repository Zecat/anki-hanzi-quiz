import {fetchMedia} from './anki_api'

const _cachedChar: any = {} // TODO typing
export const fetchCharacter = async (char: string) => {
    if (char in _cachedChar)
        return _cachedChar[char]
    return fetchMedia(`_${char}.json`)
    .then((response) => {
        if (!response.ok) {
            throw new Error("Dictionnary fetch request was not ok");
        }
        return response.json();
    }).then((data) => {
        data.character = char
        _cachedChar[char] = data
        return data
    })
    .catch((err) => {
        throw new Error("Dictionary fetch request failed: " + err);
    });
}


export type CharDataItem = {
    character: string;
    definition: string;
    pinyin: string[];
    decomposition: string;
    //etymology: {
    //    type: string;
    //    semantic: string;
    //    hint: string;
    //};
    radical: string;
    acjk: string;
    strokes: string[];
    medians: string[];
};
