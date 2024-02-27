import HanziWriter from "hanzi-writer";
import { LitElement, TemplateResult, CSSResultGroup } from "lit-element";
export default class HanziWriterComponent extends LitElement {
    character: string;
    createHanziWriter(character: string): Promise<HanziWriter>;
    static get styles(): CSSResultGroup;
    render(): TemplateResult;
}
