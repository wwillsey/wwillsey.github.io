/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let D,F,I;
let img;

let fieldShader;

function preload() {
  img = loadImage('http://localhost:3000/colorWalk/cloudy.jpeg');
  fieldShader = loadShader('effect.vert', 'effect.frag');
}

function setup() {
  createCanvas(displayWidth, displayHeight);
  // F = new ForceField(30, 30, () => createVector(0,0), {});
  F = new ForceField(30, 30, (x,y) => createVector(noise(x, 0)-.5, noise(y, 1000000)-.5).mult(.1), {});
  // img.resize(300,300)
  // print(getValsUsingCircleCursor(createVector(width/2, height/2), 1, width, height))
  D = new DragDistorter(F, {
    cursorRadiusPercent: .05,
    strength: 2,
  })

  I = new ImageFieldWarp(img, D, {});
  // D.updateState(createVector(.5,.5));
  // print(D.getNearbyForces(.1))
}

function draw() {
  if (!img)
  return
  background(0)
  D.updateState(createVector(mouseX / width, mouseY / height));

  if(mouseIsPressed) {
    D.updateField();
  }
  F.render();

  I.applyShaderWarp();
  I.renderWithShader();
}



class ImageFieldWarp {
  constructor(img, distorter, opts) {
    this.img = img;
    // this.img = img;
    this.distorter = distorter
    this.opts = opts;
    this.img.loadPixels();

    this.shaderLayer = createGraphics(img.width * 1, img.height * 1, WEBGL);
  }

  applyWarp() {
    this.img.loadPixels();
    const newImg = createImage(this.img.width, this.img.height);
    newImg.loadPixels();
    for(let x = 0; x < this.img.width; x++) {
      for(let y = 0; y < this.img.height; y++) {
        // const current = img.get(x,y);  //TODO
        const force = this.distorter.field.getForceAt({x: x / img.width, y: y / img.height}, .01);
        force.setMag(1.5)
        // if (force.mag() > 0)
        // print(x,y, force)
        newImg.set(x,y, this.img.get(round(x - force.x), round(y - force.y)));
      }
    }
    newImg.updatePixels();
    this.img = newImg;
  }

  applyShaderWarp() {
    this.shaderLayer.image(this.img, -this.shaderLayer.width/2, -this.shaderLayer.height/2, this.shaderLayer.width, this.shaderLayer.height);
    this.shaderLayer.shader(fieldShader);
    fieldShader.setUniform('img', this.shaderLayer);
    fieldShader.setUniform('resolution', [this.shaderLayer.width, this.shaderLayer.height]);
    fieldShader.setUniform('forceDimensions', [this.distorter.field.cols, this.distorter.field.rows]);

    const forces = []
    this.distorter.field.field.forEach(row => row.forEach(val => {
      forces.push(val.x);
      forces.push(val.y);
    }));
    print(forces)
    fieldShader.setUniform('forces', forces);

    this.shaderLayer.noStroke();
    this.shaderLayer.rect(-this.shaderLayer.width/2, -this.shaderLayer.height/2, this.shaderLayer.width, this.shaderLayer.height);
  }

  render() {
    image(this.img, 0, 0, width, height)
  }

  renderWithShader() {
    image(this.shaderLayer, 0, 0, width, height);
  }
}

class DragDistorter {
  constructor(field, opts) {
    this.field = field;
    this.opts = opts;

    this.pos = createVector(0,0);
    this.vel = createVector(0,0);
    this.acc = createVector(0,0);
  }

  updateState(newPos) {
    const newVel = newPos.copy().sub(this.pos);
    const newAcc = newVel.copy().sub(this.vel);
    this.pos = newPos;
    this.vel = newVel;
    this.acc = newAcc;
  }

  getCursorPts() {
    const radiusPercent = this.opts.cursorRadiusPercent;
    return getValsUsingCircleCursor({x: this.pos.x * this.field.cols, y: this.pos.y * this.field.rows}, radiusPercent * this.field.cols, this.field.cols, this.field.rows)
      .map(({row, col}) => ({
        row,
        col,
        // force: this.field.get(row, col)
      }));
  }

  updateField() {
    const pts = this.getCursorPts();
    pts.forEach(({row, col}) => {
      this.field.get(row, col).add(this.vel.copy().mult(this.opts.strength)).limit(1);
    });
  }
}


class ForceField {
  constructor(rows, cols, initState, opts) {
    this.rows = rows;
    this.cols = cols;
    this.opts = opts;

    this.field = Array.from({length: rows}, (v, row) => Array.from({length: cols}, (v2, col) => initState(row, col)));
  }


  getForceAt(pos, radiusPercent) {
    const adjustedPos = {x: pos.x * this.cols, y: pos.y * this.rows};
    const pts = getValsUsingCircleCursor(adjustedPos, radiusPercent * this.cols, this.cols, this.rows);

    const force = createVector(0,0);
    pts.forEach(({row, col}) => {
      const f = this.get(row,col);
      force.add(f.copy().mult(1 / (1 + dist(row, col, adjustedPos.x, adjustedPos.y))))
    });
    if(pts.length)
    force.div(pts.length);

    return force;
  }

  get(row, col) {
    if (row >= this.rows || row < 0 || col >= this.cols || col < 0)
      throw new Error('out of bounds');
    return this.field[row][col];
  }
  set(row, col, val) {
    if (row >= this.rows || row < 0 || col >= this.cols || col < 0)
      throw new Error('out of bounds');
    this.field[row][col] = val;
  }

  renderForce(row, col) {
    const force = this.field[row][col];

    // push()
    // fill(200)
    // fill(random(255));
    const pt = createVector(col * width / this.cols, row * height / this.rows);
    const dim = createVector(width / this.cols, height / this.rows);
    // rect(pt.x, pt.y, dim.x, dim.y);

    const forceCenter = dim.copy().mult(.5).add(pt);
    const forceEnd = force.copy().mult(dim.mag() / 2).add(forceCenter);

    // stroke(255);
    line(forceCenter.x, forceCenter.y, forceEnd.x, forceEnd.y);

    // pop();
  }


  render() {
    stroke(255)
    for(let row = 0; row < this.rows; row ++) {
      for(let col = 0; col < this.cols; col ++) {
        this.renderForce(row, col);
      }
    }
  }
}


let circlePts = {}
function getValsUsingCircleCursor(pt, radius, w, h) {
  if (!circlePts[radius]) {
    circlePts[radius] = []
    const center = createVector(radius, radius);
    for(let row = 0; row < radius * 2 + 1; row ++) {
      for(let col = 0; col < radius * 2 + 1; col++) {
        const vec = createVector(row, col);
        if (center.dist(vec) <= radius + .01) {
          vec.sub(center);
          circlePts[radius].push({col: round(vec.x), row: round(vec.y)});
        }
      }
    }
    // print(circlePts);
  }

  const pts = [];
  circlePts[radius].forEach(cPt => {
    const newX = floor(cPt.col + pt.x);
    const newY = floor(cPt.row + pt.y);
    if (constrain(newX, 0, w-1) === newX && constrain(newY, 0, h-1) === newY) {
      pts.push({col: newX, row: newY});
    }
  })
  // print(pts)
  return pts;
}