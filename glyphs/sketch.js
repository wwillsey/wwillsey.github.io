/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let glyphs = [];
let gui;
let song;


const rows = 1;
const cols = 1;
const nPoly = 3;
const glyphSize = 100;

let seed = 1;
let peaks;

let ave;

function mouseClicked() {
  seed++;
}

function keyPressed(){
  switch (key) {
    case ' ':
    toggleMusic(); break;
    case ENTER:
      reset();
  }
}

function toggleMusic() {
  song.isPlaying() ? song.pause() : song.play();
}


function preload() {
  song = loadSound('http://localhost:3000/geneticLanguage/sounds/static_snow.mp3');
}

function setup() {
  createCanvas(displayWidth, displayHeight);

  gui = new GUI();
  glyphs = createGlyphGrid(rows, cols, 10)/// gui.offset);

  ave = new RollingAve(3);
  peaks = song.getPeaks(10000);
  noFill()
  strokeJoin(ROUND);
  // frameRate(10)
  // song.play();
}



function draw() {
  background(20)
  const currentPeak = peaks[int(song.currentTime() / song.duration() * 5000)];


  if (currentPeak - ave.getAve() > .1) {
    circle(width/2, height/2, currentPeak * 300)
  }
  print(currentPeak)

  const pos = createVector(mouseX, mouseY);

  drawFullGlyph(pos, seed)
  ave.add(currentPeak);
}



function drawFullGlyph(pos, seed) {
  const g = createGlyph(pos, 1 * glyphSize , 1.65 * glyphSize, .2 * glyphSize, seed);

  let i = 10;
  while(i) {
    i--;
    g.step();
  }

  g.render();
}



function createGlyphGrid(rows, cols, spacing) {
  const g = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pos = createVector(width / 2, height / 2).add(spacing * (col - floor(cols / 2)), spacing * (row - floor(rows / 2) - 2));
      // g.push(createRegularPolyGonGlyph(pos, 10, nPoly, 3));
      g.push(createGlyph(pos, 1 * glyphSize , 1.65 * glyphSize, .2 * glyphSize))
    }
  }
  return g;
}


function createGlyph(pos, w, h, strokeWeight, seed) {
  const pt = (x, y) => pos.copy().add(x,y);

  const edges = [
    [pt(-w, -h), pt(w, -h)], // ul ur
    [pt(-w, 0), pt(-w, -h)], // ml ul
    [pt(-w, 0), pt(-w, h)],  // ml ll
    [pt(-w, 0), pt(w, 0)],  // ml mr
    [pt(-w, h), pt(w, h)],  // ll lr
    [pt(w, 0), pt(w, -h)], // mr ur
    [pt(w, 0), pt(w, h)],  // mr lr
    [pt(w, -h), pt(-w, h)],
    [pt(-w, -h), pt(w, h)],
  ]

  return new Glyph({
    stepSize: 500,
    edges,
    color: color('gold'),
    strokeWeight,
    randomSeed: seed
  });
}

function createRegularPolyGonGlyph(pos, r, n, strokeWeight) {
  const pt = (ang) => createVector(r, 0).rotate(ang).add(pos);

  const edges = [];

  for(let ang = 0; ang < TWO_PI; ang += TWO_PI / n) {
    edges.push([pt(ang), pt(ang + TWO_PI / n)]);
    edges.push([pt(ang), pos.copy()]);
  }

  return new Glyph({
    stepSize: 3,
    edges,
    color: color('gold'),
    strokeWeight,
  });
}


class Glyph {
  constructor(opts) {
    this.iter = 0;
    this.curves = [];
    this.opts = opts;
  }

  step() {
    this.iter += 1;

    if(this.opts.randomSeed) {
      randomSeed(this.opts.randomSeed);
      randomSeed(int(random(1 + this.iter)) * 10000000000);
    }

    if (this.curves.length) {
      this.curves.forEach(curve => {
        if (curve.alive === false) {
          return;
        }
        const thisPt = curve.pts[curve.pts.length - 1];
        // print(thisPt)
        const d = thisPt.dist(curve.heading);
        if (d < 1) { // heading reached

          const r = random();

          if (r < 1) { // continue from current pt
            const possibleEdges = this.opts.edges.filter(edge => edge.filter(pt => pt.dist(thisPt) < 1).length)
            let selectedEdge = random(possibleEdges);
            if (selectedEdge) {
              curve.heading = selectedEdge.filter(pt => pt.dist(thisPt) > 1)[0];
              this.opts.edges = this.opts.edges.filter(edge => edge !== selectedEdge);
            }
          } else {
            curve.alive = false;
          }
        }

        const nextPt = curve.heading
          .copy()
          .sub(thisPt)
          .setMag(min(this.opts.stepSize, d))
          .add(thisPt)
        curve.pts.push(nextPt);
      });
    } else {
      const edgeIdx = floor(random(this.opts.edges.length));
      const startEdge = this.opts.edges.splice(edgeIdx, 1)[0];
      const i = random([0,1]);
      const startPt = startEdge[i];
      const heading = startEdge[(i + 1) % 2];
      const curve = {
        pts: [startPt],
        heading,
      };

      this.curves.push(curve);
    }
  }

  render() {
    // print(this)
    stroke(this.opts.color);
    strokeWeight(this.opts.strokeWeight);
    beginShape();
    this.curves.forEach(curve => {
      curve.pts.forEach(pt => {
        vertex(pt.x, pt.y);
      });
      // push();
      // fill(255,0,0);
      // circle(curve.pts[curve.pts.length - 1].x, curve.pts[curve.pts.length - 1].y,10);
      // pop();
    });
    endShape();
  }
}


class GUI {
  constructor() {
    this.gui = new dat.GUI();

    this.offset = 50;
    this.gui.add(this, 'offset', 0, 100)
      .onFinishChange(() => {
        glyphs = createGlyphGrid(rows, cols, this.offset)/// gui.offset);
      })
  }
}


class RollingAve {
  constructor(n) {
    this.arr = Array.from({length: n}, () => 0.0);
    this.sum = 0;
    this.idx = 0;
  }

  add(val) {
    const oldVal = this.arr[this.idx];
    this.sum = this.sum - oldVal + val;
    this.arr[this.idx] = val;
    this.idx = (this.idx + 1) % this.arr.length;
  }

  getAve() {
    return this.sum / this.arr.length;
  }
}