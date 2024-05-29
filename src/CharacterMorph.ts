import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";

import { Component, register, html, css } from "pouic";
import { CharacterData } from './decompose'

import { cleanDescription, cleanPinyin, getPinyinTone } from './processData'

import { InteractiveCharacter, getCmpForGridEl, getCmpStrokeData, getComponentAbsoluteFirstIndex } from "./InteractiveCharacter";

import { makeUniform } from "./uniformPath";


const worker = new Worker('/_morphWorker.js');

const sum = (array: number[]): number =>
  array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

const ANIM_DURATION = 1000;

export default class CharacterMorph extends Component {
  constructor() {
    super();
    this.openingTimeoutIds = new Map();
    this.animDuration = ANIM_DURATION;
    this._charObj = undefined;
    this.mainSvgGroup = undefined;
    this.openedList = [];
    this.animation = undefined;
    this.characterInterpolator = undefined;
    this.svgEl = this.shadowRoot.getElementById('svg')
  }

  connectedCallback() {
    this.style.setProperty('--char-transition-duration', this.animDuration / 1000 + 's');
  }

  createSubGroup(parentGroup: Element): Element {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    parentGroup.appendChild(group)
    return group
  }

  getMorphs(cmpData: CharacterData) {
    const len = cmpData.len || 0
    const morphs = []
    for (let i = 0; i < len; i++) {
      const ret = getCmpStrokeData(cmpData, i)

      if (!ret)
        continue

      const { data, idx } = ret

      if (!data.strokes || !data.medians) // HACK
        continue
      if (!data.repartition) {
        console.warn('No repartition', data.character)
        throw new Error('ERR')
      }

      let initialPath = cmpData.strokes ? cmpData.strokes[i] : undefined; //this.paths[firstIdx + i].getAttribute('d')
      // TODO change fallback to the deepest stroke found in in the main cmp instead of this.paths[fi+i] ?
      //const initialPath = this.paths[firstIdx + i].getAttribute('d')
      //if (!initialPath) {
      //  const a = getCmpStrokeData(cmp.parent, i)
      //  if (!a)
      //    throw new Error('ERR')
      //  const { data:data2, idx:idx2 } = ret
      //  initialPath = data2.strokes[idx2]
      //}
      if (!initialPath) {
        console.warn('No initial path', cmpData.character, i)
        throw new Error('ERR')
      }
      if (!cmpData.strokes) {

        console.warn('No strokes', cmpData.character, i)
        throw new Error('ERR')
      }
      if (!cmpData.repartition) {
        console.warn('No repartition', cmpData.character, i)
        throw new Error('ERR')
      }

      const morph = makeUniform(
        cmpData.strokes[i],
        cmpData.repartition[i],
        data.strokes[idx],
        data.repartition[idx])

      morphs.push(morph)
    }
    return morphs
  }

  runMorph(cmp: InteractiveCharacter, backward: boolean = false) {
    //const morphs = this.getMorphs(cmp.data)

    //morphs.forEach((m: any, i: number) => {
    //  this.paths[firstIdx + i].setAttribute("d", m[backward ? 1 : 0]);
    //})

    //requestAnimationFrame(() => {
    //  morphs.forEach((m: any, i: number) => {
    //    this.paths[firstIdx + i].setAttribute("d", m[backward ? 0 : 1]);
    //  })
    //})
    const { promise, resolve } = Promise.withResolvers();

    const firstIdx = getComponentAbsoluteFirstIndex(cmp)

    worker.onmessage = (event) => {

    requestAnimationFrame(() => {
      const morphs = event.data as string[][]
    morphs.forEach((m, i) => {
      this.paths[firstIdx + i].setAttribute("d", m[backward ? 1 : 0]);
    })
    requestAnimationFrame(() => {

      morphs.forEach((m, i) => {
        this.paths[firstIdx + i].setAttribute("d", m[backward ? 0 : 1]);
      })
      resolve('')
    })
    })
    };

    worker.postMessage(cmp.data)
    return promise

  }


  createSubGroupRec(cmp: InteractiveCharacter) {
    if (!cmp.components.length) {
      const firstIdx = getComponentAbsoluteFirstIndex(cmp)
      const relatedPaths = this.paths.slice(
        firstIdx,
        firstIdx + (cmp.data.len || 0),
      );
      relatedPaths.map((path: any) => cmp.svgGroup?.appendChild(path));
      return;
    }
    for (const subCmp of cmp.components) {
      if (!cmp.svgGroup) throw new Error('err')
      subCmp.svgGroup = this.createSubGroup(cmp.svgGroup)
      this.createSubGroupRec(subCmp);
    }
  }

  renderPaths(strokes: any) {
    const paths: any[] = [];

    strokes.forEach((strokePath: any) => {
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttributeNS(null, "d", strokePath);
      paths.push(path);
    });
    return paths;
  }

  public set data(charObj: any) {

    if (!charObj || this._charObj === charObj) return;
    charObj = charObj.__target; // HACK retreive the proxy target to avoid promise incompatibility
    const strokes = charObj.data.strokes
    if (!strokes) {
      console.warn("Component has no strokes charObj");
      return;
    }

    this._charObj = charObj;
    charObj.svgGroup = this.createSubGroup(this.svgEl)

    this.paths = this.renderPaths(strokes);

    const gridEl = this.shadowRoot.getElementById("grid");

    charObj.gridEl = gridEl

    this.generateGridRec(gridEl, charObj);
    this.createSubGroupRec(charObj);
    this.attachGridEventListener(charObj);
  }

  getVerticalCharacterCount(cmp: InteractiveCharacter): number {
    if (!cmp.data.cdl || !cmp.opened) return 1;
    if (!this.isHorizontalCdl(cmp.data.cdl))
      return sum(
        cmp.components.map(this.getVerticalCharacterCount.bind(this)),
      );
    else
      return Math.max(
        ...cmp.components.map(this.getVerticalCharacterCount.bind(this)),
      );
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

  attachGridEventListener(cmp: InteractiveCharacter) {
    if (cmp.gridEl)
      cmp.gridEl.addEventListener("click", this.onClick.bind(this));
    for (let subCmp of cmp.components) {
      this.attachGridEventListener(subCmp);
    }
  }

  isHorizontalCdl(cdl: string) {
    return cdl != '⿱' && cdl != '⿳'
  }

  generateGridRec(el: Element, cmp: InteractiveCharacter) {
    const data: CharacterData = cmp.data
    if (data.cdl) el.setAttribute("cdl", data.cdl);

    if (data.character) { // TODO change charatcer here ?
      el.setAttribute("char", data.character);

      const content = document.createElement("div");

      const cleanedPinyin = cleanPinyin(data.pinyin);
      const tone = String(getPinyinTone(cleanedPinyin));
      const description = data.definition ? cleanDescription(data.definition) : ''
      content.innerHTML = `
          <div class="char-area">
          </div>
          <div class="pinyin" tone="${tone}">
            ${cleanedPinyin}
          </div>
<div class="description">${description}</div>`;

      content.classList.toggle("character-content");
      cmp.charContentEl = content
      const charAreaEl = content.querySelector('.char-area')
      if (charAreaEl) // TODO better typing?
        cmp.charAreaEl = charAreaEl as HTMLElement
      el.appendChild(content);
    }

    const subElWrapper = document.createElement("div");

    subElWrapper.classList.toggle("wrap");
    for (let i in data.components) {
      const subCmp = cmp.components[i]
      const subEl = document.createElement("div");
      subElWrapper.appendChild(subEl)
      subCmp.gridEl = subEl
      this.generateGridRec(subEl, subCmp);
    }
    el.appendChild(subElWrapper);
  }

  async reassemble() {
    const gridFromHeight = this._charObj.gridEl.clientHeight
    const cmp = this.openedList.pop();
    if (!cmp) return;

    this.saveRectRec(this._charObj);
    const leafComponents = this.getLeafComponents(this._charObj)
    this.runMorph(cmp, true)
    this.svgEl.toggleAttribute("closing", true);
    setTimeout(() => {
      this.svgEl.toggleAttribute("closing", false);
    }, this.animDuration)
    const closedComponents = this.toggleCmpOpenedState(cmp, false)
    this.updateHorizontalLen()


    let targetTransformOrigin: string, targetTransform: string
    const animPromises = leafComponents.map((leafCmp: InteractiveCharacter) => {
      const { cmpSvgGroup, prevTransform, toTransform, prevTransformOrigin, toTransformOrigin } = this.getComponentAnimationParams(leafCmp)
      const anim = cmpSvgGroup.animate({
        transform: [prevTransform, toTransform],
        transformOrigin: [prevTransformOrigin, toTransformOrigin]
      },
        this.animDuration
      )
      anim.finished.then(() => {
        if (closedComponents.includes(leafCmp)) {
          targetTransform = toTransform
          targetTransformOrigin = toTransformOrigin
          cmpSvgGroup.style.transform = ''
          cmpSvgGroup.style.transformOrigin = ''
        } else {
          cmpSvgGroup.style.transform = toTransform
          cmpSvgGroup.style.transformOrigin = toTransformOrigin
        }
      })

      return anim.finished
    })
    Promise.all(animPromises).then(() => {
      const cmpSvgGr = cmp.svgGroup as HTMLElement
      if (!cmpSvgGr) throw new Error('err')
      cmpSvgGr.style.transform = targetTransform
      cmpSvgGr.style.transformOrigin = targetTransformOrigin
    })

    this.animateGridHeight(gridFromHeight, this._charObj.gridEl.clientHeight)


  }

  onClick(e: any) {
    e.stopPropagation();
    // "unfolded" in e.target.classList
    const cmp = getCmpForGridEl(e.target, this._charObj);
    if (cmp) this.open(cmp);
  }

  updateHorizontalLen() {
    let horizontalLen = this.getHorizontalCharacterCount(this._charObj);
    // TODO add vertical constrains ?
    //let vertLen = this.getVerticalCharacterCount(this._charObj);
    if (!this._charObj)
      throw new Error('err')
    if (this._charObj.opened)
      horizontalLen = Math.max(3, horizontalLen)
    //if (vertLen > 3)
    //  horizontalLen = Math.max(6, horizontalLen)
    const w = this.svgEl.clientWidth;
    this._charObj.gridEl.style.setProperty('--sub-character-w', `${w / horizontalLen}px`);
  }

  cmpShouldAutoOpen(cmp: InteractiveCharacter) {
    return cmp.components.length && (!cmp.data.pinyin || !cmp.data.pinyin[0])// || !cmp.data.strokes)
  }

  saveRectRec(cmp: InteractiveCharacter) {
    if (cmp.charAreaEl)
      cmp.prevRect = cmp.charAreaEl.getBoundingClientRect();
    cmp.components.forEach(this.saveRectRec.bind(this))
  }

  toggleCmpOpenedState(cmp: InteractiveCharacter, toggle: boolean, newComponents: InteractiveCharacter[] = []): InteractiveCharacter[] {
    cmp.opened = toggle;

    if (!cmp.gridEl) throw new Error('err')
    if (toggle) {

      cmp.gridEl.setAttribute("opened", "");
      cmp.gridEl.setAttribute("opening", "");

      setTimeout(() => {
        if (!cmp.gridEl)
          throw new Error("err")
        cmp.gridEl.removeAttribute("opening");
      }, this.animDuration)
    } else {

      cmp.gridEl.toggleAttribute("closing", true); // TODO gridEl better typing no need to check

      setTimeout(() => {
        if (!cmp.gridEl)
          throw new Error("err")
        cmp.gridEl.removeAttribute("opened");  // TODO gridEl better typing no need to check
        cmp.gridEl.removeAttribute("closing");
      }, this.animDuration)
    }
    cmp.components.forEach((subCmp: InteractiveCharacter) => {
      if (this.cmpShouldAutoOpen(subCmp))
        this.toggleCmpOpenedState(subCmp, toggle, newComponents);
      else
        newComponents.push(subCmp)
    });
    return newComponents
  }

  transfertTransform(cmp: InteractiveCharacter, newComponents: InteractiveCharacter[]) {
    const cmpSvgGr = cmp.svgGroup as HTMLElement
    if (!cmpSvgGr)
      throw new Error('no Svg group for ' + cmp.data.character)

    const cmpT = cmpSvgGr.style.transform
    const cmpTo = cmpSvgGr.style.transformOrigin

    cmpSvgGr.style.transform = ''
    cmpSvgGr.style.transformOrigin = ''

    for (let newCmp of newComponents) {
      const newCmpSvgGr = newCmp.svgGroup as HTMLElement
      if (!newCmpSvgGr)
        throw new Error('no Svg group for ' + newCmp.data.character)

      newCmpSvgGr.style.transform = cmpT
      newCmpSvgGr.style.transformOrigin = cmpTo
    }
  }

  getComponentAnimationParams(cmp: InteractiveCharacter) {
    if (!cmp.gridEl || !cmp.parent || !cmp.parent.gridEl)
      throw new Error('err')

    const ge = cmp.gridEl

    if (!ge || !cmp.charAreaEl || !cmp.charContentEl || !cmp.prevRect)
      throw new Error('err')

    const { top: geT, left: geL } = cmp.charContentEl.getBoundingClientRect()
    const { height: geH, width: geW } = cmp.charAreaEl.getBoundingClientRect()
    const { top: pgeT, left: pgeL, width: pgeW } = cmp.prevRect

    const r = pgeW / geW

    if (!r)
      throw new Error('err')

    const shiftX = -(geL - pgeL + geW / 2 - geW * r / 2) / r
    const cmpSvgGroup = cmp.svgGroup as HTMLElement
    if (!cmpSvgGroup)
      throw new Error('err')

    const prevTransform = cmpSvgGroup.style.transform || 'scale(1)'
    const prevTransformOrigin = cmpSvgGroup.style.transformOrigin || 'center 900px'
    const svgWidth = this.svgEl.clientWidth
    const r2 = geW / svgWidth

    const { top: svgT, left: svgL, width: svgW } = this.svgEl.getBoundingClientRect()

    const d = (svgW - geW) === 0 ? 'center' : (geL - svgL) / (svgW - geW) * 1024 + 'px'
    const toY = (-(geT - svgT) / (svgW - geH) * 1024 || 0) + 900

    const toTransform = `scale(${String(r2)})`
    const toTransformOrigin = `${d} ${toY}px`

    ge.animate({
      transform: [`scale(${String(r)}) translate(${shiftX}px, ${-(geT - pgeT) / r}px)`, `scale(1) translate(0px, 0px)`],
    },
      this.animDuration
    )

    const animParam = {
      cmpSvgGroup,
      prevTransform, toTransform,
      prevTransformOrigin, toTransformOrigin
    }

    return animParam
  }

  getLeafComponents(cmp: InteractiveCharacter, leafComponents: InteractiveCharacter[] = []) {
    if (!cmp.opened) {
      leafComponents.push(cmp)
    } else
      cmp.components.forEach((subCmp: InteractiveCharacter) => {
        this.getLeafComponents(subCmp, leafComponents)
      })
    return leafComponents

  }

  runOpenAnimation(cmp: InteractiveCharacter) {

    const { cmpSvgGroup, prevTransform, toTransform, prevTransformOrigin, toTransformOrigin } = this.getComponentAnimationParams(cmp)
    //cmpSvgGroup.style.transformOrigin = toTransform
    const anim = cmpSvgGroup.animate({
      transform: [prevTransform, toTransform],
      transformOrigin: [prevTransformOrigin, toTransformOrigin]
    },
      this.animDuration
    )

    anim.finished.then(() => {
      cmpSvgGroup.style.transform = toTransform
      cmpSvgGroup.style.transformOrigin = toTransformOrigin
    })
  }

  animateGridHeight(fromHeight: number, toHeight: number) {

    if (!this._charObj.gridEl)
      return

    if (!this._charObj.gridEl) return
    this._charObj.gridEl.animate({
      height: [fromHeight + 'px', toHeight + 'px']
    },
      this.animDuration)
  }

  async open(cmp: InteractiveCharacter = this._charObj) {

    const gridFromHeight = this._charObj.gridEl.clientHeight
    if (!cmp.components.length) return;

    this.openedList.push(cmp);

    this.saveRectRec(this._charObj);
    await this.runMorph(cmp)
    const openedComponents = this.toggleCmpOpenedState(cmp, true);
    this.updateHorizontalLen()

    this.transfertTransform(cmp, openedComponents)
    const leafComponents = this.getLeafComponents(this._charObj)
    leafComponents.forEach(this.runOpenAnimation.bind(this))
    this.animateGridHeight(gridFromHeight, this._charObj.gridEl.clientHeight)
  }

  static css = css`

#grid {
position: relative;
    margin-bottom: 20px;
width: 100%;
}

/*HACK no opacity transiiton to prevent jump*/
[closing] > .wrap >  [char] > .character-content > .pinyin,
[closing] > .wrap >  [char] > .character-content > .description {
transition: none;
}
[opened] > .character-content > .pinyin,
[opened] > .character-content > .description,
:not([opened]) > .wrap >  [char] > .character-content > .pinyin,
:not([opened]) > .wrap >  [char] > .character-content > .description,
[opening] > .wrap >  [char] > .character-content > .pinyin,
[opening] > .wrap >  [char] > .character-content > .description,
[closing] > .wrap >  [char] > .character-content > .pinyin,
[closing] > .wrap >  [char] > .character-content > .description {
opacity: 0;
}

.character-content > .pinyin,
.character-content > .description {
transition: opacity 0.3s;

}

[char] {
justify-content: center;
}

[opened] > .wrap > [char] {
width: max-content;
}

[closing]>.wrap > [char] {
position: absolute !important;
}
:not([opened])>.wrap > [char] {
position: absolute;
}


[opened]>.wrap > [char] {
position: relative;
}


[opening]>.wrap > [char],
[closing]>.wrap > [char]{

position: unset;
}

    [char][closing] > [char],
    [cdl][closing] >[char] ,
    [char][opened] > [char],
    [cdl][opened] >[char] {
      display: flex !important;
      overflow: visible !important;
      flex: 0 !important;
    }

[opened] {
pointer-events: none;
}

[opened]:not([closing]) > .wrap {
position: unset;
}
[opened] > .wrap {
opacity: 1 !important;
pointer-events: all;
}


    :host([debug]) #grid * {
      background: rgba(255, 255, 0, 0.3);
      border: 1px solid grey;
    }

    :host([debug]) .character-content {
      background: blue !important;
    }

    :host {
transition-timing-function: linear;
      position: relative;
      margin: 10px;

    display: flex;
    }

    #grid {
    }

    #grid[opened] {
      aspect-ratio: unset;
      /*margin-bottom: 20px;*/
    }

.wrap {
position: absolute;
pointer-events: none;
left:0;
top:0;
}


#grid [cdl],#grid [char] {
      box-sizing: border-box;
}
    #grid [cdl][opened],
    #grid [cdl][closing],
    #grid [char][opened],
    #grid [char][closing]{
   /*margin-bottom: 20px;*/
    }

    [cdl] {
      display: flex;
    }

[cdl] > .wrap {
  display: flex;
height: max-content;
}

    [cdl="⿱"] > .wrap,
    [cdl="⿳"] > .wrap {
flex-direction: column;
    }

.character-content > .char-area {
width: 100%;
aspect-ratio: 1;
position: relative;

}

[char] {
      transform-origin: center 0;
}
    .character-content {

pointer-events: none;
      width: var(--sub-character-w);
      text-align: center;
    }

    [char][opened]:not([closing]) > .character-content{
      opacity: 0 !important;
      position: absolute;
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
transition: var(--char-transition-duration) ease-in;
}

#svg[closing] path {
transition: var(--char-transition-duration) ease-out;
}

#svg {
position: absolute;
pointer-events:none;
scale: 1 -1;
  transform-origin: center center;
overflow: visible;
      fill: #555;
}

#svg g {
  transform-origin: center 900px;
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

  static template = html` <div id="grid"></div>
<svg id="svg" viewBox="0 -124 1024 1024"></svg>
`;
}

register(CharacterMorph);
