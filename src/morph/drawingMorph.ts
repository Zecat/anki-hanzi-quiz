import { computeRepartition2, makeUniform } from "../uniformPath";

import { Segment } from "path-data-parser/lib/parser";

import { Bezier } from 'bezier-js'
import { absolutize, parsePath } from "path-data-parser";

import simplifySvgPath from '@luncheon/simplify-svg-path'

type Point = { x: number, y: number };
type Cubic = [number, number, number, number, number, number, number, number]
type Cubic6 = [number, number, number, number, number, number]

  const convertArrayToSVGPath = (p: Cubic): string  => {
    return `M ${p[0]} ${p[1]} C ${p[2]} ${p[3]}, ${p[4]} ${p[5]}, ${p[6]} ${p[7]} `
  }

  const convertArrayToSVGPathPartial = (p: Cubic6): string => {
    return `C ${p[0]} ${p[1]} ${p[2]} ${p[3]}, ${p[4]} ${p[5]} `
  }

  const convertBezierArrayToSVGPath = (bezierArray: any[]): string => {
    let svgPath = '';

    bezierArray.forEach(bezier => {
      const p = bezier.points
      svgPath += `C ${p[1].x},${p[1].y} ${p[2].x},${p[2].y} ${p[3].x}, ${p[3].y} `;
    });

    return svgPath;
  }

  const createHalfCircleBezier = (start: Point, end: Point): [Point, Point] => {

    // Calculate the vector from start to end
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Calculate the length of the vector
    const length = Math.sqrt(dx * dx + dy * dy);

    // Calculate the radius of the semicircle
    const radius = length / 2;

    // Calculate the angle of the vector
    const angle = Math.atan2(dy, dx);

    // Calculate the control points using the radius and perpendicular vectors
    const control1X = start.x + radius * Math.sin(angle);
    const control1Y = start.y - radius * Math.cos(angle);
    const control2X = end.x + radius * Math.sin(angle);
    const control2Y = end.y - radius * Math.cos(angle);

    const control1: Point = { x: control1X, y: control1Y };
    const control2: Point = { x: control2X, y: control2Y };

    return [control1, control2];
  }


  const invertBezierArr = (bezArr: any) => {
    const rArr = [...bezArr].reverse()
    return rArr.map(b => {
      const p = [...b.points].reverse()
      return new Bezier(p)
    })
  }

  const segmentsToValues=(segs: Segment[]): Cubic[] => {
    if (segs[0].key != 'M')
      throw new Error('err')
    const values: Cubic[] = []
    for (let i = 1; i < segs.length; i++) {
      const a = segs[i - 1].data.slice(-2) as [number, number]
      if (a.length != 2)
        throw new Error('err')
      const b = segs[i].data as [number, number, number, number, number, number]
      if (b.length != 6)
        throw new Error('err')
      const data: Cubic = [...a, ...b]
      if (data.length != 8)
        throw new Error('err')
      values.push(data as Cubic)
    }
    return values
  }
//function pointsToSvgPath(points: Point[]): string {
//    if (points.length === 0) {
//        return "";
//    }
//
//    // Initialize the path with the 'Move to' command for the first point
//    let svgPath = `M ${points[0].x} ${points[0].y}`;
//
//    // Append 'Line to' commands for each subsequent point
//    for (let i = 1; i < points.length; i++) {
//        svgPath += ` L ${points[i].x} ${points[i].y}`;
//    }
//
//    return svgPath;
//}

const distanceSquared = (p1: Point, p2: Point) => {
  return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y-p2.y, 2)
  }

/* User is slower to draw the stroke on the edge, which results in perturbation in the line going the wrong direction. For simplicity, any line drawn on the first/last N points with a distance smaller than a threshold is considered perturbation and will be truncated. TODO If it appears that too much points are removed, we can add an angle shift condition*/
const removeCapPerturbation =(points: Point[]) :Point[]=>{
  const isPerturbationDistanceThreshold = 16
  const len = points.length
  const perturbIdxCheckCount = 4
  const perturbBottomIdxCheckCount = Math.min(perturbIdxCheckCount, len)
  const perturbTopIdxCheckCount = Math.max(len - 1 - perturbIdxCheckCount,0)
  let newFirstIdx = 0
  let newLastIdx = len - 1

  for (let i = 1; i < perturbBottomIdxCheckCount; i++) {
    const p1 = points[i-1]
    const p2 = points[i]
    console.log(p1,p2, i, distanceSquared(p1,p2))
    if (distanceSquared(p1,p2) < isPerturbationDistanceThreshold) {
      newFirstIdx = i
    }
  }

  // TODO test, I haven't precisely checked the behavior
  for (let i = len - 2; i > perturbTopIdxCheckCount; i--) {
    const p1 = points[i+1]
    const p2 = points[i]
    console.log(p1,p2, i, distanceSquared(p1,p2))
    if (distanceSquared(p1,p2) < isPerturbationDistanceThreshold) {
      newLastIdx = i
    }
  }

  points = points.slice(newFirstIdx, newLastIdx + 1)
  return points
}

 export const getDrawnPointsMorph = (points: Point[], fStrokes: any, fRep: any) => {
    points = removeCapPerturbation(points)
    const bStr = simplifySvgPath(points, {
      closed: false,
      tolerance: 50,
      precision: 2,
    })
    const paths = absolutize(parsePath(bStr))

    const d0 = paths[0].data
    const d1 = paths[1].data

    // Prevent the control point from being exactly on the point as this causes problem with Bezier offset function
    if (d0[0] === d1[0] && d0[1] === d1[1]) {
      d1[0] = (d1[0] + d1[2]) / 2
      d1[1] = (d1[1] + d1[3]) / 2
    }

    const dl = paths[paths.length - 1].data
    const dbl = paths[paths.length - 1].data.slice(-2) // The [x,y] component of the previous segment tip position - either M or C -
    if (dl[4] === dl[2] && dl[5] === dl[3]) {
      dl[2] = (dl[4] + dbl[0]) / 2
      dl[3] = (dl[5] + dbl[1]) / 2
    }

    const segs = segmentsToValues(paths)

    const bezs = segs.map(seg => new Bezier(...seg))
    const left: Bezier[] = bezs.map(b => b.offset(-30) as Bezier[]).flat()
    const right: Bezier[] = bezs.map(b => b.offset(30) as Bezier[]).flat()

    let lLast = left[left.length - 1].points[3]
    let lFirst = left[0].points[0]
    let rLast = right[right.length - 1].points[3]
    let rFirst = right[0].points[0]

     console.log(lLast, rLast, rFirst, lFirst)

    const d = createHalfCircleBezier(lLast, rLast)
    const e = createHalfCircleBezier(rFirst, lFirst)
    const topCap: Cubic6 = [d[0].x, d[0].y, d[1].x, d[1].y, rLast.x, rLast.y]
    const botCap: Cubic = [rFirst.x, rFirst.y, e[0].x, e[0].y, e[1].x, e[1].y, lFirst.x, lFirst.y]

    const rInvert = invertBezierArr(right)

    const topCapPath = convertArrayToSVGPathPartial(topCap)
    const botCapPath = convertArrayToSVGPath(botCap)

    const path = botCapPath + convertBezierArrayToSVGPath(left) + topCapPath + convertBezierArrayToSVGPath(rInvert) + ' Z'
    const iStrokes = path // TODO cleanup
     console.log(path)
    const iRep = computeRepartition2(iStrokes, left.length, 0.5, 1 + left.length, 0.5)

    const morph = makeUniform(
      iStrokes, iRep,
      fStrokes, fRep,
    )
    return morph
  }
