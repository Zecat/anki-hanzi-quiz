import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";

import { Component, register, html, css } from "pouic";
import { interpolate } from "flubber"; // ES6

import { ComponentDefinition } from "./HanziDesc";

import {dict} from './state'

const sum = (array: number[]) : number => array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

const ANIM_DURATION = 500

export default class CharacterMorph extends Component {
  constructor() {
    super();
    this.animStartTime = 0;
    this.animDuration = ANIM_DURATION;
    this.interpolators = [];
    this.initialStrokes = [];
    this._data = undefined;
    this.mainSvgGroup = undefined;
    this.openedList = [];
    this.animation = undefined;
  }

  public set data(data: any) {
    if (!data || this._data === data) return;
    data = data.__target // HACK retreive the proxy target to avoid promise incompatibility

    if (!data.strokesPromise) {
      console.warn('Component has no strokes data')
      return
    }

    this._data = data;
    console.log("===", data,this._data)
    data.strokesPromise.then((charData: any) => {
      this.initialStrokes = charData.strokes;
      const target: HTMLElement = this.shadowRoot;
      this.renderGroupedStrokes(target, charData.strokes);

    data.svgGroup = this.mainSvgGroup;
    const grid = this.shadowRoot.getElementById("grid");
    data.gridEl = grid;

    this.generateGrid(grid, data);
    this.createSubGroupRec(data);
    this.updateGroupTransform(data);
    this.attachGridEventListener(data);

    }).catch((e:any) => console.log(e));

  }

  updateGroupTransform(cmp: ComponentDefinition) {
    const horizontalLen = this.getHorizontalCharacterCount(cmp)
    const gridEl = this.shadowRoot.getElementById('grid')
    gridEl.setAttribute('horizontal-len', horizontalLen)

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
    return "⿲⿻⿰".includes(cdl)
  }

  getHorizontalCharacterCount(cmp: ComponentDefinition): number {
    if (!cmp.cdl || !cmp.opened)
      return 1
    if (this.isHorizontalCdl(cmp.cdl))
      return sum(cmp.components.map(this.getHorizontalCharacterCount.bind(this)))
    else
      return Math.max(...cmp.components.map(this.getHorizontalCharacterCount.bind(this)))
  }

  // TODO extract
getPinyinTone(pinyin: string) {
    // Define a dictionary mapping accents to tone numbers
    const toneMap:{ [key: string]: number} = {
        "ā": 1, "á": 2, "ǎ": 3, "à": 4,
        "ē": 1, "é": 2, "ě": 3, "è": 4,
        "ī": 1, "í": 2, "ǐ": 3, "ì": 4,
        "ō": 1, "ó": 2, "ǒ": 3, "ò": 4,
        "ū": 1, "ú": 2, "ǔ": 3, "ù": 4,
        "ǖ": 1, "ǘ": 2, "ǚ": 3, "ǜ": 4,
        "ü": 5 // Neutral tone for ü
    };

    for (let char of pinyin) {
        if (char in toneMap) {
            return toneMap[char];
        }
    }

    return 5;
}
  cleanPinyin(strArr: string[] | undefined): string {
    if (!strArr)
      return 'pinyin unavailable'
    const str = strArr[0]

    //if (!pinyinData)
    //  return 5
    //const pinyin = Array.isArray(pinyinData) ? pinyinData[0] : pinyinData

    if (!str)
      return ''
    const match = str.match(/^[^(]+/);
    return match ? match[0] : "";
  }

  cleanDescription(desc: string | undefined): string {
    if (!desc)
      return ''
let regex = /Kangxi\s+radical\s+\d+;?/g;

// Remove occurrences of the pattern
let result = desc.replace(regex, '');
let result2 = result.replace(/;(\s*)$/, '$1');
    return result2
  }


  generateGrid(el: Element, cmp: ComponentDefinition) {
    if (cmp.cdl) el.setAttribute('cdl',cmp.cdl);
    for (let subCmp of cmp.components) {
      const subEl = document.createElement("div");
      if (subCmp.character) {
        subEl.setAttribute("char", subCmp.character);
        const content = document.createElement("div");
        content.classList.toggle('character-content')
        dict.get(subCmp.character).then(charData => {
          const cleanPinyin = this.cleanPinyin(charData.pinyin)
          const tone = String(this.getPinyinTone(cleanPinyin))
          content.innerHTML = `
          <div class="pinyin" tone="${tone}">
            ${cleanPinyin}
          </div>
<div class="description">${this.cleanDescription(charData.definition)}</div>`
        })

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

  reassemble() {
    const lastCmp = this.openedList.pop();
    if (!lastCmp) return;

    this.closeComponent(lastCmp)
    this.runCharacterMorph(lastCmp, true).then(() => {
      this.updateGroupTransform(this._data);
    });
  }

  closeComponent(cmp: ComponentDefinition) {
    console.log(cmp)
    cmp.opened = false;
    cmp.gridEl && cmp.gridEl.removeAttribute('opened') // TODO closeComponent recursive // TODO gridEl better typing no need to check
    cmp.components.forEach(this.closeComponent.bind(this))
  }

  resetInterpolators() {
    this.interpolators = Array(this.initialStrokes.length).fill(undefined);
  }

  // TODO make generic the 2 following methods
  //async runCharacterMorphBackward(cmp: ComponentDefinition) {
  //  this.resetInterpolators();
  //  let initialStrokes: any;
  //  if (!cmp.character)
  //    initialStrokes = this.initialStrokes.slice(cmp.firstIdx);
  //  else {
  //    const cmpData: any = await cmp.strokesPromise;
  //    initialStrokes = cmpData.strokes;
  //  }
  //  const promises = cmp.components
  //    .filter((subCmp: ComponentDefinition) => subCmp.character)
  //    .map((subCmp: ComponentDefinition) =>
  //      subCmp.strokesPromise && subCmp.strokesPromise
  //        .then((charData: any) => {
  //          charData.strokes.forEach((strokePath: any, idx: number) => {
  //            this.interpolators[idx + subCmp.firstIdx] = interpolate(
  //              strokePath,
  //              initialStrokes[idx + subCmp.firstIdx - cmp.firstIdx],
  //            );
  //          });
  //        })
  //        .catch((e: any) => {
  //          console.warn(e);
  //        }),
  //    );

  //  return Promise.all(promises).then(this.anim.bind(this));
  //}

  async runCharacterMorph(cmp: ComponentDefinition, backward: Boolean = false) {
    this.resetInterpolators();
    let initialStrokes: any;
    let initialStrokesFirstIdx = 0;
    if (!cmp.character)
      initialStrokes = this.initialStrokes.slice(cmp.firstIdx);
    else {
      try {
        const cmpData: any = await cmp.strokesPromise;

        initialStrokes = cmpData.strokes;

      } catch (e) {
        console.log(e);
        initialStrokes = this.initialStrokes.slice(cmp.firstIdx);
      }
    }
    const promises = cmp.components
      .map((subCmp: ComponentDefinition) =>
        {
        return this.computeInterpolations(subCmp, initialStrokesFirstIdx, initialStrokes, backward)
        }
      )
      .flat();

    return Promise.all(promises).then(this.anim.bind(this)).catch(e => console.warn(e));
  }

  computeInterpolations(
    cmp: ComponentDefinition,
    initialStrokesFirstIdx: number,
    initialStrokes: any,
    backward: Boolean = false
  ): Promise<any>[] {
    if (!cmp.character)
      {
      return cmp.components.map((subCmp: ComponentDefinition) => this.computeInterpolations(subCmp, initialStrokesFirstIdx, initialStrokes, backward)).flat()
    }

    if (!cmp.strokesPromise) return []; // TODO recursivly develop character

    //return this.computeInterpolations()
    return [cmp.strokesPromise
      .then((charData: any) => {
        if (charData.strokes === undefined) // edge case, strokes not found
          return
        charData.strokes.forEach((strokePath: any, idx: number) => {
          if (backward)
            this.interpolators[idx + cmp.firstIdx] = interpolate(
              strokePath,
              initialStrokes[idx + cmp.firstIdx - initialStrokesFirstIdx],
            );
          else
            this.interpolators[idx + cmp.firstIdx] = interpolate(
              initialStrokes[idx + cmp.firstIdx - initialStrokesFirstIdx],
              strokePath,
            );
        });
      })
      .catch((e: any) => {
        console.warn(e);
      })];
  }
  getCmpForGridEl(
    target: HTMLElement,
    cmp: ComponentDefinition,
  ): ComponentDefinition | undefined {
    console.log(cmp.gridEl, target, cmp.gridEl === target)
    if (cmp.gridEl === target) return cmp;
    for (const subCmp of cmp.components)
      if (subCmp.gridEl === target) return subCmp;
    return undefined;
  }

  onClick(e: any) {
    console.log('!!', e)
    e.stopPropagation();
    // "unfolded" in e.target.classList
    const cmp = this.getCmpForGridEl(e.target, this._data);
    if (!cmp) return;
    if ( !cmp.components.length) return;
    console.log(cmp)

    this.openedList.push(cmp); // TODO Register component instead of gridEl

    this.openComponent(cmp)

    //cmp.gridEl && cmp.gridEl.setAttribute('animating', '')
    //HACK
        this.shadowRoot.getElementById("grid").removeAttribute('content-revealed')
    this.runCharacterMorph(cmp).then(() => {
      this.updateGroupTransform(this._data);
      // HACK
      setTimeout(() => {
        cmp.gridEl && cmp.gridEl.removeAttribute('animating')

        this.shadowRoot.getElementById("grid").setAttribute('content-revealed', '')
        //this.shadowRoot.getElementById("grid").removeAttribute('animating')
      }, this.animDuration)
    });
  }

  openComponent(cmp: ComponentDefinition) {
    if (!cmp.gridEl) {
      console.warn('No grid element for component')
      // TODO this should not happen, do better typing
      return
    }
    cmp.opened = true;

    cmp.gridEl.setAttribute('opened', '')

    cmp.components.forEach((subCmp: ComponentDefinition) => {
      if (!subCmp.character)
        this.openComponent(subCmp)
    })
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

  progress(time: number) {
    const progressDuration = time - this.animStartTime;
    return progressDuration / this.animDuration;
  }

  anim() {
//const animationOptions = {
//    duration: 1000, // Animation duration in milliseconds
//    easing: 'ease', // Timing function
//};
//const keyframeEffect = new KeyframeEffect(null, null, animationOptions);
//this.animation = new Animation(keyframeEffect, document.timeline);
//this.animation.play();

    requestAnimationFrame(this._anim.bind(this));
  }
  _anim(time: number) {
    this.animStartTime = time;
    this._drawAnim(this.animStartTime);
  }

  _drawAnim(time: number) {
    let progress = this.progress(time);

    this.strokeUpdate(progress);

    if (progress < 1) {
      requestAnimationFrame(this._drawAnim.bind(this));

    }
  }

  strokeUpdate(progress: number) {
    for (let i = 0; i < this.interpolators.length; i++) {
      if (!this.interpolators[i]) continue;
      const strokePath = this.interpolators[i](progress);
      this.paths[i].setAttribute("d", strokePath);
    }
  }

  renderGroupedStrokes(target: any, strokes: any) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "component-svg")
    target.appendChild(svg);
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.mainSvgGroup = group;
    svg.setAttributeNS(null, "viewBox", "0 -100 1000 1000"); //"0 0 1080 720");
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
      width: 300px;
      height: 300px;
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
transition: transform ${ANIM_DURATION/1000}s linear; /*HACK*/
    }


    #grid {
      display: flex;
      width: 300px;
      min-height: 300px;
      align-items: center;
    }
    #grid [cdl], #grid [char] {
      position: relative;
      flex: 1;
      overflow: hidden;
      align-items: center;
      box-sizing: border-box;

      display:none;
    }

    [char][opened] > *:not([opened]), [cdl][opened] > *:not([opened]) {
      display: block !important;
      overflow: visible !important;
flex: 0 !important;
    }


[opened] {
display: flex !important;
}


    #grid [char]::before {
content: '';
     display:block;
    }

    #grid[horizontal-len="1"] [char]::before {
      width: 150px;
      height: 150px;
    }

    #grid[horizontal-len="2"] [char]::before {
      width: 150px;
      height: 150px;
    }

    #grid[horizontal-len="3"] [char]::before {
      width: 100px;
      height: 100px;
    }

    #grid[horizontal-len="4"] [char]::before {
      width: 75px;
      height: 75px;
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
    [char="帀"] {
      height: 150px;
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
max-width: 150px;
font-size: 14px;
    padding-top: 8px;
    font-family: 'Roboto';
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

  static template = html`
    <div id="grid"></div>
  `;
}

register(CharacterMorph);
