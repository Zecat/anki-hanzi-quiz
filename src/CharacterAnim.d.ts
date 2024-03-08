/// <reference path="pouic.d.ts" />
import HanziWriter from "hanzi-writer";
import { Component } from 'pouic';
export default class CharacterAnim extends Component {
    options: {};
    hanziWriter: HanziWriter | undefined;
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, _: string, newValue: string | null): void;
    createHanziWriter(hanzi: string): HanziWriter;
    static css: any;
    static template: any;
}
