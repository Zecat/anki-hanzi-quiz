import { CharDataItem } from "./fetchCharacter";
type CDLChar = "⿰" | "⿱" | "⿴" | "⿵" | "⿶" | "⿷" | "⿼" | "⿸" | "⿹" | "⿺" | "⿽" | "⿻" | "⿾" | "⿿" | "⿲" | "⿳";
export type CharacterData = {
    components: CharacterData[];
    cdl: CDLChar | undefined;
} & Partial<CharDataItem>;
export declare const getCharacterData: (char: string) => Promise<CharacterData>;
export {};
