import { LitElement } from "lit-element";
import '@material/mwc-icon-button-toggle';
import '@material/mwc-icon-button';
import '@material/mwc-tab-bar';
import '@material/mwc-tab';
import HanziWriter from 'hanzi-writer';
export default class HanziQuizzWC extends LitElement {
    strokesVisible: boolean;
    rating: number;
    hanziWriter: HanziWriter | undefined;
    character: string;
    onVisibilityButtonTapped(e: any): void;
    revealStrokes(): void;
    hideStrokes(): void;
    onEraserButtonClick(): void;
    firstUpdated(): void;
    initiateHanziWriter(target: any): void;
    get sheetSize(): number;
    onMistake(): void;
    onComplete(): void;
    ratingButtonClicked(e: any): void;
    render(): import("lit-element").TemplateResult;
}
declare global {
    interface HTMLElementTagNameMap {
        "hanzi-quizz": HanziQuizzWC;
    }
}
