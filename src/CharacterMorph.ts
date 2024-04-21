import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";

import { Component, register, html, css } from "pouic";

//import CharacterInterpolator from "./interpolation";

import { CharacterData } from './decompose'


import { cleanDescription, cleanPinyin, getPinyinTone } from './processData'
import { InteractiveCharacter, getCmpForGridEl, getCmpStrokeData, getComponentAbsoluteFirstIndex} from "./InteractiveCharacter";
import {  makeUniform } from "./uniformPath";
//import CharacterInterpolator from "./interpolation";




//import paper from "paper"
//      setTimeout(() => {
//
//        paper.setup(document.createElement('canvas'));
// let d_source = "M487,437C489,450 491,463 493,475C497,506 497,506 499,522C515,648 515,729 528,763C531,772 529,780 523,786C507,799 486,811 459,822C441,829 427,830 414,825C397,820 396,810 410,796C432,774 443,751 444,726C444,645 443,571 436,509C433,480 433,480 431,465C413,311 358,239 312,183C289,157 223,98 148,55C138,50 132,47 130,43C126,39 129,35 144,34C177,33 225,53 300,102C405,173 461,296 480,396C485,423 485,423 487,437Z";
//let path = new paper.Path(d_source)
//path.reduce({})
//path.simplify(0.0001);
//let svg = path.exportSVG();
////let d_target = paper.parser(svg).attributes.d
////let svg = path.exportSVG({ asString: true});
//      console.log("===", d_source, svg, path)
//      }, 500)

const sum = (array: number[]): number =>
  array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

const ANIM_DURATION = 500;

export default class CharacterMorph extends Component {
  constructor() {
    super();
    this.animDuration = ANIM_DURATION;
    this._charObj = undefined;
    this.mainSvgGroup = undefined;
    this.openedList = [];
    this.animation = undefined;
    this.characterInterpolator = undefined;
  }

//  generateInteractiveCharacter(data: CharacterData, parent: InteractiveCharacter | undefined = undefined): InteractiveCharacter {
//    const interChar = getInteractiveCharacter(data, parent)
//    interChar.components = data.components.map((dataCmp: CharacterData) => this.generateInteractiveCharacter(dataCmp, interChar))
//    return interChar
//  }

  public set data(charObj: any) {
    if (!charObj || this._charObj === charObj) return;
    charObj = charObj.__target; // HACK retreive the proxy target to avoid promise incompatibility
    const strokes = charObj.data.strokes
    if (!strokes) {
      console.warn("Component has no strokes charObj");
      return;
    }

    this._charObj = charObj;

    const target: HTMLElement = this.shadowRoot;
    const svgGroup = this.renderGroupedStrokes(target, strokes);

    const grid = this.shadowRoot.getElementById("grid");

    charObj.gridEl = grid
    charObj.svgGroup = svgGroup;

    this.generateGridRec(grid, charObj);
    this.createSubGroupRec(charObj);
    this.updateGroupTransform(charObj);
    this.attachGridEventListener(charObj);
    //this.characterInterpolator = new CharacterInterpolator(
    //  charObj,
    //  charObj.data.strokes,
    //  this.animDuration,
    //  this.paths,
    //);
  }

  updateGroupTransform(cmp: InteractiveCharacter) {
    const horizontalLen = this.getHorizontalCharacterCount(cmp);
    const gridEl = this.shadowRoot.getElementById("grid");
    //gridEl.setAttribute("horizontal-len", horizontalLen);
    gridEl.style.setProperty('--horizontal-len', `${horizontalLen}`);
    const gridWidth = gridEl.getBoundingClientRect().width

    const charWidth = (gridWidth- (horizontalLen-1)*20) / Math.max(2, horizontalLen)
    gridEl.style.setProperty('--character-width', `${charWidth}px`);


    cmp.components.forEach(this._updateGroupTransformRec.bind(this));
  }

  _updateGroupTransformRec(cmp: InteractiveCharacter) {
    if (!cmp.gridEl) throw "No Grid element";
    if (!cmp.parent) throw "No parent component";
    if (!cmp.parent.gridEl) throw "No parent component gridEl";
    if (!cmp.svgGroup) throw "No component svgGroup";

    const horizontalLen = this.getHorizontalCharacterCount(cmp);
    cmp.gridEl.style.setProperty('--horizontal-len', `${horizontalLen}`);
    // HACK settimeout for --horizontal-len to apply, todo inline style width instead ?
    setTimeout(() => {

    if (!cmp.gridEl) throw "No Grid element";
    if (!cmp.parent) throw "No parent component";
    if (!cmp.parent.gridEl) throw "No parent component gridEl";
    if (!cmp.svgGroup) throw "No component svgGroup";


    if (cmp.gridEl.offsetParent === null || cmp.opened) {
      // element is display none
      // TODO cleanup
      cmp.svgGroup.setAttribute("transform", `scale(1, 1) translate(0,0)`);
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
      `scale(${scaleFactor}, ${scaleFactor}) translate(0,0)`,
    );
    cmp.svgGroup.setAttribute("transform-origin", `${shiftX}% ${shiftY}%`);
    for (let subCmp of cmp.components) {
      this._updateGroupTransformRec(subCmp);
    }

    }, 0)
  }

  attachGridEventListener(cmp: InteractiveCharacter) {
    if (cmp.gridEl)
      cmp.gridEl.addEventListener("click", this.onClick.bind(this));
    for (let subCmp of cmp.components) {
      this.attachGridEventListener(subCmp);
    }
  }

  isHorizontalCdl(cdl: string) {
    return cdl != '⿱' &&  cdl !='⿳'
    //return "⿲⿻⿰⿸⿹".includes(cdl);
  }

  getHorizontalCharacterCount(cmp: InteractiveCharacter): number {
    if (!cmp.data.cdl || !cmp.opened) return 1;
    if (this.isHorizontalCdl(cmp.data.cdl))
      return sum(
        cmp.components.map(this.getHorizontalCharacterCount.bind(this)),
      );
    else
      return Math.max(
        ...cmp.components.map(this.getHorizontalCharacterCount.bind(this)),
      );
  }

  generateGridRec(el: Element, cmp: InteractiveCharacter) {
    const data: CharacterData = cmp.data
    if (data.cdl) el.setAttribute("cdl", data.cdl);
    for (let i in data.components) {
      const subData = data.components[i]
      const subCmp = cmp.components[i]
      const subEl = document.createElement("div");

      if (subData.character) { // TODO change charatcer here ?
        subEl.setAttribute("char", subData.character);
    //    const svg = document.createElement("svg");
    //const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    //    svg.setAttribute("viewBox","0 -124 1024 1024")

    //const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    //    svg.appendChild(group);
        //ubEl.appendChild(svg);


        const content = document.createElement("div");
        content.classList.toggle("character-content");
        const cleanedPinyin = cleanPinyin(subData.pinyin);
        const tone = String(getPinyinTone(cleanedPinyin));
        const description = subData.definition ? cleanDescription(subData.definition) : ''
        content.innerHTML = `
          <div class="pinyin" tone="${tone}">
            ${cleanedPinyin}
          </div>
<div class="description">${description}</div>`;

        subEl.appendChild(content);
      }
      el.appendChild(subEl);
      subCmp.gridEl = subEl
      this.generateGridRec(subEl, subCmp);
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

    this.updateGroupTransform(this._charObj);
    this.runMorph(lastCmp, true)
    //this.characterInterpolator?.run(lastCmp, true).then(() => {
    //  this.updateGroupTransform(this._charObj);
    //});
  }

  closeComponent(cmp: InteractiveCharacter) {
    cmp.opened = false;
    cmp.gridEl && cmp.gridEl.removeAttribute("opened"); // TODO closeComponent recursive // TODO gridEl better typing no need to check
    cmp.components.forEach(this.closeComponent.bind(this));
  }

  onClick(e: any) {
    e.stopPropagation();
    // "unfolded" in e.target.classList
    const cmp = getCmpForGridEl(e.target, this._charObj);
    if (cmp) this.open(cmp);
  }

  getMorphs(cmp: InteractiveCharacter) {

    const len = cmp.data.len||0
    const morphs = []
    for( let i = 0; i < len; i++ ) {
      const ret = getCmpStrokeData(cmp, i)

      if (!ret)
        continue

      const {data, idx} = ret

      if (!data.strokes || !data.medians) // HACK
        continue
      if (!data.repartition)
        {
        console.warn('No repartition', data.character)
        throw new Error('ERR')
      }

      const initialPath = cmp.data.strokes ? cmp.data.strokes[i] : undefined; //this.paths[firstIdx + i].getAttribute('d')
      // TODO change fallback to the deepest stroke found in in the main cmp instead of this.paths[fi+i] ?
      //const initialPath = this.paths[firstIdx + i].getAttribute('d')
      if (!initialPath)
        {
        console.warn('No initial path', cmp.data.character, i)
        throw new Error('ERR')
      }
      if (!cmp.data.strokes) {

        console.warn('No strokes', cmp.data.character, i)
        throw new Error('ERR')
      }
      if ( !cmp.data.repartition) {
        console.warn('No repartition', cmp.data.character, i)
        throw new Error('ERR')
      }
      const morph = makeUniform(
        cmp.data.strokes[i],
        cmp.data.repartition[i],
        data.strokes[idx],
        data.repartition[idx])

      morphs.push(morph)



//    const startI = p.indexOf('C')
//    const M = p.slice(0, startI)
//    const p2 = p.slice(startI, -1)
//      const splitPaths = p2.split("C").filter((part: string) => part !== "");
//
//// Add "C" character to the beginning of each substring
//      const result = splitPaths.map((part:string) => "C" + part);
//     result[0] = this.splitPath(result[0], 4)
//      const r2 = result.flat()
//      const rStr = `${M}${r2.join('')}Z`
//      console.log(rStr)
    }
    return morphs
  }

  runMorph(cmp: InteractiveCharacter, backward: boolean = false) {

    const firstIdx = getComponentAbsoluteFirstIndex(cmp)
    //for (const p of this._charObj.data.strokes) {
    const morphs = this.getMorphs(cmp)

    morphs.forEach((m, i)=> {
      this.paths[firstIdx + i].setAttribute("d", m[backward ? 1: 0]);
    })

      setTimeout(() => {
    morphs.forEach((m, i)=> {
      this.paths[firstIdx + i].setAttribute("d", m[backward ? 0: 1]);
    })
      },0);
  }

  open(cmp: InteractiveCharacter = this._charObj) {
    if (!cmp.components.length) return;

    this.openedList.push(cmp);

    this.openComponent(cmp);

    //cmp.gridEl && cmp.gridEl.setAttribute('animating', '')
    //HACK
    this.shadowRoot.getElementById("grid").removeAttribute("content-revealed");
    this.runMorph(cmp)



      this.updateGroupTransform(this._charObj);
      this.updateGroupTransform(this._charObj); // HACK call it twice to ensure grid width is applied to css before svg snap to it
      // HACK
      setTimeout(() => {
        cmp.gridEl && cmp.gridEl.removeAttribute("animating");

        this.shadowRoot
          .getElementById("grid")
          .setAttribute("content-revealed", "");
        //this.shadowRoot.getElementById("grid").removeAttribute('animating')
      }, this.animDuration);
    //this.characterInterpolator?.run(cmp).then(() => {
    //  this.updateGroupTransform(this._charObj);
    //  // HACK
    //  setTimeout(() => {
    //    cmp.gridEl && cmp.gridEl.removeAttribute("animating");

    //    this.shadowRoot
    //      .getElementById("grid")
    //      .setAttribute("content-revealed", "");
    //    //this.shadowRoot.getElementById("grid").removeAttribute('animating')
    //  }, this.animDuration);
    //});
  }

  openComponent(cmp: InteractiveCharacter) {
    if (!cmp.gridEl) {
      console.warn("No grid element for component");
      // TODO this should not happen, do better typing
      return;
    }
    cmp.opened = true;

    cmp.gridEl.setAttribute("opened", "");

    cmp.components.forEach((subCmp: InteractiveCharacter) => {
      if (subCmp.components.length && (!subCmp.data.pinyin || !subCmp.data.pinyin[0])) this.openComponent(subCmp);
      //if (subCmp.components.length && (!subCmp.character || subCmp.character.charCodeAt(1))) this.openComponent(subCmp);
    });
  }

  createSubGroupRec(component: InteractiveCharacter) {
    if (!component.svgGroup) return;
    //throw new Error("subComponent is missing svgGroup")
    if (!component.components.length) {
      const firstIdx = getComponentAbsoluteFirstIndex(component)
      const relatedPaths = this.paths.slice(
        firstIdx,
        firstIdx + (component.data.len || 0),
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
    return group
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
      margin: 20px;
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
      max-width: calc(var(--character-width) * var(--horizontal-len));
    }

    [cdl] {
      flex-direction: row !important;
      flex: none;

gap: 20px;
    }

    [cdl="⿱"],
    [cdl="⿳"] {
      flex-direction: column !important;
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
path {
transition: 0.5s;
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
