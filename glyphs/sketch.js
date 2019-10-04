/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let glyphs = [];
let gui;

const rows = 50;
const cols = 15;
const nPoly = 4;


function setup() {
  createCanvas(600, 1000);

  gui = new GUI();
  glyphs = createGlyphGrid(rows, cols, 10)/// gui.offset);

  noFill()
  strokeJoin(ROUND);
  // frameRate(10)
}

function draw() {
  background(20)


  glyphs.forEach(glyph => {
    glyph.step();
    glyph.render();
  })
}


function createGlyphGrid(rows, cols, spacing) {
  const g = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const pos = createVector(width / 2, height / 2).add(spacing * (col - floor(cols / 2)), spacing * (row - floor(rows / 2) - 2));
      g.push(createRegularPolyGonGlyph(pos, 10, nPoly, 3));
    }
  }
  return g;
}


function createGlyph(pos, w, h, strokeWeight) {
  const pt = (x, y) => pos.copy().add(x,y);

  const edges = [
    [pt(-w, -h), pt(w, -h)], // ul ur
    [pt(-w, 0), pt(-w, -h)], // ml ul
    [pt(-w, 0), pt(-w, h)],  // ml ll
    [pt(-w, 0), pt(w, 0)],  // ml mr
    [pt(-w, h), pt(w, h)],  // ll lr
    [pt(w, 0), pt(w, -h)], // mr ur
    [pt(w, 0), pt(w, h)],  // mr lr
  ]

  return new Glyph({
    stepSize: 5,
    edges,
    color: color('gold'),
    strokeWeight,
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

    if (this.curves.length) {
      this.curves.forEach(curve => {
        if (curve.alive === false) {
          return;
        }
        const thisPt = curve.pts[curve.pts.length - 1];
        print(thisPt)
        const d = thisPt.dist(curve.heading);
        if (d < 1) { // heading reached

          const r = random();

          if (r < .9) { // continue from current pt
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
      const edgeIdx = random(floor(this.opts.edges.length));
      const startEdge = shuffle(this.opts.edges.splice(edgeIdx, 1)[0]);
      const startPt = startEdge[0];
      const heading = startEdge[1];
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

    this.offset = 0;
    this.gui.add(this, 'offset', 0, 100)
      .onFinishChange(() => {
        glyphs = createGlyphGrid(rows, cols, this.offset)/// gui.offset);
      })

  }
}