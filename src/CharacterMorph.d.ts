/// <reference path="pouic.d.ts" />
import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";
import { Component } from "pouic";
import { InteractiveCharacter } from "./InteractiveCharacter";
export default class CharacterMorph extends Component {
    constructor();
    connectedCallback(): void;
    createSubGroup(parentGroup: Element): Element;
    createSubGroupRec(cmp: InteractiveCharacter): void;
    renderPaths(strokes: any): any[];
    set data(charObj: any);
    attachGridEventListener(cmp: InteractiveCharacter): void;
    generateGridRec(el: Element, cmp: InteractiveCharacter): void;
    reassemble(): Promise<void>;
    onClick(e: any): void;
    updateHorizontalLen(): void;
    cmpShouldAutoOpen(cmp: InteractiveCharacter): boolean | 0;
    saveRectRec(cmp: InteractiveCharacter): void;
    toggleCmpOpenedState(cmp: InteractiveCharacter, toggle: boolean, newComponents?: InteractiveCharacter[]): InteractiveCharacter[];
    transfertTransform(cmp: InteractiveCharacter, newComponents: InteractiveCharacter[]): void;
    getComponentAnimationParams(cmp: InteractiveCharacter): {
        cmpSvgGroup: HTMLElement;
        prevTransform: string;
        toTransform: string;
        prevTransformOrigin: string;
        toTransformOrigin: string;
    };
    getLeafComponents(cmp: InteractiveCharacter, leafComponents?: InteractiveCharacter[]): InteractiveCharacter[];
    runOpenAnimation(cmp: InteractiveCharacter): void;
    animateGridHeight(fromHeight: number, toHeight: number): void;
    open(cmp?: InteractiveCharacter): Promise<void>;
    static css: any;
    static template: any;
}
