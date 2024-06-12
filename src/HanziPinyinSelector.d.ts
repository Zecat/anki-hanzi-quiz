/// <reference path="pouic.d.ts" />
import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";
import "@material/web/button/filled-button";
import "@material/web/button/outlined-button";
import "@material/web/tabs/tabs.js";
import "@material/web/tabs/primary-tab.js";
import "./CharactersSlideshowQuiz";
import "./CharacterAnim";
import "./CharacterMorph";
import "./HanziWriter";
import { Component } from "pouic";
export default class HanziPinyinSelector extends Component {
    onActiveTabIndexChange(e: CustomEvent): void;
    onTabClick(index: number): void;
    getPinyinText(strArr: string[] | undefined, complete: boolean, pinyinAsQuestion: boolean, pinyinForceReveal: boolean): string;
    static template: any;
    static css: any;
}
