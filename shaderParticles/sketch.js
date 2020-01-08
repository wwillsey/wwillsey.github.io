/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let mainCanvas;
let updatePositionsShader, currentPositions, nextPositions, currentVelocities, nextVelocities, workingCanvas, updateVelocitiesShader;
let displayShader;

let gui;


const MAXSPEED = 3;
const N = 500;
const TOP = 254;
const MID = 127;

const w = 1500;
const h = 1500;
const nBalls = 40000;

let paused = false;

p5.disableFriendlyErrors = true

function preload() {
  updatePositionsShader = loadShader('effect.vert', 'updatePositions.frag');
  updateVelocitiesShader = loadShader('effect.vert', 'updateVelocities.frag');
  displayShader = loadShader('effect.vert', 'display.frag');
}


function keyPressed() {
  switch (key) {
    case ' ':
      print('pause')
      // if (paused) noLoop();
      paused = !paused;
      print(paused)
  }
}

function setup() {
  mainCanvas = createCanvas(displayWidth, displayHeight, WEBGL);
  // randomSeed(1)
  gui = new GUI();


  gui.add('friction', 0, 0, 1);
  gui.add('gravity', 0, -1, 1);
  gui.add('mouseDownAmt', 0, -1, 1);
  gui.add('mouseDownSize', 0, 0,1);

  workingCanvas = createGraphics(w, h, WEBGL);
  workingCanvas.pixelDensity(1)
  workingCanvas.noStroke();

  currentPositions = initNewCanvas(w,h);
  nextPositions = initNewCanvas(w,h);
  currentVelocities = initNewCanvas(w,h);
  nextVelocities = initNewCanvas(w,h);


  // initWithParticles(nBalls, currentPositions, currentVelocities);
  // initWithParticles(1, nextPositions, nextVelocities);

  noStroke();
  noSmooth();
  frameRate(48)
  background(0)

  initWithCircle({x: .5, y: .5}, .9, currentPositions, currentVelocities)
  // translate(-width/2, -height/2);
  currentPositions.loadPixels();
  currentPositions.updatePixels();
  currentVelocities.loadPixels();
  currentVelocities.updatePixels();
  // image(currentVelocities, 0, 0,width,height);
}


function initNewCanvas(w, h) {
  const newCanvas = createGraphics(w, h);
  newCanvas.pixelDensity(1)
  newCanvas.background(color(0,0,0,255));
  newCanvas.blendMode(REPLACE);
  newCanvas.loadPixels();
  return newCanvas
}

function draw() {
  if (paused) return;
  // initWithParticles(100, currentPositions, currentVelocities);
  // if(frameCount < 5) return;
  // print(frameRate())
  updatePositions(currentPositions, nextPositions, currentVelocities);
  // display(nextPositions);
  updateVelocities(currentPositions, currentVelocities, nextVelocities);


  swap(currentPositions, nextPositions);
  swap(currentVelocities, nextVelocities);

  // // describeImage(currentPositions)
  display(currentPositions, currentVelocities);
  // noLoop();
  // currentPositions.set()
}

function display(currentPositions, currentVelocities) {
  shader(displayShader);
  displayShader.setUniform('positions', currentPositions);
  displayShader.setUniform('velocities', currentVelocities);
  displayShader.setUniform('lastFrame', mainCanvas);
  rect(0,0, 10,10);
}

function swap(current,next) {
  current.image(next, 0, 0, current.width, current.height)
}

function describeImage(img) {
  image(img, 0, 0, width, height)
  // img.updatePixels();
  const textArr = [];
  for (let y = 0; y < img.height; y++) {
    let line = [];
    for(let x = 0; x < img.width; x++) {
      const col = img.get(x,y);
      line.push(`(${x},${y}):(${[red(col), green(col), blue(col), alpha(col)]})`);
    }
    textArr.push(line);
  }
  print(textArr)
}


function updatePositions(currentPositions, nextPositions, currentVelocities) {
  workingCanvas.shader(updatePositionsShader);

  updatePositionsShader.setUniform('positions', currentPositions);
  updatePositionsShader.setUniform('MAXSPEED', MAXSPEED);
  updatePositionsShader.setUniform('velocities', currentVelocities);
  updatePositionsShader.setUniform('resolution', [currentPositions.width, currentPositions.height]);

  workingCanvas.rect(0,0, 10, 10);
  nextPositions.image(workingCanvas, 0, 0, nextPositions.width, nextPositions.height);
}

function updateVelocities(currentPositions, currentVelocities, nextVelocities) {
  workingCanvas.shader(updateVelocitiesShader);

  updateVelocitiesShader.setUniform('positions', currentPositions);
  updateVelocitiesShader.setUniform('MAXSPEED', MAXSPEED);
  updateVelocitiesShader.setUniform('velocities', currentVelocities);
  updateVelocitiesShader.setUniform('resolution', [currentPositions.width, currentPositions.height]);
  updateVelocitiesShader.setUniform('mousePos', [mouseX / width, mouseY / height]);
  updateVelocitiesShader.setUniform('mouseDown', mouseIsPressed);
  updateVelocitiesShader.setUniform('frictionAmt', gui.friction);
  updateVelocitiesShader.setUniform('gravity', gui.gravity);
  updateVelocitiesShader.setUniform('mouseDownAmt', gui.mouseDownAmt);
  updateVelocitiesShader.setUniform('mouseDownSize', gui.mouseDownSize);


  workingCanvas.rect(0,0, width, height);
  nextVelocities.image(workingCanvas, 0, 0, nextVelocities.width, nextVelocities.height);
}

function initWithCircle(pos, radPercent, currentPositions, currentVelocities) {
  const posColor = pos2color(createVector(.5, .5));
  const velColor = vel2Color(createVector(0, 0));

  print('pos, vel', posColor, velColor)
  // currentPositions.push()
  // currentPositions.blendMode(BLEND)
  // currentPositions.noStroke();
  currentPositions.background(posColor);
  // currentPositions.circle(pos.x * currentPositions.width, pos.y * currentPositions.height, radPercent * currentPositions.width);
  // currentPositions.blendMode(REPLACE)

  // currentPositions.pop()


  // currentVelocities.push()
  // currentVelocities.noStroke();
  // currentVelocities.blendMode(BLEND)
  currentVelocities.background(velColor);
  // currentVelocities.circle(pos.x * currentVelocities.width, pos.y * currentVelocities.height, radPercent * currentVelocities.width);
  // currentVelocities.pop()

}

function initWithParticles(n, currentPositions, currentVelocities) {
  for(let i = 0; i < n; i++) {
    createRandomParticle(currentPositions, currentVelocities);
  }
  currentPositions.updatePixels();
  currentVelocities.updatePixels();
}

function createRandomParticle(currentPositions, currentVelocities) {
  // let pos = createVector(2.95, 2.5);
  let pos = createVector(random(currentPositions.width), random(currentPositions.height));
  let vel = createVector(0,0);

  const loc = createVector(floor(pos.x), floor(pos.y));

  setColorAt(currentPositions, loc, pos2color(pos));
  setColorAt(currentVelocities, loc, vel2Color(vel));
}

function setColorAt(canvas, pos, col) {
  // print('setting ', canvas, pos, [red(col), green(col), blue(col), alpha(col)]);
  canvas.set(pos.x, pos.y, col);
  // canvas.stroke(col);
  // canvas.point(pos.x, pos.y);
}


function posColor2vec(color) {
  return createVector(red(color) / TOP, green(color) / TOP);
}


function pos2color(pos) {
  const px = (pos.x % 1.0) * TOP;
  const py = (pos.y % 1.0) * TOP;

  // print({px, py})
  return color(
    floor(px),
    floor(py),
    255,
    TOP,
  );
}

function vel2Color(vel) {
  vel.limit(MAXSPEED);

  const v = vel.copy().mult(MID/MAXSPEED).add(MID, MID);
  // print('v', v)
  return color(floor(v.x), floor(v.y), 0, TOP);
}

function velColor2vec(color) {
  return createVector((red(color) - MID) / MID * MAXSPEED, (green(color) - MID) / MID * MAXSPEED);
}