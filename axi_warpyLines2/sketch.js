/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let n;
const displaceAmt = 500;
const nY = 20;
const nX = 20;
let spaceY, spaceX
let gui, E;

let colorMap;
let svgOn = true


function setup() {
  createCanvas(displayWidth, displayHeight, svgOn? SVG : undefined);
  noFill();
  // stroke('#ED225D');
  // stroke(0, 50);
  strokeWeight(1);
  E = new p5.Ease();

  blendMode(REPLACE);
  gui = new GUI();
  gui.add("w", 350 * 3, 0, 5000).onChange(redraw)
  gui.add("h", 237*3, 0, 5000).onChange(redraw)
  gui.add('seed', .5, 0, 1).onChange(redraw)
  gui.add('displaceAmt', 500, 0, 2000).onChange(redraw)
  gui.add('octaves', 4, 1, 10).onChange(redraw)
  gui.add('falloff', .5, 0, 1).onChange(redraw)
  gui.add('scale', .005, 0, .01).onChange(redraw)
  gui.add('yScale', .005, 0, .01).onChange(redraw)
  gui.add('nY', 250, 1, 5000).onChange(redraw)
  gui.add('nX', 200, 0, 1000, 1).onChange(redraw)
  gui.add('randomAmt', 0, 0, 1).onChange(redraw)
  gui.add('iris', 0, 0, 200).onChange(redraw)
  gui.add('roundTo', .01, 0, 200).onChange(redraw)
  gui.add('randomSpread', .1, 0, 200).onChange(redraw)
  gui.add('modAmt', 1, -10, 10).onChange(redraw)
  gui.add('fn', "-pow((i*2-1),2) + 1").onFinishChange(redraw)
  gui.add('simplify', .1,0, 1).onChange(redraw)
  gui.add('nColors', 2,0, 100, 1).onChange(redraw)
  gui.add('colorFuzz', 0.1, 0, 5).onChange(redraw)
  gui.add('minLineSize', 10, 0, 100).onChange(redraw)
  gui.add('ySensitivity', 0, -50, 50).onChange(redraw)
  gui.add('optimize', false).onChange(redraw)



  E = new p5.Ease();
  const easeFn = gui.addFolder("easeFn")
  E.listAlgos().forEach(a => easeFn.add(a, a == 'linear').onChange(redraw))

  const colorEaseFn = gui.addFolder("colorEaseFn")
  E.listAlgos().forEach(a => colorEaseFn.add(a, a == 'linear').onChange(redraw))

  frameRate(10)
}

function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg("out");
      break;
    default:
      break;
  }
}

function draw() {
  colorMap = Array.from({length: gui.nColors}, () => color(random(255), random(255), random(255)))

  spaceY = gui.h;
  spaceX = gui.w;
  noiseSeed(round(gui.seed * 1000000));
  randomSeed(round(gui.seed * 1000000))
  noiseDetail(gui.octaves, gui.falloff);
  // background(255);
  clear()
  noLoop();
  // if (frameCount > 0) {
  //   noLoop();
  // }

  // ellipse(width/2, height/2, gui.iris * 2, gui.iris * 2)
  // ellipse(width/2, height/2, 400,400)
  let lines = []
  let yc = -1;
  const colors = {}
  for(let y = 0; y < spaceY; y += spaceY / gui.nY) {
    yc += 1;
    lines.push([])
    // print(`${y}, ${spaceY}, ${y / spaceY}`)
    // const p1 = createVector(200, 0).rotate(y/spaceY * TWO_PI + (gui.randomAmt ? randomGaussian(0, gui.randomAmt) : 0)).add(width/2, height/2);
    // const p2 = createVector(gui.iris, 0).rotate(y/spaceY * TWO_PI + (gui.randomAmt ? randomGaussian(0, gui.randomAmt) : 0)).add(width/2, height/2);
    let y2 = (y + randomGaussian(0, gui.randomSpread));
    y2 = y2 - y2%(spaceY / gui.nY * gui.modAmt);
    y2 = min(max(y2, 0), spaceY)
    let pts = drawLine(
      createVector(0, y),
      createVector(spaceX,  y2),
      // p1, p2,
      (pt, i) => {
        // noiseSeed(gui.noiseSeed);

        const n = noise(pt.x * gui.scale, pt.y * gui.yScale);
        // const d = -pow((i*2-1),2) + 1;
        const d = eval(gui.fn);
        // print(d)
        return createVector(0, (.5 - n) * gui.displaceAmt * d);
      }
    );

    // canvas.ctx.save()
    // canvas.ctx.__closestGroupOrSvg().appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"))
    // curveVertex(pts[0].x, pts[0].y);

    let off = false

    pts = pts.map((pt, i) => {
      let ptAbove =  yc > 0 ? lines[yc-1][i] : pt;
      let turnOff = ptAbove.y - pt.y > gui.ySensitivity;
      if (turnOff && off) {
        pt.off = true
      }
      if (!turnOff && off) {
        pts[i-1].off = false
      }
      off = turnOff

      pt.y = max(ptAbove.y, pt.y)
      const p = roundPt(pt, gui.roundTo)
      lines[yc].push(p)
      return p
    })

    const v = max(min(yc / gui.nY + randomGaussian(0, gui.colorFuzz), .999), 0);
    const colorVal = floor(applyEase(gui.colorEaseFn, v) * gui.nColors);
    if (!colors[colorVal]) {
      colors[colorVal] = []
    }
    colors[colorVal].push({
      pts,
      colorVal, yc
    })
  }


  Object.entries(colors).forEach(([cv, c]) => {
    if (svgOn) canvas.ctx.save()

    c.forEach(({pts, colorVal, yc}) => {

      stroke(colorMap[colorVal]);

      let off = false
      // pts = pts.map((pt, i) => {
      //   let ptAbove =  yc > 0 ? lines[yc-1][i] : pt;
      //   let turnOff = ptAbove.y - pt.y > 0;
      //   if (turnOff && off) {
      //     pt.off = true
      //   }
      //   if (!turnOff && off) {
      //     pts[i-1].off = false
      //   }
      //   off = turnOff

      //   pt.y = max(ptAbove.y, pt.y)
      //   const p = roundPt(pt, gui.roundTo)
      //   lines[yc].push(p)
      //   return p
      // })

      off = false
      // beginShape();
      const finalPts = [[]]
      simplify(pts, gui.simplify).forEach((pt,i) => {
        if (pt.off && !off) {
          // vertex(pt.x + 100, pt.y + 100)
          finalPts[finalPts.length - 1].push(createVector(pt.x + 100, pt.y + 100))
          finalPts.push([])
          off = true;
          return;
        }
        if (pt.off && pts[i+1] && !pts[i+1].off) {
          off = false;
          beginShape();
          finalPts.push([])
        }
        if (!pt.off && off) {
          off = false
          beginShape();
          finalPts.push([])
        }
        if (off) return
        // vertex(pt.x + 100, pt.y + 100)
        finalPts[finalPts.length - 1].push(createVector(pt.x + 100, pt.y + 100))
      });
      // curveVertex(pts[pts.length-1].x, pts[pts.length-1].y);
      // endShape();

      const pc = new PathCollection();
      finalPts.forEach(pts => {
        if (pts.length == 0) return;
        if (pts[0].dist(pts[pts.length-1]) < gui.minLineSize) return
        // beginShape()
        // pts.forEach(pt => vertex(pt.x, pt.y))
        // endShape()
        pc.addPath(pts);
      })
      pc.render({
        optimize: gui.optimize,
        simplify: {
          simplifyTolerance: false,
          roundTo: false
        }
      });
    })

    if(svgOn)
      canvas.ctx.restore()

  })
  // print(colors)
}

function drawLine(start, end, displace) {
  const step = end.copy().sub(start).mult(1/gui.nX);

  let pts = [];
  for(let i = 0; i <= gui.nX; i++) {
    const pt = step.copy().mult(i).add(start);
    const e = applyEase(gui.easeFn, i / gui.nX)
    // print(e, start, end)
    pt.y = map(e, 0, 1, start.y, end.y);
    const dpt = displace(pt, i/gui.nX);
    pt.add(dpt)
    // ellipse(pt.x, pt.y, 10,10);
    pts.push(pt);
  }

  return pts;
}


let easeCache = {}

function applyEase(folder, val) {
  return val;

  for(let i = 0; i < Object.keys(folder).length; i++) {
    if(folder[Object.keys(folder)[i]] == true) {
      // return E[Object.keys(folder)[i]](val);
      if (!easeCache[Object.keys(folder)[i]]) {
        easeCache[Object.keys(folder)[i]] = {}
      }
      const test = easeCache[Object.keys(folder)[i]][val]
      if (test != undefined) {
        return test
      }

      const v = E[Object.keys(folder)[i]](val);
      easeCache[Object.keys(folder)[i]][val] = v;
      return v;
    }
  }
}

function handleKeys() {
  if (keyIsDown(LEFT_ARROW)) {
    xoffset -= gui.xSpeed * scale;
  }

  if (keyIsDown(RIGHT_ARROW)) {
    yoffset += gui.xSpeed * scale;
  }

  if (keyIsDown(UP_ARROW)) {
  }

  if (keyIsDown(DOWN_ARROW)) {
  }

  if (keyIsDown(ENTER)) {
  }
}