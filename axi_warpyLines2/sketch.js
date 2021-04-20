/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let n;
let gui, E;

let colorMap;
let svgOn = true

let centerOffset;

let rawPts;

function setup() {
  createCanvas(displayWidth, displayHeight, svgOn? SVG : undefined);
  noFill();
  // stroke('#ED225D');
  // stroke(0, 50);
  strokeWeight(1);
  E = new p5.Ease();

  blendMode(REPLACE);
  gui = new GUI();

  gui.add("width", 900, 0, 5000).onFinishChange(redraw)
  gui.add("height", 400, 0, 5000).onFinishChange(redraw)
  gui.add('nY', 200, 1, 5000).onFinishChange(redraw)
  gui.add('nX', 300, 0, 10000, 1).onFinishChange(redraw)
  gui.add('seed', 0, 0, 1).onFinishChange(redraw)
  gui.add('displaceAmt', 500, 0, 2000).onFinishChange(redraw)
  gui.add('octaves', 4, 1, 10).onFinishChange(redraw)
  gui.add('falloff', .5, 0, 1).onFinishChange(redraw)
  gui.add('xScale', 3, 0, 100).onFinishChange(redraw)
  gui.add('yScale', 3, 0, 100).onFinishChange(redraw)
  gui.add('roundTo', .01, 0, 200).onFinishChange(redraw)
  gui.add('randomSpread', 0, 0, 200).onFinishChange(redraw)
  gui.add('fn', "-pow((i*2-1),2) + 1").onFinishChange(redraw)
  gui.add('simplify', .05, 0, 1).onFinishChange(redraw)
  gui.add('nColors', 1,0, 100, 1).onFinishChange(redraw)
  gui.add('colorFuzz', 0.1, 0, 5).onFinishChange(redraw)
  gui.add('minLineSize', 10, 0, 100).onFinishChange(redraw)
  gui.add('ySensitivity', 0, -50, 50).onFinishChange(redraw)
  gui.add('optimize', false).onFinishChange(redraw)
  gui.add('stopPass', false).onFinishChange(redraw)
  gui.add('save as SVG', () => {saveSvg("out")})
  gui.add('save as JSON', () => {saveJSON(getJson(), "json_out.json")})
  gui.add('oneLine', false).onFinishChange(redraw)

  E = new p5.Ease();
  const easeFn = gui.addFolder("easeFn")
  E.listAlgos().forEach(a => easeFn.add(a, a == 'linear').onFinishChange(redraw))

  const colorEaseFn = gui.addFolder("colorEaseFn")
  E.listAlgos().forEach(a => colorEaseFn.add(a, a == 'linear').onFinishChange(redraw))
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

function getJson() {
  return rawPts
}

function draw() {

  centerOffset = createVector(
    (width - gui.width) / 2,
    (height - gui.height) / 2);
  let spaceY = gui.height;
  let spaceX = gui.width;
  noiseSeed(round(gui.seed * 1000000));
  randomSeed(round(gui.seed * 1000000))
  colorMap = Array.from({length: gui.nColors}, () => color(random(255), random(255), random(255)))

  noiseDetail(gui.octaves, gui.falloff);
  // background(255);
  clear()
  noLoop();
  // if (frameCount > 0) {
  //   noLoop();
  // }

  let lines = []
  let yc = -1;
  const colors = {}
  for(let y = 0; y < spaceY; y += spaceY / gui.nY) {
    yc += 1;
    lines.push([])
    let y2 = (y + (gui.randomSpread > 0 ? randomGaussian(0, gui.randomSpread) : 0));
    y2 = min(max(y2, 0), spaceY)
    let pts = drawLine(
      createVector(0, y),
      createVector(spaceX,  y2),
      (pt, i) => {

        const n = noise(pt.x * gui.xScale / 1000, pt.y * gui.yScale / 1000);
        const d = eval(gui.fn);
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
      if (gui.stopPass == true && turnOff && off) {
        pt.off = true
      }
      if (gui.stopPass == true && !turnOff && off) {
        pts[i-1].off = false
      }
      off = turnOff

      pt.y = gui.stopPass ? max(ptAbove.y, pt.y) : pt.y;

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


  rawPts = [];
  Object.entries(colors).forEach(([cv, c]) => {
    if (svgOn) canvas.ctx.save()

    let allPts = []
    let forward = true;
    const pc = new PathCollection();
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
          finalPts[finalPts.length - 1].push(createVector(pt.x, pt.y).add(centerOffset))
          finalPts.push([])
          off = true;
          return;
        }
        if (pt.off && pts[i+1] && !pts[i+1].off) {
          off = false;
          // beginShape();
          finalPts.push([])
        }
        if (!pt.off && off) {
          off = false
          // beginShape();
          finalPts.push([])
        }
        if (off) return
        finalPts[finalPts.length - 1].push(createVector(pt.x, pt.y).add(centerOffset))
      });
      // curveVertex(pts[pts.length-1].x, pts[pts.length-1].y);
      // endShape();


      finalPts.forEach(pts => {
        if (pts.length == 0) return;
        if (pts[0].dist(pts[pts.length-1]) < gui.minLineSize) return

        if (gui.oneLine) {
          allPts.push(...(forward ? pts : reverse(pts)))
        } else {
          pc.addPath(pts);
        }
        rawPts.push(pts.map(pt => ({
          x: (pt.x - centerOffset.x) / gui.width,
          y: (pt.y - centerOffset.y) / gui.height
        })))
      })
      forward = !forward;
    })
    if (gui.oneLine) {
      pc.addPath(allPts)
    }
    pc.render({
      optimize: gui.optimize,
      simplify: {
        simplifyTolerance: false,
        roundTo: false
      }
    });

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