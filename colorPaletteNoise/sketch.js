/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

const noiseScale = .05;

function setup() {
  createCanvas(400, 100);
  noiseDetail(2, 0.2);
}

function draw() {
  const a = createVector(random(), random(), random());
  const b = createVector(random(), random(), random());
  const c = createVector(random(), random(), random());
  const d = createVector(random(), random(), random());

  for(let y = 0; y < height; y++) {
    for(let x = 0; x < width; x++) {

      const t = getT(x, y);
      const col = getColor(t, a, b, c, d);
      const C = color(col.x, col.y, col.z);
      stroke(C);
      point(x,y);
      // print(col, C);
    }
  }
}

function getColor(t, a, b, c, d) {
  return p5.Vector.mult(p5.Vector.add(a, vecMult(b, vecCos(p5.Vector.mult(p5.Vector.add(p5.Vector.mult(c, t), d), TWO_PI)))), 255);
}

function vecMult(a, b) {
  return createVector(a.x * b.x, a.y * b.y, a.z * b.z);
}
function vecCos(vec) {
  return createVector(cos(vec.x), cos(vec.y), cos(vec.z));
}

function getT(x,y) {
  // return pow(noise(x * noiseScale, y * noiseScale, frameCount * .1) , 2)
  return x /
}