/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let D,F,I;
let img;
let mainCanvas;

const MID = 127;
const forceShaderModifier = .01;

let fieldShader, fieldShader2;
let blur;

// function mouseDragged(event) {
//   print(event);
// }

function preload() {
  img = loadImage('paint2.jpg');
  fieldShader = loadShader('effect.vert', 'effect.frag');
  fieldShader2 = loadShader('effect.vert', 'effect.frag');
}

function setup() {
  mainCanvas = createCanvas(displayWidth, displayHeight);
  img.resize(width, height)
  print(img.width, img.height)
  F = new ForceField(width/3, height/3, () => createVector(0,0), {});
  // F = new ForceField(width/2, height/2, (x,y) =>{
  //   if(dist(x,y,width/4, height/4) < 100) {
  //     return createVector(x-width/4, y-height/4).normalize()
  //   }
  //   return createVector(0,0)
  // }, {});
  // F = new ForceField(width/2, height/2, (x,y) => createVector(tan(TWO_PI * y * .005), tan(TWO_PI*x * .005)).mult(1), {});
  // F = new ForceField(width/3, height/3, (x,y) => createVector(.1,0).rotate((noise(x * .01,y * .01) - .5) * 2 * TWO_PI ), {});
  // img.resize(300,300)
  // print(getValsUsingCircleCursor(createVector(width/2, height/2), 1, width, height))
  D = new DragDistorter(F, {
    cursorRadiusPercent: .05,
    strength: 1,
  })

  I = new ImageFieldWarp(img, D, {});
  // D.updateState(createVector(.5,.5));
  // print(D.getNearbyForces(.1))
}

let mouseWasDown = false;
function draw() {
  if (!img)
  return
  background(0)

  D.updateState(createVector(mouseX / width, mouseY / height));
  if(mouseIsPressed) {
    if(!mouseWasDown) {
      print('clearing state');
      D.clearState();
    }
    D.updateField();
    mouseWasDown = true;
  } else {
    mouseWasDown = false;
  }
  // F.render();

  I.applyShaderWarp();
  // I.applyForceWarp();
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
    this.forceLayer = createGraphics(this.distorter.field.cols, this.distorter.field.rows, WEBGL);
    this.shaderLayer.image(this.img, -this.shaderLayer.width/2, -this.shaderLayer.height/2, this.shaderLayer.width, this.shaderLayer.height);
    this.forceLayer.image(this.distorter.field.field, -this.forceLayer.width/2, -this.forceLayer.height/2, this.forceLayer.width, this.forceLayer.height);

  }

  applyShaderWarp() {
    this.shaderLayer.shader(fieldShader);
    fieldShader.setUniform('img', this.shaderLayer);
    fieldShader.setUniform('imgResolution', [this.shaderLayer.width, this.shaderLayer.height]);
    fieldShader.setUniform('forceDimensions', [this.distorter.field.cols, this.distorter.field.rows]);
    fieldShader.setUniform('forceModifier', forceShaderModifier);
    fieldShader.setUniform('forces',this.distorter.field.field);

    this.shaderLayer.noStroke();
    this.shaderLayer.rect(-this.shaderLayer.width/2, -this.shaderLayer.height/2, this.shaderLayer.width, this.shaderLayer.height);
  }

  applyForceWarp() {


    this.forceLayer.shader(fieldShader2);
    // this.forceLayer.image(this.distorter.field.field, -this.forceLayer.width/2, -this.forceLayer.height/2, this.forceLayer.width, this.forceLayer.height);

    fieldShader2.setUniform('img', this.distorter.field.field);
    fieldShader2.setUniform('imgResolution', [this.forceLayer.width, this.forceLayer.height]);
    fieldShader2.setUniform('forceDimensions', [this.distorter.field.cols, this.distorter.field.rows]);
    fieldShader2.setUniform('forceModifier', forceShaderModifier  * .1);
    fieldShader2.setUniform('forces', this.distorter.field.field);

    this.forceLayer.noStroke();
    this.forceLayer.rect(-this.forceLayer.width/2, -this.forceLayer.height/2, this.forceLayer.width, this.forceLayer.height);

    this.distorter.field.field.image(this.forceLayer, 0, 0, this.distorter.field.cols, this.distorter.field.rows);
    // this.distorter.field.field.background(MID, 5)
    this.distorter.field.field.loadPixels();
    // this.distorter.field.field.updatePixels();

    // image(this.forceLayer, 0,0, width, height)
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

  clearState() {
    // this.pos = createVector(0,0);
    this.vel = createVector(0,0);
    this.acc = createVector(0,0);
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
    // print('pts', pts)
    const maxD = this.opts.cursorRadiusPercent * this.field.cols;
    const center = createVector(floor(mouseX / width * this.field.cols), floor(mouseY / height * this.field.rows));

    pts.forEach(({row, col}) => {
      const d = min(dist(center.x, center.y, col, row), maxD);
      const dM = max(.001, pow(maxD - d, .2));

      if (!dM || isNaN(dM)) {
        return;
      }

      if (this.vel.mag() > 0) {
        const newVal = this.field.get(row, col).add(this.vel.copy().mult(this.opts.strength * dM)).limit(1);
        this.field.set(row, col, newVal);
      }
    });
    this.field.field.updatePixels();
  }

  // updateField() {
  //   this.field.field.applyVel(createVector(mouseX / width, mouseY / height), this.cursorRadiusPercent * width);
  // }
}


function vec2Color(v) {
  const r = map(v.x, -1, 1, 0, 255);
  const g = map(v.y, -1, 1, 0, 255);
  // const r = map(v.x, -1, 1, 0, 255);

  return [r,g];
}

function color2Vec(c) {
  const x = map(c[0], 0, 255, -1, 1);
  const y = map(c[1], 0, 255, -1, 1);
  return createVector(x,y);
}


class ForceField {
  constructor(rows, cols, initState, opts) {
    this.rows = rows;
    this.cols = cols;
    this.opts = opts;

    this.field = createGraphics(cols, rows);
    this.field.pixelDensity(1);
    this.field.background(255/2);
    this.field.loadPixels();

    for(let y = 0; y < rows; y++) {
      for(let x = 0; x < cols; x++) {
        this.set(y,x, initState(x,y))
      }
    }
    this.field.updatePixels();
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
    let off = (row * this.field.width + col)  * 4;
    let components = [
      this.field.pixels[off],
      this.field.pixels[off + 1],
      0
    ];
    const v = color2Vec(components);
    // print('getting', col, row, c, v);
    return v;
  }
  set(row, col, val) {
    if (row >= this.rows || row < 0 || col >= this.cols || col < 0)
      throw new Error('out of bounds');
    // this.field[row][col] = val;
    // print('setting', col, row, vec2Color(val))
    let off = (row * this.field.width + col)  * 4;

    const c = vec2Color(val);
    this.field.pixels[off] = int(c[0]);
    this.field.pixels[off + 1] = int(c[1]);
  }

  render() {
    // this.field.updatePixels();
    image(this.field, 0, 0, width, height)
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