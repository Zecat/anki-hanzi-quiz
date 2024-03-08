import HanziWriter from "hanzi-writer";
import { LitElement, TemplateResult, CSSResultGroup } from "lit-element";
export default class HanziWriterComponent extends LitElement {
    hanzi: string;
    backboard: boolean;
    showAnimated: boolean;
    options: {};
    hanziWriter: HanziWriter | undefined;
    isPropBecomingTrue(propName: string, changedProperties: Map<string, unknown>): boolean;
    updated(changedProperties: Map<string, unknown>): void;
    animateCharacter(): void;
    createHanziWriter(hanzi: string): Promise<HanziWriter>;
    static get styles(): CSSResultGroup;
    render(): TemplateResult;
}
