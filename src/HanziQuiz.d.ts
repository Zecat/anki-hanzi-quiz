import '@material/mwc-icon-button';
import '@material/mwc-icon-button-toggle';
import '@material/mwc-tab';
import '@material/mwc-tab-bar';
import HanziWriter from 'hanzi-writer';
import { LitElement, TemplateResult, CSSResultGroup } from "lit-element";
export default class HanziQuiz extends LitElement {
    strokesVisible: boolean;
    rating: number;
    pinyin: string;
    english: string;
    character: string;
    hanziWriter: HanziWriter | undefined;
    onVisibilityButtonTapped(e: CustomEvent): void;
    revealStrokes(): void;
    hideStrokes(): void;
    onEraserButtonClick(): void;
    firstUpdated(): void;
    initiateHanziWriter(target: HTMLElement): void;
    get sheetSize(): number;
    onMistake(): void;
    onComplete(): void;
    ratingButtonClicked(e: CustomEvent): void;
    static get styles(): CSSResultGroup;
    render(): TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        "hanzi-quiz": HanziQuiz;
    }
}
