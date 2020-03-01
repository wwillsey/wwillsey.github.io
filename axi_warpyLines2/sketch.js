/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

const n = 75;
const displaceAmt = 500;
const nY = 20;
const nX = 20;
const spaceY = 500;
let gui;

function setup() {
  createCanvas(1200, 900, SVG);
  noFill();
  // stroke('#ED225D');
  stroke(0);
  strokeWeight(1);

  blendMode(REPLACE);
  gui = new GUI();
  gui.add('ns', .5, 0, 1);
  gui.add('displaceAmt', 500, 0, 2000);
  gui.add('octaves', 4, 1, 10);
  gui.add('falloff', .5, 0, 1);
  gui.add('scale', .001, 0, .01);
  gui.add('nY', 20, 1, 200);
  gui.add('randomAmt', 0, 0, 1);
  gui.add('iris', 0, 0, 200);

  frameRate(10)
}

function keyPressed() {
  switch (keyCode) {
    case ENTER:
      save();
      break;
    default:
      break;
  }
}

function draw() {
  noiseSeed(round(gui.ns * 1000000));
  noiseDetail(gui.octaves, gui.falloff);
  background(0,0);
  // if (frameCount > 0) {
  //   noLoop();
  // }

  ellipse(width/2, height/2, gui.iris * 2, gui.iris * 2)
  ellipse(width/2, height/2, 400,400)
  for(let y = 0; y < spaceY; y += spaceY / gui.nY) {
    // print(`${y}, ${spaceY}, ${y / spaceY}`)
    const p1 = createVector(200, 0).rotate(y/spaceY * TWO_PI + (gui.randomAmt ? randomGaussian(0, gui.randomAmt) : 0)).add(width/2, height/2);
    const p2 = createVector(gui.iris, 0).rotate(y/spaceY * TWO_PI + (gui.randomAmt ? randomGaussian(0, gui.randomAmt) : 0)).add(width/2, height/2);
    const pts = drawLine(
      // createVector(width * .1, height/2 - spaceY/2 + y),
      // createVector(width * .9, height/2 - spaceY/2 + y),
      p1, p2,
      (pt, i) => {
        // noiseSeed(gui.noiseSeed);

        const n = noise(pt.x * gui.scale, pt.y * gui.scale);
        const d = -pow((i*2-1),2) + 1;
        return createVector(0, (.5 - n) * gui.displaceAmt * d);
      }
    );

    // beginShape();
    // curveVertex(pts[0].x, pts[0].y);
    pts.forEach((pt,i) => i > 0 ? line(pts[i-1].x, pts[i-1].y, pt.x, pt.y) : null);
    // curveVertex(pts[pts.length-1].x, pts[pts.length-1].y);
    // endShape();
  }
}

function drawLine(start, end, displace) {
  const step = end.copy().sub(start).mult(1/n);

  const pts = [];
  for(let i = 0; i <= n; i++) {
    const pt = step.copy().mult(i).add(start);
    const dpt = displace(pt, i/n);
    pt.add(dpt)
    // ellipse(pt.x, pt.y, 10,10);
    pts.push(pt);
  }

  return pts;
}