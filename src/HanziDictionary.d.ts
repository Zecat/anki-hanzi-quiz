export type Matches = number[][] | null[];
export type CharDataItem = {
    character: string;
    definition: string;
    pinyin: string[];
    decomposition: string;
    etymology: {
        type: string;
        semantic: string;
        hint: string;
    };
    radical: string;
    matches: Matches;
};
export default class HanziDictionary {
    _dictMediaFilename: string;
    _dbName: string;
    _storeName: string;
    _dbVersion: number;
    dictReady: Promise<any>;
    data: any;
    fetchDictionary(): Promise<any>;
    getFile(): Promise<any>;
    constructor();
    populateData(data: any): Promise<string>;
    getEmptyItem(): CharDataItem;
    get(char: string): Promise<CharDataItem>;
}
