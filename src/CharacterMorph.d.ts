/// <reference path="pouic.d.ts" />
import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";
import { Component } from "pouic";
import { ComponentDefinition } from "./HanziDesc";
export default class CharacterMorph extends Component {
    constructor();
    set data(data: any);
    updateGroupTransform(cmp: ComponentDefinition): void;
    _updateGroupTransformRec(cmp: ComponentDefinition): void;
    attachGridEventListener(cmp: ComponentDefinition): void;
    isHorizontalCdl(cdl: string): boolean;
    getHorizontalCharacterCount(cmp: ComponentDefinition): number;
    generateGrid(el: Element, cmp: ComponentDefinition): void;
    createSubGroup(parentGroup: Element): Element;
    reassemble(): Promise<void>;
    closeComponent(cmp: ComponentDefinition): void;
    getCmpForGridEl(target: HTMLElement, cmp: ComponentDefinition): ComponentDefinition | undefined;
    onClick(e: any): void;
    open(cmp?: ComponentDefinition | undefined): void;
    openComponent(cmp: ComponentDefinition): void;
    createSubGroupRec(component: ComponentDefinition): void;
    renderGroupedStrokes(target: any, strokes: any): void;
    static css: any;
    static template: any;
}
