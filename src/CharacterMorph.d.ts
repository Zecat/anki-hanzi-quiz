/// <reference path="pouic.d.ts" />
import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";
import { Component } from "pouic";
import { InteractiveCharacter } from "./InteractiveCharacter";
export default class CharacterMorph extends Component {
    constructor();
    set data(charObj: any);
    updateGroupTransform(cmp: InteractiveCharacter): void;
    _updateGroupTransformRec(cmp: InteractiveCharacter): void;
    attachGridEventListener(cmp: InteractiveCharacter): void;
    isHorizontalCdl(cdl: string): boolean;
    getHorizontalCharacterCount(cmp: InteractiveCharacter): number;
    generateGridRec(el: Element, cmp: InteractiveCharacter): void;
    createSubGroup(parentGroup: Element): Element;
    reassemble(): Promise<void>;
    closeComponent(cmp: InteractiveCharacter): void;
    onClick(e: any): void;
    getMorphs(cmp: InteractiveCharacter): string[][];
    runMorph(cmp: InteractiveCharacter, backward?: boolean): void;
    open(cmp?: InteractiveCharacter): void;
    openComponent(cmp: InteractiveCharacter): void;
    createSubGroupRec(component: InteractiveCharacter): void;
    renderGroupedStrokes(target: any, strokes: any): SVGGElement;
    static css: any;
    static template: any;
}
