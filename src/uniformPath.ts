function cumulativePrevSum(array: number[]): number[] {
  if (!Array.isArray(array)) {
    throw new Error("Input is not an array");
  }

  const arr = array.reduce((acc: number[], curr: number) => {
    const lastSum = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(lastSum + curr);
    return acc;
  }, []);
    // TODO clean up
  arr.unshift(0)
    arr.pop()
    return arr
}

const sum = (array: number[]): number =>
  array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
import {Bezier}  from 'bezier-js'

  const printCubic = (p: any) => {
    return `C${p[0].x},${p[0].y} ${p[1].x},${p[1].y} ${p[2].x},${p[2].y}`
  }


const splitPath = (p:string, n: number) => {
    if (p[0]!="C")
      throw new Error("Path should be cubic")
    p = p.substring(1);
    const sArr = p.split(/[ ,]/).filter(p => p!="")
    const pArr = sArr.map(str => Number(str))
const q = 1/n
const b = new Bezier(...pArr);
    const res = []
    for (let i = 0; i < n; i++) {
      const np = b.split(i*q, (i+1)*q)
      res.push(np)
    }
    const resPrint = res.map((bezier: any) => printCubic(bezier.points))
    return resPrint
//const b = Bezier.cubicFromPoints({x: pArr[0], y: pArr[1]}, {x: pArr[2], y: pArr[3]}, {x: pArr[4], y: pArr[5]});
//const {left, right} = b.split(0.5); // Divide at t = 0.5
//const l = left.points
//const r = right.points
//    const leftPath = this.printCubic(l)
//const rightPath = this.printCubic(r)
//return [leftPath, rightPath]
  }

class DPath {
    moveTo: string
    cubic: any[]

    constructor (p: string) {
    const startI = p.indexOf('C')
    this.moveTo = p.slice(0, startI)
    const p2 = p.slice(startI, -1)
    const splitPaths = p2.split("C").filter((part: string) => part !== "");
    this.cubic = splitPaths.map((part:string) => "C" + part);
    }
    add(n: number) {
        this.cubic[0] = splitPath(this.cubic[0], n+1)
        this.cubic = this.cubic.flat()
    }
    toString() : string{
      return `${this.moveTo}${this.cubic.join('')}Z`
    }

}

const bezierToPtArr=(b: any)=> { // TODO typing
    const p = b.points
    return [p[0].x,p[0].y,p[1].x,p[1].y,p[2].x,p[2].y]
}

const splitSegment = (seg: Segment, t: number) => {
    if (seg.key != 'C')
        throw new Error('Invalid segment, should be cubic')
    const bez = new Bezier(...seg.data);
    const {left, right} = bez.split(t)

    const leftSeg = {key: 'C', data: bezierToPtArr(left)}
    const rightSeg = {key: 'C', data: bezierToPtArr(right)}
    return [leftSeg, rightSeg]
}

export const makeUniformOld = (pStr1: string, pStr2:string) => {
    const p1 = new DPath(pStr1)
    const p2 = new DPath(pStr2)
    let l1 = p1.cubic.length
    let l2 = p2.cubic.length
    const diff = l1 - l2
    if (diff > 0) {
        p2.add(diff)
        pStr2 = p2.toString()
    }
    else if (diff < 0){
        p1.add(-diff)
        pStr1 = p1.toString()
    }

    return [pStr1, pStr2]
}

import { parsePath, serialize, normalize} from 'path-data-parser';
import {  Segment} from 'path-data-parser/src/parser';
//import {Segment} from 'path-data-parser/types'
 import {
   cubicBezierLine,
 } from 'bezier-intersect';

export const makeUniform =  (pStr1: string, rep1:StrokeAnalysis, pStr2: string, rep2: StrokeAnalysis) => {
      const p1 = _makeUniform(
          pStr1,
          rep1,
          pStr2,
          rep2,
      )

      const p2 = _makeUniform(
          pStr2,
          rep2,
          pStr1,
          rep1,
      )
    return [p1, p2]
}

export const _makeUniform = (pStr1: string, rep1:StrokeAnalysis, pStr2: string, rep2: StrokeAnalysis) => {
    const p1 = parsePath(pStr1)
    const p2 = parsePath(pStr2)

    if (p1.some((s: Segment) => !['C', 'Z', 'M'].includes(s.key)) || p2.some((s: Segment) => !['C', 'Z', 'M'].includes(s.key))) {
        throw new Error('Invalid path')
    }

    const rep1R = rep1.right.map((sa: SegAnalysis)=>({...sa})) // Clone
    const rep2R = rep2.right

    let i2 = rep2.right.length - 1;
    let i1 = rep1.right.length - 1;

    while (i2 >= 0 && rep2R[i2].cumulRatio > rep1R[i1].cumulRatio) {
        i2--;
    }

    const tipIdx = i2;

   for (;i2 >= 0; i2--) {
       while(i1 > 0 && rep2R[i2].cumulRatio < rep1R[i1].cumulRatio) { i1--}
       const pathProgress = rep2R[i2].cumulRatio - rep1R[i1].cumulRatio // half path progress of the segment we want to extract
       let t = pathProgress *rep1.rLen/ rep1R[i1].len

       if (i1 === 0) {
           t += rep1.top.t
       }
       //if (t<0.01 || t > 0.99)
       //    continue
       //r?   r
       //l1Seg l1Tot
       //l1Seg * r / l1Tot = l1Seg/l1tot * (r/1) = rep1R[i1].ratio * pathProgress
       const segs = splitSegment(rep1R[i1].seg, t)
       p1.splice(i1+rep1.left.length, 1, ...segs)
       rep1R[i1].len *= t // update len for next iteration
       rep1R[i1].seg = segs[0]
   }

    const rep1L = rep1.left.map((sa: SegAnalysis)=>({...sa})) // Clone
    const rep2L = rep2.left

    rep1L[rep1L.length-1].len = rep1R[0].len
    rep1L[rep1L.length-1].seg = rep1R[0].seg

    i2 = rep2.left.length - 1;
    i1 = rep1.left.length - 1;


   for (;i2 >= 0; i2--) {
       while (i1 > 0 && rep2L[i2].cumulRatio < rep1L[i1].cumulRatio) {i1--}

       const pathProgress = rep2L[i2].cumulRatio - rep1L[i1].cumulRatio // half path progress of the segment we want to extract
       let t = pathProgress *rep1.lLen/ rep1L[i1].len

       if (i1 === 0)
           t += rep1.bot.t

       //if (t<0.01 || t > 0.99)
       //    continue

       const segs = splitSegment(rep1L[i1].seg, t)

       p1.splice(i1+1, 1, ...segs)
       rep1L[i1].len *= t // update len for next iteration
       rep1L[i1].seg = segs[0]
   }
    let newStartSeg: Segment | undefined = undefined

    const rep1RLast = rep1R[rep1R.length-1]
    rep1RLast.len = rep1L[0].len
    rep1RLast.seg = rep1L[0].seg

    for (i2 = rep2R.length -1; i2 > tipIdx; i2--) {
       const pathProgress = rep2R[i2].cumulRatio - rep1RLast.cumulRatio // half path progress of the segment we want to extract
       let t = pathProgress *rep1.rLen/ rep1RLast.len
       //if (t<0.01 || t > 0.99)
       //    continue
       const segs = splitSegment(rep1RLast.seg, t)
       p1.splice(1, 1, ...segs)
       rep1RLast.seg = segs[0]
       rep1RLast.len *= t
        if (!newStartSeg)
            newStartSeg = segs[1]
    }

    //if (newStartSeg)
    //    changeStartSeg(p1, newStartSeg)

    return serialize(p1)
}





const getProlongatedMedianTop = (medians: any) => {
    const tmp = medians.slice(-2)
    const lastMedian = [[tmp[0][0],tmp[0][1]], [tmp[1][0], tmp[1][1]]]

    if (lastMedian.length != 2)
        throw new Error("Incorrect median")
    lastMedian[0][0] = (lastMedian[1][0] + lastMedian[0][0])/2
    lastMedian[0][1] = (lastMedian[1][1] + lastMedian[0][1])/2
    lastMedian[1][0] = lastMedian[0][0] + (lastMedian[1][0] - lastMedian[0][0])*4 // prolongate the segment, *2 was too short for 就
    lastMedian[1][1] = lastMedian[0][1] + (lastMedian[1][1] - lastMedian[0][1])*4
    return lastMedian
}

const getProlongatedMedianBottom = (medians: any) => {
    const tmp = medians.slice(0, 2)
    const lastMedian = [[tmp[0][0],tmp[0][1]], [tmp[1][0], tmp[1][1]]]

    if (lastMedian.length != 2)
        throw new Error("Incorrect median")
    lastMedian[0][0] = (lastMedian[1][0] + lastMedian[0][0])/2
    lastMedian[0][1] = (lastMedian[1][1] + lastMedian[0][1])/2
    lastMedian[1][0] = lastMedian[0][0] - (lastMedian[1][0] - lastMedian[0][0])*4
    lastMedian[1][1] = lastMedian[0][1] - (lastMedian[1][1] - lastMedian[0][1])*4
    return lastMedian
}


export const rotateStartPathToMedianBottom=(p: string, median: any) => {
    //median tip seg
    const mts = getProlongatedMedianBottom(median)
    const path = normalize(parsePath(p))

    const res: Number[] = []
    for (let i = 0; i <  path.length; i++) {
const {key, data} = path[i]
        if (key == "C") {
           const [xs, ys ] = path[i-1].data.slice(-2)
            cubicBezierLine(xs, ys, ...data, mts[0][0], mts[0][1], mts[1][0], mts[1][1], res)
            if (res.length) {
                const itemsToInsert = path.slice(i, path.length - 1);
                path.splice(i, path.length - i-1)
                path.splice(1, 0, ...itemsToInsert);

                const next = path[path.length-2].data.slice(-2)
                path[0].data = next
                return serialize(path)
            }
        }
    }
    return undefined
}

export const ask=(p:any) =>{
    console.log(parsePath(p))
}


type SegProgress = {
   seg: Segment
   t: number
}

type IntersecRes = {
    p: [number, number]
    t: number
}

type  SegAnalysis = {
    ratio: number
    cumulRatio: number
    len: number
    seg: Segment
}

export type StrokeAnalysis ={
    top: SegProgress
    bot: SegProgress
    left: SegAnalysis[]
    right: SegAnalysis[]
    lLen: number
    rLen: number
}

const changeStartSeg=(path: Segment[], newStart: Segment ) =>{
    const i = path.indexOf(newStart)
    if (i < 0)
        throw new Error('new start not in path')
    const itemsToInsert = path.slice(i, path.length - 1);
    path.splice(i, path.length - i-1)
    path.splice(1, 0, ...itemsToInsert);

    const next = path[path.length-2].data.slice(-2)
    path[0].data = next
    return serialize(path)

}

export const computeRepartition=(p: string, median: any): StrokeAnalysis => {
    const medTop = getProlongatedMedianTop(median).flat()
    const medBot = getProlongatedMedianBottom(median).flat()
    const path = normalize(parsePath(p))
    let topSegProg :SegProgress | undefined = undefined
    let botSegProg :SegProgress | undefined = undefined

    let res: IntersecRes[]
    for (let i = 1; i <  path.length-1; i++) {
        const seg = path[i]
        const {key: segKey, data: segData} = seg
        if (segKey == "C") {
        res = []
            const segStart = path[i-1].data.slice(-2)
            if (!topSegProg) {
                cubicBezierLine(...segStart, ...segData, ...medTop, res)
                if (res.length) {
                    topSegProg = {seg, t : res[0].t}
                    continue
                }
            }
            if (!botSegProg) {
                cubicBezierLine(...segStart, ...segData, ...medBot, res)
                if (res.length) {
                    botSegProg = {seg, t : res[0].t}
                    continue
                }
            }
            if (topSegProg && botSegProg)
                break;
        }
    }
    if (!topSegProg) {
        console.log(p, medTop)
        throw new Error('Error, top not found')

    }
    if (!botSegProg)
        {
        throw new Error('Error, bottom not found')
    }

    changeStartSeg(path, botSegProg.seg)

    const segs : Segment[] = path.slice(1, -2)
    const segsLen : number[]= segs.map(seg => (new Bezier(...seg.data)).length())

    const topIdx:number = segs.indexOf(topSegProg.seg)
    const botIdx:number = segs.indexOf(botSegProg.seg)

    if (topIdx < 0|| botIdx < 0)
        throw new Error('Error') // NOTE This should not happen

    const lSegs:Segment[] = segs.slice(0, topIdx+1)
    const rSegs: Segment[] = segs.slice(topIdx)
    rSegs.push(segs[0])

    const lLens : number[]= segsLen.slice(0, topIdx+1)
    const rLens: number[] = segsLen.slice(topIdx)
    rLens.push(segsLen[0])

    const lLensOrg = [...lLens]
    const rLensOrg = [...rLens]

    lLens[0]*=(1-botSegProg.t)
    lLens[lLens.length-1]*=topSegProg.t

    rLens[0]*=(1-topSegProg.t)
    rLens[rLens.length-1]*=botSegProg.t

    let lRatios : number[]= [...lLens]

    const lLen: number = sum(lLens)
    lRatios = lRatios.map(r => r/lLen)
    const lCumulRatios = cumulativePrevSum(lRatios)

    let rRatios: number[] = [...rLens]

    const rLen:number = sum(rLens)
    rRatios = rRatios.map(r => r/rLen)

    const rCumulRatios = cumulativePrevSum(rRatios)

    const lAnalysis: SegAnalysis[] = lSegs.map((_, i:number): SegAnalysis=> ({
    ratio: lRatios[i],
    cumulRatio: lCumulRatios[i],
    len: lLensOrg[i],
    seg: lSegs[i]
    }))

    const rAnalysis: SegAnalysis[] = rSegs.map((_, i:number): SegAnalysis=> ({
    ratio: rRatios[i],
    cumulRatio: rCumulRatios[i],
    len: rLensOrg[i],
    seg: rSegs[i]
    }))

    const analysis : StrokeAnalysis = {
        top: topSegProg,
        bot: botSegProg,
        left: lAnalysis,
        right: rAnalysis,
        lLen,rLen
    }
    return analysis
}
