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
    this.animDuration = 1000
    this.interpolators = []
    this.initialStrokes = []
    this._data = undefined;
    this.mainSvgGroup = undefined
    this.unfoldList = []
  }

  connectedCallback() {
    HanziWriter.loadCharacterData('大').then((charData:any)=> {
this.initialStrokes = charData.strokes
  const target:HTMLElement = this.shadowRoot;
   this.renderFanningStrokes(target, charData.strokes);

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
    data.scaleFactor = 1

    data.cumulativeScaleFactor =1
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

  if (cmp.gridEl.offsetParent === null)// element is display none
    {

  cmp.scaleFactor = 1
  cmp.cumulativeScaleFactor = cmp.parent.cumulativeScaleFactor
   // TODO cleanup
    cmp.svgGroup.setAttribute('transform', `translate(0, 0) scale(1, 1)`);
    for (let subCmp of cmp.components) {
      this._updateGroupTransformRec(subCmp)
    }
    return
  }
  const clientRects = cmp.gridEl.getBoundingClientRect()
  console.log(clientRects)
  const {x, y, width } = clientRects
  const {x:px,y:py,width: pwidth} = cmp.parent.gridEl.getBoundingClientRect()
  const scaleFactor =  width/pwidth || 1;
  cmp.scaleFactor = scaleFactor
  cmp.cumulativeScaleFactor = scaleFactor*cmp.parent.cumulativeScaleFactor
  const translateX = (x - px)/cmp.parent.cumulativeScaleFactor || 0
  const translateY = (py - y)/cmp.parent.cumulativeScaleFactor || 0
  console.log(translateY, cmp.character)

  cmp.svgGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scaleFactor}, ${scaleFactor})`);
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

  generateGrid(el: Element, cmp: ComponentDefinition) {
    if (cmp.cdl)
      el.classList.add(cmp.cdl);
    for (let subCmp of cmp.components) {
      const subEl = document.createElement('div')
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

    this.updateGroupTransform(this._data)
  }

  onClick(e:any) {
    e.stopPropagation()
    if ("unfolded" in e.target.classList)
      return
    this.unfoldList.push(e.target)
    for(const child of  e.target.children){
     child.classList.toggle('unfolded', true)
    }
    this.updateGroupTransform(this._data)

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
    const progress = this.progress(time);
    this.strokeUpdate(progress)

    if (progress < 1) {
        requestAnimationFrame(this._drawAnim.bind(this));
    }
}

  strokeUpdate(progress: number) {
   for (let i = 0; i < this.interpolators.length; i++)  {
     const strokePath = this.interpolators[i](progress)
     this.paths[i].setAttribute('d', strokePath)
   }
  }

renderFanningStrokes(target:any, strokes:any) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.border = '1px solid #EEE'
  target.appendChild(svg);
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  this.mainSvgGroup = group

  // set the transform property on the g element so the character renders at 75x75
  const transformData = "scale(1, -1) translate(0, -900)"//HanziWriter.getScalingTransform(200, 200, -15);
  group.setAttributeNS(null, 'transform', transformData);
    svg.setAttributeNS(null, 'viewBox', "0 0 1024 1024");//"0 0 1080 720");
  svg.appendChild(group);

  const paths:any[] = []

  strokes.forEach((strokePath:any)=> {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttributeNS(null, 'd', strokePath);
    // style the character paths
    path.style.fill = '#555';
    group.appendChild(path);
    paths.push(path)
  });
  //svg.addEventListener("click", this.onSvgClick.bind(this))
  this.svg = svg
  this.paths = paths
}

  //generateInterpolations(component: ComponentDefinition) {
  //  this.interpolators = component.components.map()
  //  HanziWriter.loadCharacterData('日').then((charData:any)=> {
  //     charData.strokes.forEach((strokePath: any, idx: number) => {
  //      this.interpolators[idx] = interpolate(this.initialStrokes[idx], strokePath );
  //    })
  //  }).then(this.anim.bind(this));
  //}

  onSvgClick() {
    HanziWriter.loadCharacterData('日').then((charData:any)=> {
       charData.strokes.forEach((strokePath: any, idx: number) => {
        this.interpolators[idx] = interpolate(this.initialStrokes[idx], strokePath );
      })
    }).then(this.anim.bind(this));
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
}

      svg g {
        transition: transform 1s;
transform-origin: 0 0;
}

      svg path{
        /*transition: 1s;*/
      }
#grid {
display: flex;
width: 300px;
    padding-bottom: 100%;
align-items: center;
aspect-ratio: 1;
}
      #grid * {
display: none;
flex: 1;
    aspect-ratio: 1 / 1;
    overflow: hidden;

align-items: center;
background: rgba(255, 255, 0, 0.3);
border: 1px solid orange;

    }

#grid .unfolded {
        display: flex;
}

 .⿰ {
flex-direction: row;
}
 .⿱ {
flex-direction: column;
}
#reassemble-btn {
position: relative;
left: 200px;

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
