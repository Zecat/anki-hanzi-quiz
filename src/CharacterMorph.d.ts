/// <reference path="pouic.d.ts" />
import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";
import { Component } from "pouic";
import { CharacterData } from './decompose';
import { InteractiveCharacter } from "./InteractiveCharacter";
export default class CharacterMorph extends Component {
    constructor();
    connectedCallback(): void;
    getMorphs(cmpData: CharacterData): string[][];
    runMorph(cmp: InteractiveCharacter, backward?: boolean): void;
    createSubGroupRec(cmp: InteractiveCharacter): void;
    renderPaths(strokes: any): any[];
    set data(charObj: any);
    getVerticalCharacterCount(cmp: InteractiveCharacter): number;
    getHorizontalCharacterCount(cmp: InteractiveCharacter): number;
    attachGridEventListener(cmp: InteractiveCharacter): void;
    isHorizontalCdl(cdl: string): boolean;
    generateGridRec(el: Element, cmp: InteractiveCharacter): void;
    setClosedRec(cmp: InteractiveCharacter): void;
    reassemble(): Promise<void>;
    closeComponent(cmp: InteractiveCharacter): void;
    onClick(e: any): void;
    updateHorizontalLen(): void;
    getCharContentHeight(cmp: InteractiveCharacter): {
        h: number;
        w: number;
    };
    getWrapHeight(cmp: InteractiveCharacter): {
        h: number;
        w: number;
    };
    cmpShouldAutoOpen(cmp: InteractiveCharacter): boolean | 0;
    saveRectRec(cmp: InteractiveCharacter): void;
    setOpenRec(cmp: InteractiveCharacter): void;
    wUpdateRec(cmp: InteractiveCharacter): void;
    open(cmp?: InteractiveCharacter): void;
    openComponent(cmp: InteractiveCharacter): void;
    static css: any;
    static template: any;
}
