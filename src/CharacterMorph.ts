import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";

import { Component, register, html, css } from "pouic";
import { CharacterData } from './decompose'

import { cleanDescription, cleanPinyin, getPinyinTone } from './processData'

//import { InteractiveCharacter, getCmpForGridEl } from "./InteractiveCharacter";
import { InteractiveCharacter, getCmpForGridEl, getCmpStrokeData, getComponentAbsoluteFirstIndex } from "./InteractiveCharacter";
//import { InteractiveCharacter, getCmpForGridEl,  getComponentAbsoluteFirstIndex} from "./InteractiveCharacter";

import { makeUniform } from "./uniformPath";

//import './worker'

//import MyWorker from 'worker-loader!./_morphWorker'
//const worker = new MyWorker();

//const worker = new Worker('_morphWorker.js');
//const a= document.getElementById('worker')
//const worker = new Worker(
//        // @ts-ignore
//        URL.createObjectURL(new Blob(["("+worker_function.toString()+")()"], { type: 'module' }))
//    );
//
//console.log(worker)

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
  }

  connectedCallback() {
    this.style.setProperty('--char-transition-duration', this.animDuration / 1000 + 's');
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

    const firstIdx = getComponentAbsoluteFirstIndex(cmp)
    const morphs = this.getMorphs(cmp.data)

    requestAnimationFrame(() => {
    morphs.forEach((m :any, i: number) => {
      this.paths[firstIdx + i].setAttribute("d", m[backward ? 1 : 0]);
    })

    requestAnimationFrame(() => {
      morphs.forEach((m :any, i: number) => {
        this.paths[firstIdx + i].setAttribute("d", m[backward ? 0 : 1]);
      })
    })
    })

    //worker.onmessage = (event) => {
    //  const morphs = event.data as string[][]
    //  console.log(morphs, backward, firstIdx)
    //morphs.forEach((m, i) => {
    //  this.paths[firstIdx + i].setAttribute("d", m[backward ? 1 : 0]);
    //})
    //requestAnimationFrame(() => {

    //  morphs.forEach((m, i) => {
    //    this.paths[firstIdx + i].setAttribute("d", m[backward ? 0 : 1]);
    //  })
    //})
    //};

    //worker.postMessage(cmp.data)


    //setTimeout(() => {
    //}, 0);
  }


  createSubGroupRec(cmp: InteractiveCharacter) {
    //throw new Error("subCmp is missing svgGroup")
    if (cmp.svgGroup && !cmp.components.length) {
      const firstIdx = getComponentAbsoluteFirstIndex(cmp)
      const relatedPaths = this.paths.slice(
        firstIdx,
        firstIdx + (cmp.data.len || 0),
      );
      relatedPaths.map((path: any) => cmp.svgGroup?.appendChild(path));
      return;
    }
    for (const subCmp of cmp.components) {
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

    this.paths = this.renderPaths(strokes);

    const grid = this.shadowRoot.getElementById("grid");

    charObj.gridEl = grid

    this.generateGridRec(grid, charObj);
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
<svg class="component-svg" viewBox="0 -124 1024 1024"></svg>
          </div>
          <div class="pinyin" tone="${tone}">
            ${cleanedPinyin}
          </div>
<div class="description">${description}</div>`;

      content.classList.toggle("character-content");
      el.appendChild(content);
      const svg = content.querySelector('svg')
      if (!svg)
        return
      cmp.svgGroup = svg
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


  setClosedRec(cmp: InteractiveCharacter) {
    cmp.opened = false;

    cmp.components.forEach((subCmp: InteractiveCharacter) => {
      if (this.cmpShouldAutoOpen(subCmp)) this.setClosedRec(subCmp);
    });
  }

  async reassemble() {

    const cmp = this.openedList.pop();
    if (!cmp) return;

    const h = cmp.gridEl.clientHeight
    //const a = this.setWrapHeight(cmp)

    this.saveRectRec(this._charObj);
    this.setClosedRec(cmp)
    this.updateHorizontalLen()

    const b = this.getCharContentHeight(cmp)
    //if(!cmp.gridEl) return
    //cmp.gridEl.style.width = b.w + "px"
    cmp.gridEl.style.height = b.h + "px"

    this.closeComponent(cmp);

    this.setOpenRec(cmp)
    this._charObj.components.forEach(this.wUpdateRec.bind(this))
    this.setClosedRec(cmp)

    // TODO jump with previously set height ?
    if(!cmp.gridEl) return
    console.log(h, b.h)
      cmp.gridEl.animate([{
        //width: a.w + 'px',
        height: h + 'px'
      }, {
        //width: b.w + 'px',
        height: b.h + 'px',
      }], {
        duration: this.animDuration
      })
    //cmp.components.forEach(this.wUpdateRec.bind(this))
    //

    //if(!cmp.gridEl) return
    //  cmp.gridEl.animate([{
    //    width: a.w + 'px',
    //    height: a.h + 'px'
    //  }, {
    //    width: b.w + 'px',
    //    height: b.h + 'px',
    //  }], {
    //    duration: this.animDuration
    //  })

    this.runMorph(cmp, true)
  }

  closeComponent(cmp: InteractiveCharacter) {
    if (!cmp.gridEl || cmp.gridEl.getAttribute("opened") === null)
      return
    const timeoutId = this.openingTimeoutIds.get(cmp)
    if (timeoutId) {
      clearTimeout(this.openingTimeoutId)
      cmp.gridEl.removeAttribute("opening");
    }
    cmp.gridEl && cmp.gridEl.toggleAttribute("closing", true); // TODO closeComponent recursive // TODO gridEl better typing no need to check

    setTimeout(() => {
      if (!cmp.gridEl) return
      cmp.gridEl && cmp.gridEl.removeAttribute("opened"); // TODO closeComponent recursive // TODO gridEl better typing no need to check

      cmp.gridEl && cmp.gridEl.removeAttribute("closing");

      cmp.gridEl.style.height = ''
      cmp.gridEl.style.width = ''

    }, this.animDuration)

    cmp.components.forEach(this.closeComponent.bind(this));

    //this.setCharContentHeight(cmp)
  }

  onClick(e: any) {
    e.stopPropagation();
    // "unfolded" in e.target.classList
    const cmp = getCmpForGridEl(e.target, this._charObj);
    if (cmp) this.open(cmp);
  }

  updateHorizontalLen() {
    let horizontalLen = this.getHorizontalCharacterCount(this._charObj);
    //let vertLen = this.getVerticalCharacterCount(this._charObj);
    if (!this._charObj)
      throw new Error('err')
    if (this._charObj.opened)
      horizontalLen = Math.max(3, horizontalLen)
    //if (vertLen > 3)
    //  horizontalLen = Math.max(6, horizontalLen)
    const w = this.shadowRoot.host.clientWidth - 20;//this._charObj.gridEl.clientWidth
    this._charObj.gridEl.style.setProperty('--sub-character-w', `${w / horizontalLen}px`);
  }

  getCharContentHeight(cmp: InteractiveCharacter) {
    if (!cmp.gridEl) throw new Error('err')
    const charContent = cmp.gridEl.querySelector(".character-content")
    if (!charContent)
      throw new Error('err')
    return {
  h: charContent.clientHeight,
      w: charContent.clientWidth
    }
    //cmp.gridEl.style.height = charContent.clientHeight + "px"
    //cmp.gridEl.style.width = charContent.clientWidth + "px"
  }

  getWrapHeight(cmp: InteractiveCharacter) {
    if (!cmp.gridEl) throw new Error('err')
    const wrap = cmp.gridEl.querySelector(".wrap")
    if (!wrap)
      throw new Error('err')

    return {
  h: wrap.clientHeight,
      w: wrap.clientWidth
    }
    //cmp.gridEl.style.height = wrap.clientHeight + "px"
    //cmp.gridEl.style.width = wrap.clientWidth + "px"
  }

  cmpShouldAutoOpen(cmp: InteractiveCharacter) {
    return cmp.components.length && (!cmp.data.pinyin || !cmp.data.pinyin[0])// || !cmp.data.strokes)
  }

  saveRectRec(cmp: InteractiveCharacter) {
    cmp.components.forEach((subCmp: InteractiveCharacter) => {
      if (!subCmp.gridEl) return
      const yo = subCmp.gridEl.querySelector('.character-content > .char-area')
      if (!yo) return
      const rect = yo.getBoundingClientRect();
      subCmp.prevRect = rect
        this.saveRectRec(subCmp);
    });
  }

  setOpenRec(cmp: InteractiveCharacter) {
    cmp.opened = true;
    cmp.components.forEach((subCmp: InteractiveCharacter) => {
    if (this.cmpShouldAutoOpen(subCmp))
        this.setOpenRec(subCmp);
    });
  }

  wUpdateRec(cmp: InteractiveCharacter) {
    if (!cmp.gridEl || !cmp.parent || !cmp.parent.gridEl)
      throw new Error('err')

    if (!cmp.opened) {
      const ge = cmp.gridEl

      if (!ge)
        return
      const cc = ge.querySelector('.character-content')
      if (!cc)
        throw new Error('err')
      const a = cc.querySelector('.char-area')
      let rect = cmp.prevRect
      if (!rect)
        throw new Error('err')
      if (!a)
        throw new Error('err')
      const r = rect.width / a.clientWidth
      if (!r)
        throw new Error('err')

      const { top: geT, left: geL, width: geW } = cc.getBoundingClientRect()
      //const { top: geT, left: geL, height: geH, width: geW } = cc.getBoundingClientRect()
      const { top: pgeT, left: pgeL } = rect
      //const toY = -(geT - pgeT)/2
      //const toX = (geL - pgeL) /2
      //const shiftY = -(geT - pgeT + geH / 2 - geH * r / 2) / r
      const shiftX = -(geL - pgeL + geW / 2 - geW * r / 2) / r

      ge.animate({
        transform: [`scale(${String(r)}) translate(${shiftX}px, ${-(geT - pgeT) / r}px)`, `scale(1) translate(0px, 0px)`],
      },
        this.animDuration
                )
      //ge.animate([{
      //  transform: `scale(${String(r)}) translate(${shiftX}px, ${-(geT - pgeT) / r}px)`,
      //}, {
      //  transform: `scale(1) translate(0px, 0px)`,
      //}], {
      //  duration: this.animDuration
      //})
      return
    }

    //if (this.cmpShouldAutoOpen(cmp) )
      cmp.components.forEach(this.wUpdateRec.bind(this))

  }

  open(cmp: InteractiveCharacter = this._charObj) {
    const a = this.getCharContentHeight(cmp)
    if (!cmp.components.length) return;

    this.openedList.push(cmp);

    this.saveRectRec(this._charObj);
    this.setOpenRec(cmp);
    this.updateHorizontalLen()
    this.openComponent(cmp);

    this._charObj.components.forEach(this.wUpdateRec.bind(this))
    const b = this.getWrapHeight(cmp)

    if(!cmp.gridEl) return
      cmp.gridEl.animate([{
        //width: a.w + 'px',
        height: a.h + 'px'
      }, {
        //width: b.w + 'px',
        height: b.h + 'px',
      }], {
        duration: this.animDuration
      })
    this.runMorph(cmp)

  }

  openComponent(cmp: InteractiveCharacter) {
    if (!cmp.gridEl) {
      console.warn("No grid element for component");
      // TODO this should not happen, do better typing
      return;
    }

    cmp.components.forEach((subCmp: InteractiveCharacter) => {
      if (this.cmpShouldAutoOpen(subCmp)) {
        this.openComponent(subCmp);
      }
    });

    cmp.gridEl.setAttribute("opened", "");
    cmp.gridEl.setAttribute("opening", "");
    const timeoutId = setTimeout(() => {
      if (!cmp.gridEl)
        throw new Error("err")
      cmp.gridEl.removeAttribute("opening");
      //cmp.gridEl.style.height = ''
      //cmp.gridEl.style.width = ''
    }, this.animDuration)

    this.openingTimeoutIds.set(cmp, timeoutId)

  }

  static css = css`

#grid {
position: relative;
    margin: 10px;
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
      /*margin: 10px;*/

    display: flex;
    }

    .component-svg {
      pointer-events: none;
      scale: 1 -1;
      transform-origin: 50% 50%;
      overflow: visible;
      position: absolute;
top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    }

    .component-svg path {
      fill: #555;
    }

    .component-svg g {
      /*transition: transform ${ANIM_DURATION / 1000}s linear; */
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

    [char][opened] > .character-content,
    [char][closing] > .character-content{
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
transition: var(--char-transition-duration) ease-out;
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
