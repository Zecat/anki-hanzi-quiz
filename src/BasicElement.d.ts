import '@material/mwc-icon-button-toggle';
import '@material/mwc-icon-button';
import '@material/mwc-tab-bar';
import '@material/mwc-tab';
import HanziWriter from 'hanzi-writer';
import { LitElement } from "lit-element";
export default class BasicElement extends LitElement {
    character: string;
    hanziWriter: HanziWriter | undefined;
    firstUpdated(): void;
    initiateHanziWriter(target: any): void;
    render(): import("lit-element").TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        "basic-element": BasicElement;
    }
}
