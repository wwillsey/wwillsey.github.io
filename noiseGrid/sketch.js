/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let gui;
let E;
let w,h;
let fns;
function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg('out');
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(displayWidth, displayHeight, SVG);
  noLoop();
  E = new p5.Ease();

  gui = new GUI();
  gui.add('rows', 9, 0, 1000, 1).onChange(redraw);
  gui.add('cols', 5, 0, 1000, 1).onChange(redraw);
  gui.add('size', 1000, 0, 10000, .0001).onChange(redraw);
  gui.add('rotateAmt', 0, 0, 100, .0000001).onChange(redraw);
  gui.add('dSub', 0, -1, 1, .0000001).onChange(redraw);
  gui.add('strokeWeight', 1, 0, 10, .01).onChange(redraw);
  gui.add('roundTo', .1, 0, 10, .0001).onChange(redraw);
  gui.add('circleSize', 10, 0, 200, .0001).onChange(redraw);
  gui.add('circleLines', 1, 0, 20, 1).onChange(redraw);
  gui.add('nLines', 0, 0, 100, 1).onChange(redraw);
  gui.add('lineSpread', 0, 0, 5, .00001).onChange(redraw);
  gui.add('noiseScale', 1, 0, 10, .00001).onChange(redraw);
  gui.add('drawBackground', false).onChange(redraw);
  gui.add('modRotate', 2, 1, 100, 1).onChange(redraw);

  const easeFn = gui.addFolder("easeFn")
  E.listAlgos().forEach(a => easeFn.add(a, a == 'linear').onChange(redraw))

  const easePt = gui.addFolder("easePt")
  E.listAlgos().forEach(a => easePt.add(a, a == 'linear').onChange(redraw))

  fns = [swirl, noiseSwirl];
  gui.add('fn', 0, 0, fns.length, 1).onChange(redraw);

  noFill();
}


function draw() {
  clear();
  stroke(0);
  strokeWeight(gui.strokeWeight);

  const fn = fns[gui.fn];
  drawGrid(fn);

  if(gui.drawBackground) {
    drawGrid(noOp);
  }
  // translate(gui.size * .5, gui.size * .5)
  // drawGrid(fn);
  // drawGridRotateElement();
}


let easeCache = {}
function applyEase(folder, val) {
  for(let i = 0; i < Object.keys(folder).length; i++) {
    if(folder[Object.keys(folder)[i]] == true) {
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


function swirl(row, col) {
  const p = getPt(row, col);
  let d = sqrt((p.x - .5)**2 + (p.y - .5)**2);
  d /= (sqrt(2) / 2);
  d -= gui.dSub;
  const rotateAmt = d * applyEase(gui.easeFn, d) * gui.rotateAmt;
  // print(rotateAmt)
  p.sub(.5,.5).rotate(rotateAmt).add(.5,.5);
  // print(p)
  return p
}

function noOp(row, col) {
  const p = getPt(row, col);
  // print(p)
  return p
}

function noiseSwirl(row, col) {
  const p = getPt(row, col);
  let d = sqrt((p.x - .5)**2 + (p.y - .5)**2);
  d /= (sqrt(2) / 2);
  d -= gui.dSub;
  const rotateAmt = d * applyEase(gui.easeFn, d * noise(p.x  * gui.noiseScale, p.y* gui.noiseScale)) * gui.rotateAmt;
  // print(rotateAmt)
  p.sub(.5,.5).rotate(rotateAmt).add(.5,.5);
  // print(p)
  return p
}


function rotateForSwirlWithEase(row, col) {
  const p = getPt(row, col);
  let d = sqrt((p.x - .5)**2 + (p.y - .5)**2)
  d /= (sqrt(2) / 2);
  d -= gui.dSub;
  const rotateAmt = d * applyEase(gui.easeFn, d) * gui.rotateAmt;
  return rotateAmt;
}

function getPt(row, col) {
  return createVector(
    applyEase(gui.easePt, (row / gui.rows)),
    applyEase(gui.easePt, (col / gui.cols)))
}

function drawGrid(fn) {
  const paths = new PathCollection()

  const pts = [];
  for(let row = 0; row <= gui.rows; row++) {
    // beginShape()
    pts.push([])
    for(let col = 0; col <= gui.cols; col++) {


      const p = fn(row, col)
        .mult(gui.size)
        .add(width/2 - gui.size/2, height/2 - gui.size/2);

      if(gui.roundTo > 0) {
        roundPt(p, gui.roundTo);
      }

      pts[row][col] = p;
      // vertex(p.x, p.y);
    }
    paths.addPath(pts[row]);

    // endShape();
  }

  for(let col = 0; col <= gui.cols; col++) {
    // beginShape()
    const path = new Path();
    for(let row = 0; row <= gui.rows; row++) {
      const p = pts[row][col];
      // vertex(p.x, p.y)
      path.add(p)
    }
    paths.addPath(path);
    // endShape()
  }


  lerpPaths(paths, pts);


  paths.render({
    optimize: {},
    simplify: {
      simplifyTolerance: .1
    }
  });
}


function drawGridRotateElement(fn) {
  noFill();
  stroke(0)
  for (let col = 0; col <= gui.cols; col++) {
    for (let row = 0; row <= gui.rows; row++) {
      const rotateAmt = rotateForSwirlWithEase(row, col);

      drawElementWithRotation(row, col, rotateAmt);

    }
  }
}

function drawElementWithRotation(row, col, rotateAmt) {
  const pt = getPt(row, col).mult(gui.size);

  ellipse(pt.x, pt.y, gui.circleSize * 2, gui.circleSize * 2);
  for (let i = 0; i < gui.circleLines; i++) {
    const offset = i / gui.circleLines * PI + rotateAmt;

    const p1 = roundPt(createVector(gui.circleSize, 0).rotate(offset).add(pt), gui.roundTo)
    const p2 = roundPt(createVector(gui.circleSize, 0).rotate(offset + PI).add(pt), gui.roundTo);

    line(p1.x, p1.y, p2.x, p2.y)
  }
}


function lerpPaths(paths, pts) {
  randomSeed(gui.dSub);
  noiseSeed(gui.dSub);
  for(let row = 0; row < gui.rows; row++) {
    for(let col = 0; col < gui.cols; col++) {
      // const rl = random() < .5;
      const rl = (row * gui.rows + gui.cols * col) % gui.modRotate == 0
      let p1,p2,p3,p4;
      if (rl) {
        p1 = pts[row][col].copy()
        p2 = pts[row][col+1].copy()
        p3 = pts[row+1][col].copy()
        p4 = pts[row+1][col+1].copy()
      } else {
        p1 = pts[row][col].copy()
        p3 = pts[row][col+1].copy()
        p2 = pts[row+1][col].copy()
        p4 = pts[row+1][col+1].copy()
      }

      const lines = gui.nLines;
        for (let i = 1; i < lines; i++) {
          // print(gui.lineSpread)
          const v = (i / lines) + (gui.lineSpread > 0 ? randomGaussian(0, gui.lineSpread) : 0);
          // print(v)
          const ptA = p1.copy().mult(v).add(p2.copy().mult(1-v));
          const ptB = p3.copy().mult(v).add(p4.copy().mult(1-v));

          paths.addPath([ptA, ptB]);
        }

    }
  }
}