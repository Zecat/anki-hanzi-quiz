import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";

import { Component, register, html, css } from "pouic";
import { CharacterData } from './decompose'

import { cleanDescription, cleanPinyin, getPinyinTone } from './processData'

import { InteractiveCharacter, getCmpForGridEl, getComponentAbsoluteFirstIndex, getHorizontalCharacterCount } from "./InteractiveCharacter";
import { runMorph } from "./morph/runMorph";

import { state } from "./state";


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
    // TODO pouic repeat binding creates duplicates of the components
  }

  onResize() {
    this.updateHorizontalLen()
    this.updateAllStrokesLayout()
  }

  connectedCallback() {
    this.style.setProperty('--char-transition-duration', this.animDuration / 1000 + 's');
    window.addEventListener('resize', this.onResize.bind(this));
  }

  createSubGroup(parentGroup: Element): Element {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    parentGroup.appendChild(group)
    return group
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
      if (!subCmp.components.length)
        subCmp.svgGroup.classList.toggle('leaf')
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

  attachGridEventListener(cmp: InteractiveCharacter) {
    if (cmp.gridEl)
      cmp.gridEl.addEventListener("click", this.onClick.bind(this));
    for (let subCmp of cmp.components) {
      this.attachGridEventListener(subCmp);
    }
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
    runMorph(this.paths, cmp, true)
    this.svgEl.toggleAttribute("closing", true);
    setTimeout(() => {
      this.svgEl.toggleAttribute("closing", false);
    }, this.animDuration)
    const closedComponents = this.toggleCmpOpenedState(cmp, false)
    this.updateHorizontalLen()


    let targetTransformOrigin: string, targetTransform: string
    const animPromises = leafComponents.map((leafCmp: InteractiveCharacter) => {
      const { cmpSvgGroup, prevTransform, toTransform, prevTransformOrigin, toTransformOrigin, gridEl, gePrevTransform, geToTransform } = this.getComponentAnimationParams(leafCmp)
      const anim = cmpSvgGroup.animate({
        transform: [prevTransform, toTransform],
        transformOrigin: [prevTransformOrigin, toTransformOrigin]
      },
        this.animDuration
      )

    gridEl.animate({
      transform: [gePrevTransform, geToTransform],
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
    if (!this._charObj)
      return
    let horizontalLen = getHorizontalCharacterCount(this._charObj);
    // TODO add vertical constrains ?
    //let vertLen = getVerticalCharacterCount(this._charObj);
    if (!this._charObj)
      throw new Error('err')
    let heightShift = 0
    if (this._charObj.opened)
      horizontalLen = Math.max(3, horizontalLen)
    else {
      const pinyinEl = this._charObj.gridEl.querySelector('.character-content > .pinyin')
      const descriptionEl = this._charObj.gridEl.querySelector('.character-content > .description')
      if (pinyinEl && descriptionEl)
        heightShift = pinyinEl.clientHeight + descriptionEl.clientHeight
    }
    //if (vertLen > 3)
    //  horizontalLen = Math.max(6, horizontalLen)
    const w = this.svgEl.clientWidth;
    this._charObj.gridEl.style.setProperty('--sub-character-w', `${w / horizontalLen - heightShift}px`);
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
    // HACK to be able to be notified when the main component is opened/closed
    if (cmp === state.currentComponent.__target)
      state.currentComponent.opened = toggle

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

    cmp.svgGroup?.toggleAttribute("opened", toggle);
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
    if (!cmp.gridEl)
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

    const gePrevTransform = `scale(${String(r)}) translate(${shiftX}px, ${-(geT - pgeT) / r}px)`;
    const geToTransform = `scale(1) translate(0px, 0px)`

    const animParam = {
      cmpSvgGroup,
      prevTransform, toTransform,
      prevTransformOrigin, toTransformOrigin,
      gridEl: ge,
      gePrevTransform, geToTransform
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

  updateCmpStrokesLayout(cmp: InteractiveCharacter) {
    const { cmpSvgGroup, toTransform, toTransformOrigin } = this.getComponentAnimationParams(cmp)
    if (!cmp.svgGroup) return
      cmpSvgGroup.style.transform = toTransform
      cmpSvgGroup.style.transformOrigin = toTransformOrigin
  }

  updateAllStrokesLayout() {
    console.log(this)
    if(!this._charObj) return
    const leafComponents = this.getLeafComponents(this._charObj)
    leafComponents.forEach(this.updateCmpStrokesLayout.bind(this))
  }

  runOpenAnimation(cmp: InteractiveCharacter) {

    const { cmpSvgGroup, prevTransform, toTransform, prevTransformOrigin, toTransformOrigin, gridEl, gePrevTransform, geToTransform } = this.getComponentAnimationParams(cmp)
    //cmpSvgGroup.style.transformOrigin = toTransform
    const anim = cmpSvgGroup.animate({
      transform: [prevTransform, toTransform],
      transformOrigin: [prevTransformOrigin, toTransformOrigin]
    },
      this.animDuration
    )

    gridEl.animate({
      transform: [gePrevTransform, geToTransform],
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
    await runMorph(this.paths, cmp)
    const openedComponents = this.toggleCmpOpenedState(cmp, true);
    this.updateHorizontalLen()

    this.transfertTransform(cmp, openedComponents)
    const leafComponents = this.getLeafComponents(this._charObj)
    leafComponents.forEach(this.runOpenAnimation.bind(this))
    this.animateGridHeight(gridFromHeight, this._charObj.gridEl.clientHeight)
  }

  updateLayout() {
    this.updateHorizontalLen()

    this.saveRectRec(this._charObj);
    const savedAnimDuration = this.animDuration
    this.animDuration = Math.min(300, savedAnimDuration) // HACK make animation faster during initial reveal
    this.runOpenAnimation(this._charObj)
this.animDuration = savedAnimDuration
  }

  static css = css`

#grid {
position: relative;
    margin-bottom: 20px;
width: 100%;
/*HACK*/
justify-content: center;
  display: flex;
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
/*TODO cleanup*/
justify-content: center;
  width: 100%;
  height: 100%;
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
justify-content: unset;
align-items: center;
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

#svg > g[opened].leaf,
g[opened] > g.leaf path {
      fill: #777;
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
