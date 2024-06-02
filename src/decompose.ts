import { CharDataItem, fetchCharacter } from "./fetchCharacter";

type CDLChar =
    | "⿰"
    | "⿱"
    | "⿴"
    | "⿵"
    | "⿶"
    | "⿷"
    | "⿼"
    | "⿸"
    | "⿹"
    | "⿺"
    | "⿽"
    | "⿻"
    | "⿾"
    | "⿿"
    | "⿲"
    | "⿳";

export type CharacterData = {
    components: CharacterData[];
    cdl: CDLChar | undefined;
} & Partial<CharDataItem>;

const cachedCharacterData: { [key: string]: CharacterData } = {}

/*Not a perfect solutiion, if there's no stroke data for a component that has a character and pinyin, fallback to the parent stroke subset. Such as cmp 䖵 蠹 */
const insertMissingStrokes = (data: CharacterData) => {
    let shift = 0;
    data.components.forEach((subData: CharacterData) => {
        if (subData.character && subData.pinyin && !subData.strokes) {
            if (!subData.len || !data.strokes || !data.medians || !data.repartition)
                return
            subData.strokes = data.strokes.slice(shift, shift + subData.len)
            subData.medians = data.medians.slice(shift, shift + subData.len)
            subData.repartition = data.repartition.slice(shift, shift + subData.len)
        }
        shift += subData.len || 0
        insertMissingStrokes(subData)
    })
}

export const getCharacterData = async (char: string): Promise<CharacterData> => {
    if (char in cachedCharacterData)
        return cachedCharacterData[char]

    const data = await fetchCharacter(char);

    if (char != data.decomposition) {
        const decompData = (await handleCdl([...data.decomposition], 0)).data
        Object.assign(data, decompData)
    }
    if (!data.components) data.components = []
    cachedCharacterData[char] = data

    insertMissingStrokes(data)

    return data
}

const isCDLChar = (c: string) => {
    return c >= "⿰" && c <= "⿿";
};

const getCDLLen = (c: string): 0 | 2 | 3 => {
    if (!isCDLChar(c)) return 0;
    if ("⿲⿳".includes(c)) return 3;
    return 2;
};

const handleCdl = async (
    decomp: string[], i: number
): Promise<{ data: CharacterData, idxForward: number }> => {
    const cdl = decomp[i] as CDLChar
    const cdlLen = getCDLLen(cdl)
    if (!cdlLen)
        throw new Error('handleCDL should be given a valid decomposition')
    const components: CharacterData[] = []
    i++

    let len = 0;
    for (let j = 0; j < cdlLen; j++) {
        const { data, idxForward } = await getNextCharacterData(decomp, i);
        i = idxForward
        components.push(data);
        len += data.len || 0 // TODO can len not be defined ?
    }

    return {
        data: {
            cdl,
            components,
            len
        },
        idxForward: i
    }
};

const getNextCharacterData = async (decomp: string[], i: number): Promise<{ data: CharacterData, idxForward: number }> => {
    const c = decomp[i]
    let cdlLen = getCDLLen(c);

    if (cdlLen) {
        return handleCdl(decomp, i);
    } else {
        return { data: await getCharacterData(c), idxForward: i + 1 }
    }
}
