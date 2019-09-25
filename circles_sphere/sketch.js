/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let gui;


function setup() {
  createCanvas(displayWidth, displayHeight, WEBGL);
  // debugMode();
  noStroke();
  gui = new GUI();
  // gui = {
  //   mult: .6,
  //   x:0,
  //   y:98,
  //   z:0,
  // }
  // blendMode(LIGHTEST );
}

function draw() {
  orbitControl();
  // gui.x += 1;
  background(230)
  const iters = 5000;
  let n = 0;
  while (n++ < iters) {
    const pos = posFn(200, n * gui.mult);

    const col = lerpColor(color(127, 167, 250), color(250, 210, 127), n / iters);
    fill(col);
    // fill(color(n / iters * 255));
    drawSphereAt(pos, 6);
  }
}

function posFn(rad, iter) {
  let pos = createVector(0, rad * sin(iter / gui.rad), 0);

  const rotateVal = createVector(
    iter / gui.x,
    sin(iter / gui.y),
    cos(iter / gui.z),
  );

  pos = rotateVecX(pos, rotateVal.x);
  pos = rotateVecY(pos, rotateVal.y);
  pos = rotateVecZ(pos, rotateVal.z);
  return pos;
}

function drawSphereAt(pos, rad) {
  push();

  translate(pos);
  sphere(rad);

  pop();
}


function rotateVecX(vec, th) {
  return createVector(
    vec.x,
    vec.y * cos(th) - vec.z * sin(th),
    vec.y * sin(th) + vec.z * cos(th),
  );
}

function rotateVecY(vec, th) {
  return createVector(
    vec.x * cos(th) + vec.z * sin(th),
    vec.y,
    vec.z * cos(th) - vec.x * sin(th),
  );
}

function rotateVecZ(vec, th) {
  return createVector(
    vec.x * cos(th) - vec.y * sin(th),
    vec.x * sin(th) + vec.y * cos(th),
    vec.z,
  );
}

class GUI {
  constructor() {
    this.gui = new dat.GUI();

    this.mult = 1.0;
    this.gui.add(this, 'mult', 0.0, 10);

    this.x = 100;
    this.gui.add(this, 'x', 0.0, 1000);
    this.y = 1000;
    this.gui.add(this, 'y',0.0, 5000);
    this.z = 1000;
    this.gui.add(this, 'z', 0.0, 5000);
    this.rad = 200;
    this.gui.add(this, 'rad', 0.0, 1000);
  }
}