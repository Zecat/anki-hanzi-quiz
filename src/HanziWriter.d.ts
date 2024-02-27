import HanziWriter from "hanzi-writer";
import { LitElement, TemplateResult, CSSResultGroup } from "lit-element";
export default class HanziWriterComponent extends LitElement {
    hanzi: string;
    createHanziWriter(hanzi: string): Promise<HanziWriter>;
    static get styles(): CSSResultGroup;
    render(): TemplateResult;
}
