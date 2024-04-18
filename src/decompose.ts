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

const cachedCharacterData: {[key: string]: CharacterData}= {}

export const getCharacterData = async (char: string):Promise<CharacterData> => {
   if (char in cachedCharacterData)
       return cachedCharacterData[char]

    const data = await fetchCharacter(char);

    if (char != data.decomposition) {
        const decompData = (await handleCdl([...data.decomposition], 0)).data
        Object.assign(data, decompData)
    }
    if (!data.components) data.components = []
    cachedCharacterData[char] = data

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
    decomp: string[],i:number
): Promise<{data: CharacterData, idxForward: number}> => {
    const cdl = decomp[0] as CDLChar
    const cdlLen = getCDLLen(cdl)
    if (!cdlLen)
        throw new Error('handleCDL should be given a valid decomposition')
    const components: CharacterData[] = []
    i++

    let len = 0;
    for (let j = 0; j < cdlLen; j++) {
        const {data, idxForward} = await getNextCharacterData(decomp, i);
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

const getNextCharacterData = async (decomp: string[], i: number) : Promise<{data: CharacterData, idxForward: number}>=> {
    const c = decomp[i]
    let cdlLen = getCDLLen(c);

    if (cdlLen) {
        return handleCdl(decomp, i);
    } else {
        return {data: await getCharacterData(c), idxForward: i+1}
    }
}
