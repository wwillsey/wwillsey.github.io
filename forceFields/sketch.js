/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let F;

function setup() {
  createCanvas(400, 400);
  F = new ForceField(10, 10, () => createVector(random(),0).rotate(random(TWO_PI)), {});
  F.render();
}

function draw() {

}


class ForceField {
  constructor(rows, cols, initState, opts) {
    this.rows = rows;
    this.cols = cols;
    this.opts = opts;

    this.field = Array.from({length: rows}, (v, row) => Array.from({length: cols}, (v2, col) => initState(row, col)));
  }

  renderForce(row, col) {
    const force = this.field[row][col];

    push()
    fill(random(255));
    const pt = createVector(col * width / this.cols, row * height / this.rows);
    const dim = createVector(width / this.cols, height / this.rows);
    rect(pt.x, pt.y, dim.x, dim.y);

    const forceCenter = dim.copy().mult(.5).add(pt);
    const forceEnd = force.copy().mult(dim.mag() / 2).add(forceCenter);

    stroke(255);
    line(forceCenter.x, forceCenter.y, forceEnd.x, forceEnd.y);

    pop();
  }


  render() {
    for(let row = 0; row < this.rows; row ++) {
      for(let col = 0; col < this.cols; col ++) {
        this.renderForce(row, col);
      }
    }
  }
}


let circlePts = []
function getValsUsingCircleCursor(pt, radius, w, h) {
  if (!circlePts.length) {
    const center = createVector(radius, radius);
    for(let row = 0; row < radius * 2 + 1; row ++) {
      for(let col = 0; col < radius * 2 + 1; col++) {
        const vec = createVector(row, col);
        if (center.dist(vec) <= radius + .01) {
          vec.sub(center);
          circlePts.push({x: round(vec.x), y: round(vec.y)});
        }
      }
    }
  }

}