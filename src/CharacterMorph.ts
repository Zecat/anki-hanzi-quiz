import HanziWriter from "hanzi-writer";

import "@material/web/iconbutton/icon-button";
import "@material/web/icon/icon";

import { Component, register, html, css } from 'pouic'
//import paper from "paper"
import { interpolate } from "flubber" // ES6

import {ComponentDefinition} from "./HanziDesc"


export default class CharacterMorph extends Component {

  constructor() {
    super()
    this.animStartTime = 0
    this.animDuration = 500
    this.interpolators = []
    this.initialStrokes = []
    this._data = undefined;
    this.mainSvgGroup = undefined
    this.unfoldList = []
    //this.backward = false
  }

  connectedCallback() {
    HanziWriter.loadCharacterData('单').then((charData:any)=> {
this.initialStrokes = charData.strokes
  const target:HTMLElement = this.shadowRoot;
   this.renderGroupedStrokes(target, charData.strokes);

//      setTimeout(() => {
//
//        paper.setup(this.shadowRoot.getElementById('myCanvas'));
// let d_source = "M 349 664 Q 348 665 347 666 Q 322 687 292 696 Q 282 697 274 689 Q 270 682 279 670 Q 331 531 294 261 Q 287 216 271 169 Q 262 141 267 118 Q 277 81 291 65 Q 304 50 314 66 Q 324 79 332 102 L 339 137 Q 349 186 350 238 Q 350 316 351 391 L 352 420 Q 353 576 361 626 C 364 652 364 652 349 664 Z";
//let path = new paper.Path(d_source)
//path.simplify(0.1);
//let svg = path.exportSVG();
////let d_target = paper.parser(svg).attributes.d
////let svg = path.exportSVG({ asString: true});
//      console.log("===", d_source, svg, path)
//      }, 500)
});
  }

  public set data(data: any) {
    if (!data || this._data === data)
      return
    this._data = data
    data.svgGroup = this.mainSvgGroup
    const grid = this.shadowRoot.getElementById('grid');
    data.gridEl = grid

    this.generateGrid(grid, data);
    this.createSubGroupRec(data)
    //data.scaleFactor = 300/1024

    //data.cumulativeScaleFactor =300/1024
    this.updateGroupTransform(data)
    this.attachGridEventListener(data)
  }

updateGroupTransform(cmp: ComponentDefinition) {
   cmp.components.forEach(this._updateGroupTransformRec.bind(this))
}

_updateGroupTransformRec(cmp: ComponentDefinition) {
  if (!cmp.gridEl)
    throw("No Grid element")
  if (!cmp.parent)
    throw("No parent component")
  if (!cmp.parent.gridEl)
    throw("No parent component gridEl")
  if (!cmp.svgGroup)
    throw("No component svgGroup")

  if (cmp.gridEl.offsetParent === null || cmp.opened)// element is display none
    {

   // TODO cleanup
    cmp.svgGroup.setAttribute('transform', `translate(0, 0) scale(1, 1)`);
    for (let subCmp of cmp.components) {
      this._updateGroupTransformRec(subCmp)
    }
    return
  }
  const clientRects = cmp.gridEl.getBoundingClientRect()
  const { x,y, width } = clientRects
  const {x:px,y:py,width: pwidth} = this.shadowRoot.getElementById('grid').getBoundingClientRect()//cmp.parent.gridEl.getBoundingClientRect()
  const scaleFactor =  width/pwidth || 1;
  const r = pwidth/width

  const shiftX = 100/(-pwidth+width) * (-x + px -pwidth  ) - 100* (r / (r - 1)) // TODO simplify calculation
  const shiftY = 100/(-pwidth+width) * (y - py -pwidth  ) - 100 / (r - 1) - 10

  cmp.svgGroup.setAttribute('transform', `scale(${scaleFactor}, ${scaleFactor})`);
  cmp.svgGroup.setAttribute('transform-origin', `${shiftX}% ${shiftY}%`);
    for (let subCmp of cmp.components) {
      this._updateGroupTransformRec(subCmp)
    }
}

  attachGridEventListener(cmp: ComponentDefinition) {
    if (cmp.gridEl)
      cmp.gridEl.addEventListener('click', this.onClick.bind(this))
    for (let subCmp of cmp.components) {
      this.attachGridEventListener(subCmp)
    }
  }

  getHorizontalCharacterCount() {
    return 3
  }

  generateGrid(el: Element, cmp: ComponentDefinition) {
    if (cmp.cdl)
      el.classList.add(cmp.cdl);
    for (let subCmp of cmp.components) {
      const subEl = document.createElement('div')
      if (subCmp.character)
        subEl.setAttribute("char", subCmp.character)
      el.appendChild(subEl)
      subCmp.gridEl = subEl
      this.generateGrid(subEl, subCmp)
    }
  }

  createSubGroup(parentGroup: Element):Element {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    parentGroup.appendChild(group)
    return group
  }

  reassemble() {
    const lastEl = this.unfoldList.pop()
    if (!lastEl)
      return
    for(const child of  lastEl.children){
     child.classList.toggle('unfolded', false)
    }


    const cmp = this.getCmpForGridEl(lastEl, this._data)
    if(!cmp)
      return

    cmp.opened = false;
    this.runCharacterMorphBackward(cmp).then(() => {
    this.updateGroupTransform(this._data)

    })
    //this.updateGroupTransform(this._data)
    //this.backward = true
    //this.anim()
    //setTimeout(() => {
    //this.backward = false

    //}, 1000)
  }


  resetInterpolators() {
    this.interpolators = Array(this.initialStrokes.length).fill(undefined)
  }

  // TODO make generic the 2 following methods
  async runCharacterMorphBackward(cmp: ComponentDefinition) {
    this.resetInterpolators()
    let initialStrokes:any
    if (!cmp.character)
      initialStrokes = this.initialStrokes.slice(cmp.firstIdx)
    else {
    const cmpData:any = await HanziWriter.loadCharacterData(cmp.character)
    initialStrokes = cmpData.strokes
    }
    const promises = cmp.components
      .filter((subCmp: ComponentDefinition) => subCmp.character)
      .map((subCmp: ComponentDefinition) => HanziWriter.loadCharacterData(subCmp.character).then((charData:any)=> {
        charData.strokes.forEach((strokePath: any, idx: number) => {
          this.interpolators[idx +subCmp.firstIdx ] = interpolate(strokePath, initialStrokes[idx + subCmp.firstIdx - cmp.firstIdx]  );
        })
      }).catch((e:any) => {
        console.warn(e);
      }))

    return Promise.all(promises).then(this.anim.bind(this));


    //HanziWriter.loadCharacterData('日').then((charData:any)=> {
    //   charData.strokes.forEach((strokePath: any, idx: number) => {
    //    this.interpolators[idx] = interpolate(this.initialStrokes[idx], strokePath );
    //  })
    //}).then(this.anim.bind(this));
  }

  async runCharacterMorph(cmp: ComponentDefinition) {
    this.resetInterpolators()
    let initialStrokes:any
    if (!cmp.character)
      initialStrokes = this.initialStrokes.slice(cmp.firstIdx)
    else {
      try {
    const cmpData:any = await HanziWriter.loadCharacterData(cmp.character)

    initialStrokes = cmpData.strokes
      } catch(e) {
        console.log(e)

      initialStrokes = this.initialStrokes.slice(cmp.firstIdx)
      }
    }
    const promises = cmp.components
      .map((subCmp: ComponentDefinition) => this.computeInterpolations(subCmp, cmp.firstIdx, initialStrokes)).flat()

    return Promise.all(promises).then(this.anim.bind(this));


    //HanziWriter.loadCharacterData('日').then((charData:any)=> {
    //   charData.strokes.forEach((strokePath: any, idx: number) => {
    //    this.interpolators[idx] = interpolate(this.initialStrokes[idx], strokePath );
    //  })
    //}).then(this.anim.bind(this));
  }

computeInterpolations(cmp:ComponentDefinition, cmpFirstStrokeIdx: number, initialStrokes: any): Promise<any> | undefined |Promise<any>[] {
   if (!cmp.character)
     return // TODO recursivly develop character
     //return cmp.components.map((subCmp: ComponentDefinition) => this.computeInterpolations(subCmp, cmp.firstIdx- cmpFirstStrokeIdx, initialStrokes)).flat()

     //return this.computeInterpolations()
   return HanziWriter.loadCharacterData(cmp.character).then((charData:any)=> {
        charData.strokes.forEach((strokePath: any, idx: number) => {
          this.interpolators[idx +cmp.firstIdx ] = interpolate(initialStrokes[idx + cmp.firstIdx - cmpFirstStrokeIdx], strokePath );
        })
   }).catch((e:any) => {
        console.warn(e);
      })
}
getCmpForGridEl(target: HTMLElement, cmp: ComponentDefinition):ComponentDefinition | undefined {
   if (cmp.gridEl == target)
     return cmp
    for (const subCmp of cmp.components)
      if (subCmp.gridEl === target) return subCmp
    return undefined
  }

  onClick(e:any) {
    e.stopPropagation()
    if ("unfolded" in e.target.classList || !e.target.childElementCount)
      return
    this.unfoldList.push(e.target)
    for(const child of  e.target.children){
     child.classList.toggle('unfolded', true)
    }
    const cmp = this.getCmpForGridEl(e.target, this._data)
    if(!cmp)
      return
    cmp.opened = true;
    this.runCharacterMorph(cmp).then(() => {
    this.updateGroupTransform(this._data)

    })

  }

  createSubGroupRec(component: ComponentDefinition) {
    if(!component.svgGroup)
      return
      //throw new Error("subComponent is missing svgGroup")
    if (!component.components.length) {
      const relatedPaths = this.paths.slice(component.firstIdx, component.lastIdx+1)
      relatedPaths.map((path: any) => component.svgGroup?.appendChild(path))
      return
    }
    for (const subComponent of component.components) {
      const subGroup = this.createSubGroup(component.svgGroup)
      subComponent.svgGroup = subGroup
      this.createSubGroupRec(subComponent)
    }
  }

  progress(time: number) {
    const progressDuration =  time - this.animStartTime
    return progressDuration/this.animDuration
  }

anim() {
requestAnimationFrame(this._anim.bind(this));
}
  _anim(time:number) {

  this.animStartTime = time;
  this._drawAnim(this.animStartTime)
  }

_drawAnim(time:number) {
    let progress = this.progress(time);

    this.strokeUpdate(progress)

    if (progress < 1) {
        requestAnimationFrame(this._drawAnim.bind(this));
    }
}

  strokeUpdate(progress: number) {
   for (let i = 0; i < this.interpolators.length; i++)  {
     if (!this.interpolators[i])
       continue
     const strokePath = this.interpolators[i](progress)
     this.paths[i].setAttribute('d', strokePath)
   }
  }

renderGroupedStrokes(target:any, strokes:any) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  target.appendChild(svg);
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  this.mainSvgGroup = group
  svg.setAttributeNS(null, 'viewBox', "0 -100 1000 1000");//"0 0 1080 720");
  svg.appendChild(group);

  const paths:any[] = []

  strokes.forEach((strokePath:any)=> {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttributeNS(null, 'd', strokePath);
    group.appendChild(path);
    paths.push(path)
  });
  this.svg = svg
  this.paths = paths
}

	static css = css`
      :host {
        position: relative;
        display: block;
        aspect-ratio: 1;
      }

      :host > * {
        position: absolute;
        top: 0;
        left: 0;
      }
svg {
pointer-events: none;
width: 300px;
height: 300px;
    scale: 1 -1;
    transform-origin: 50% 50%;
border: 1px solid #EEE;
}

svg path {
fill: #555;
}

      svg g {
        transition: transform 0.5s linear;
}

svg  g {
}

      svg path{
        /*transition: 1s;*/
      }
#grid {
display: flex;
width: 300px;
min-height: 300px;
    padding-bottom: 100%;
align-items: center;
}
      #grid * {
border: 1px solid grey;
position: relative;
flex: 1;
    overflow: hidden;

align-items: center;
background: rgba(255, 255, 0, 0.3);
    box-sizing: border-box;
min-width: 150px;
    min-height: 150px;
display: none;
    }

#grid .unfolded {
        display: flex;
overflow: visible;
}

 .⿱, .⿳ {
flex-direction: column !important;
flex: none;
}

 .⿰, .⿲, .⿻ {
flex-direction: row !important;

flex: none;
}
 #grid * {
justify-content: center;
}
[char="帀"] {
height: 150px;
}
#reassemble-btn {
position: relative;
left: 300px;

}

[char] {
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
      <md-icon-button id="reassemble-btn" @click="this.reassemble()">
<md-icon>

<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
<path  fill="currentColor" d="M160-400v-80h640v80H160Zm0-120v-80h640v80H160ZM440-80v-128l-64 64-56-56 160-160 160 160-56 56-64-62v126h-80Zm40-560L320-800l56-56 64 64v-128h80v128l64-64 56 56-160 160Z"/></svg>
</md-icon>
      </md-icon-button>
<div id="grid" ></div>
    `;
}

register(CharacterMorph)
