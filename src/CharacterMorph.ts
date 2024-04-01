import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";

import { Component, register, html, css } from "pouic";

import { ComponentDefinition } from "./HanziDesc";
import CharacterInterpolator from "./interpolation";


import {cleanDescription, cleanPinyin, getPinyinTone} from './processData'

const sum = (array: number[]): number =>
  array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

const ANIM_DURATION = 500;

export default class CharacterMorph extends Component {
  constructor() {
    super();
    this.animDuration = ANIM_DURATION;
    this._data = undefined;
    this.mainSvgGroup = undefined;
    this.openedList = [];
    this.animation = undefined;
    this.characterInterpolator = undefined;
  }

  public set data(data: any) {
    if (!data || this._data === data) return;
    data = data.__target; // HACK retreive the proxy target to avoid promise incompatibility

    if (!data.strokes) {
      console.warn("Component has no strokes data");
      return;
    }

    this._data = data;
    //data.strokesPromise
      //.then((charData: any) => {
        const target: HTMLElement = this.shadowRoot;
        this.renderGroupedStrokes(target, data.strokes);

        data.svgGroup = this.mainSvgGroup;
        const grid = this.shadowRoot.getElementById("grid");
        data.gridEl = grid;

        this.generateGrid(grid, data);
        this.createSubGroupRec(data);
        this.updateGroupTransform(data);
        this.attachGridEventListener(data);
        this.characterInterpolator = new CharacterInterpolator(
          data,
          data.strokes,
          this.animDuration,
          this.paths,
        );
      //})
      //.catch((e: any) => console.log(e));
  }

  updateGroupTransform(cmp: ComponentDefinition) {
    const horizontalLen = this.getHorizontalCharacterCount(cmp);
    const gridEl = this.shadowRoot.getElementById("grid");
    gridEl.setAttribute("horizontal-len", horizontalLen);
    const gridWidth = gridEl.getBoundingClientRect().width
    const charWidth = gridWidth / Math.max(2, horizontalLen)
    gridEl.style.setProperty('--character-width', `${charWidth}px`);

    cmp.components.forEach(this._updateGroupTransformRec.bind(this));
  }

  _updateGroupTransformRec(cmp: ComponentDefinition) {
    if (!cmp.gridEl) throw "No Grid element";
    if (!cmp.parent) throw "No parent component";
    if (!cmp.parent.gridEl) throw "No parent component gridEl";
    if (!cmp.svgGroup) throw "No component svgGroup";
    if (cmp.gridEl.offsetParent === null || cmp.opened) {
      // element is display none
      // TODO cleanup
      cmp.svgGroup.setAttribute("transform", `translate(0, 0) scale(1, 1)`);
      for (let subCmp of cmp.components) {
        this._updateGroupTransformRec(subCmp);
      }
      return;
    }
    const clientRects = cmp.gridEl.getBoundingClientRect();
    const { x, y, width } = clientRects;
    const {
      x: px,
      y: py,
      width: pwidth,
    } = this.shadowRoot.getElementById("grid").getBoundingClientRect(); //cmp.parent.gridEl.getBoundingClientRect()
    const scaleFactor = width / pwidth || 1;
    const r = pwidth / width;

    const shiftX =
      (100 / (-pwidth + width)) * (-x + px - pwidth) - 100 * (r / (r - 1)); // TODO simplify calculation
    const shiftY =
      (100 / (-pwidth + width)) * (y - py - pwidth) - 100 / (r - 1) - 10;

    cmp.svgGroup.setAttribute(
      "transform",
      `scale(${scaleFactor}, ${scaleFactor})`,
    );
    cmp.svgGroup.setAttribute("transform-origin", `${shiftX}% ${shiftY}%`);
    for (let subCmp of cmp.components) {
      this._updateGroupTransformRec(subCmp);
    }
  }

  attachGridEventListener(cmp: ComponentDefinition) {
    if (cmp.gridEl)
      cmp.gridEl.addEventListener("click", this.onClick.bind(this));
    for (let subCmp of cmp.components) {
      this.attachGridEventListener(subCmp);
    }
  }

  isHorizontalCdl(cdl: string) {
    return "⿲⿻⿰⿸".includes(cdl);
  }

  getHorizontalCharacterCount(cmp: ComponentDefinition): number {
    if (!cmp.cdl || !cmp.opened) return 1;
    if (this.isHorizontalCdl(cmp.cdl))
      return sum(
        cmp.components.map(this.getHorizontalCharacterCount.bind(this)),
      );
    else
      return Math.max(
        ...cmp.components.map(this.getHorizontalCharacterCount.bind(this)),
      );
  }

  generateGrid(el: Element, cmp: ComponentDefinition) {
    if (cmp.cdl) el.setAttribute("cdl", cmp.cdl);
    for (let subCmp of cmp.components) {
      const subEl = document.createElement("div");

      if (subCmp.character) {
      //if (subCmp.character) {
        subEl.setAttribute("char", subCmp.character);
        const content = document.createElement("div");
        content.classList.toggle("character-content");
          const cleanedPinyin = cleanPinyin(subCmp.pinyin);
          const tone = String(getPinyinTone(cleanedPinyin));
          const description = cleanDescription(subCmp.definition)
          content.innerHTML = `
          <div class="pinyin" tone="${tone}">
            ${cleanedPinyin}
          </div>
<div class="description">${description}</div>`;

        subEl.appendChild(content);
      }
      el.appendChild(subEl);
      subCmp.gridEl = subEl;
      this.generateGrid(subEl, subCmp);
    }
  }

  createSubGroup(parentGroup: Element): Element {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    parentGroup.appendChild(group);
    return group;
  }

  async reassemble() {
    const lastCmp = this.openedList.pop();
    if (!lastCmp) return;

    this.closeComponent(lastCmp);
    this.characterInterpolator?.run(lastCmp, true).then(() => {
      this.updateGroupTransform(this._data);
    });
  }

  closeComponent(cmp: ComponentDefinition) {
    cmp.opened = false;
    cmp.gridEl && cmp.gridEl.removeAttribute("opened"); // TODO closeComponent recursive // TODO gridEl better typing no need to check
    cmp.components.forEach(this.closeComponent.bind(this));
  }

  getCmpForGridEl(
    target: HTMLElement,
    cmp: ComponentDefinition,
  ): ComponentDefinition | undefined {
    if (cmp.gridEl === target) return cmp;
    for (const subCmp of cmp.components)
      if (subCmp.gridEl === target) return subCmp;
    return undefined;
  }

  onClick(e: any) {
    e.stopPropagation();
    // "unfolded" in e.target.classList
    const cmp = this.getCmpForGridEl(e.target, this._data);
    if (cmp) this.open(cmp);
  }

  open(cmp: ComponentDefinition | undefined = this._data) {
    if (!cmp.components.length) return;

    this.openedList.push(cmp);

    this.openComponent(cmp);

    //cmp.gridEl && cmp.gridEl.setAttribute('animating', '')
    //HACK
    this.shadowRoot.getElementById("grid").removeAttribute("content-revealed");

    this.characterInterpolator?.run(cmp).then(() => {
      this.updateGroupTransform(this._data);
      // HACK
      setTimeout(() => {
        cmp.gridEl && cmp.gridEl.removeAttribute("animating");

        this.shadowRoot
          .getElementById("grid")
          .setAttribute("content-revealed", "");
        //this.shadowRoot.getElementById("grid").removeAttribute('animating')
      }, this.animDuration);
    });
  }

  openComponent(cmp: ComponentDefinition) {
    console.log('OPENING', cmp)
    if (!cmp.gridEl) {
      console.warn("No grid element for component");
      // TODO this should not happen, do better typing
      return;
    }
    cmp.opened = true;

    cmp.gridEl.setAttribute("opened", "");

    cmp.components.forEach((subCmp: ComponentDefinition) => {
      if (subCmp.components.length && (!subCmp.pinyin||!subCmp.pinyin[0])  ) this.openComponent(subCmp);
      //if (subCmp.components.length && (!subCmp.character || subCmp.character.charCodeAt(1))) this.openComponent(subCmp);
    });
  }

  createSubGroupRec(component: ComponentDefinition) {
    if (!component.svgGroup) return;
    //throw new Error("subComponent is missing svgGroup")
    if (!component.components.length) {
      const relatedPaths = this.paths.slice(
        component.firstIdx,
        component.lastIdx + 1,
      );
      relatedPaths.map((path: any) => component.svgGroup?.appendChild(path));
      return;
    }
    for (const subComponent of component.components) {
      const subGroup = this.createSubGroup(component.svgGroup);
      subComponent.svgGroup = subGroup;
      this.createSubGroupRec(subComponent);
    }
  }

  renderGroupedStrokes(target: any, strokes: any) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "component-svg");
    target.appendChild(svg);
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.mainSvgGroup = group;
    svg.setAttributeNS(null, "viewBox", "0 -124 1024 1024"); //"0 0 1080 720");
    svg.appendChild(group);

    const paths: any[] = [];

    strokes.forEach((strokePath: any) => {
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttributeNS(null, "d", strokePath);
      group.appendChild(path);
      paths.push(path);
    });
    this.svg = svg;
    this.paths = paths;
  }

  static css = css`
    :host([debug]) #grid * {
      background: rgba(255, 255, 0, 0.3);
      border: 1px solid grey;
    }

    :host([debug]) .character-content {
      background: blue !important;
    }

    :host {
      position: relative;
      display: block;
    }

    #component-svg {
      pointer-events: none;
      width: 100%;
      scale: 1 -1;
      transform-origin: 50% 50%;
      overflow: visible;
      position: absolute;
      top: 0;
      left: 0;
    }

    #component-svg path {
      fill: #555;
    }

    #component-svg g {
      transition: transform ${ANIM_DURATION / 1000}s linear; /*HACK*/
    }

    #grid {
      display: flex;
      width: 100%;
      align-items: center;
      aspect-ratio: 1;
    }

    #grid[opened] {
      aspect-ratio: unset;
      margin-bottom: 20px;
    }
    #grid [cdl]:not([opened]),
    #grid [char]:not([opened]) {
      position: relative;
      flex: 1;
      /*overflow: hidden;*/
      align-items: center;
      box-sizing: border-box;

      display: none;
    margin-bottom: 20px;
    }

    [char][opened] > *:not([opened]),
    [cdl][opened] > *:not([opened]) {
      display: block !important;
      overflow: visible !important;
      flex: 0 !important;
    }

    [opened] {
      display: flex !important;
    }

    #grid [char]::before {
      content: "";
      display: block;
    }


    #grid [char]::before {
      width: var(--character-width);
      height: var(--character-width);
    }

  /*TODO remove max-width HACK*/
    #grid [char] {
      max-width: var(--character-width);
    }


























    [cdl="⿱"],
    [cdl="⿳"] {
      flex-direction: column !important;
      flex: none;
    }

    [cdl="⿰"],
    [cdl="⿲"],
    [cdl="⿻"] {
      flex-direction: row !important;

      flex: none;
    }

    .character-content {
      display: block !important;
      width: 100%;

      min-height: unset !important;
      min-width: unset !important;
      opacity: 0;
      text-align: center;
    }

    [char][opened]::before {
      display: none !important;
    }
    #grid[content-revealed] .character-content {
      opacity: 1;
      transition: opacity 0.3s;
    }
    [char][opened] > .character-content {
      display: none !important;
    }

    /*TODO generique*/
    [tone="1"] {
      color: red;
    }
    [tone="2"] {
      color: green;
    }
    [tone="3"] {
      color: blue;
    }
    [tone="4"] {
      color: purple;
    }
    [tone="5"] {
      color: grey;
    }
    .pinyin {
      font-family: roboto;
    }

    .description {
      color: grey;
      max-width: 100%;
      font-size: 14px;
      padding-top: 8px;
      font-family: "Roboto";
    }
    /*
 ⿲
 ⿳
 ⿴
 ⿵
 ⿶
 ⿷
 ⿼
 ⿸
 ⿹
 ⿺
 ⿽
 ⿻
 ⿾
 ⿿
*/
  `;

  static template = html` <div id="grid"></div> `;
}

register(CharacterMorph);
