/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let gui, D, E, paths;

function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg('out');
      break;
    default:
      break;
  }
}

function mouseClicked() {
  start()
}

function setup() {
  createCanvas(displayWidth, displayHeight);
  gui = new GUI();
  E = new p5.Ease();

  gui.add('n', 10, 0, 1000,1).onFinishChange(start);

  gui.add('p', .01, -10, 10).onFinishChange(start);
  gui.add('i', 0, -1, 1).onFinishChange(start);
  gui.add('d', .1, -10, 10).onFinishChange(start);
  gui.add('friction', .01, 0, 10).onFinishChange(start);
  gui.add('maxAccel', 1, 0, 10).onFinishChange(start);
  gui.add('maxVel', 1, 0, 10).onFinishChange(start);
  gui.add("pathPts", 50, 1, 1000, 1).onFinishChange(start);
  gui.add("noiseScale", 10, 0, 100).onFinishChange(start);
  gui.add("noiseStartScale", .5, 0, 100).onFinishChange(start);
  gui.add("noiseStartX", 0, -1000, 1000).onFinishChange(start);
  gui.add("noiseOffset", 0, -1, 1).onFinishChange(start);
  gui.add("noiseMult", 10, -1000, 1000).onFinishChange(start);
  gui.add("spacing", 100, -1000, 1000).onFinishChange(start);
  gui.add("maxAge", 100, 0, 1000).onFinishChange(start);
  gui.add("renderBalls", true).onFinishChange(start);
  gui.add("renderTrace", true).onFinishChange(start);
  gui.add("renderPaths", true).onFinishChange(start);
  gui.add("modSize", 50, 0, 1000).onFinishChange(start);
  gui.add("modChance", .01, 0, 1).onFinishChange(start);

  start()
}


function start() {
  clear()
  // D = Array.from({length: gui.n}, () => {
  //   return new Drifter(createVector(width/2 + random() - .5, height/2 + random() - .5), () => {
  //     return createVector(mouseX, mouseY)
  //   }, abs(randomGaussian(gui.p, .01)), 0, abs(randomGaussian(gui.d, .01)))
  // })

  paths = [];

  D = Array.from({length: gui.n}, (v,i) => {

    // const pt = createVector((1 - i / gui.n) * gui.spacing, 0 );
    const pt = createVector(0, (1 - i / gui.n) * gui.spacing);

    // pt.y = pt.y - pt.y % random(1, gui.modSize);

    // const d = new DesirePath(getDesirePath(pt, pt.copy().add(width * .75, 0)), E.linear);
    const d = new DesirePath(getDesirePath2(pt.add(width/2, height/2), i / gui.n * gui.spacing), E.linear);

    paths.push(d);

    return new Drifter(d.getPt(0), (age) => {
      return d.getPt(age / gui.maxAge);
    }, abs(randomGaussian(gui.p, .00001)), gui.i, abs(randomGaussian(gui.d, .00001)));
  })

  if (gui.renderPaths) {
    paths.forEach(p => p.render())
  }
  fill(0);
}


function draw() {
  // background(255)
  D.forEach(p => {
    p.update()
    p.render();
  })


}


function getDesirePath(start, end) {
  const pts = [];
  let offset = 0;

  for (let i = 0; i < gui.pathPts; i++) {
    if (random() < gui.modChance) {
      offset += randomGaussian(0, gui.modSize)
    }
    const v = i / gui.pathPts;
    const n = (noise((start.x + gui.noiseStartX) * gui.noiseStartScale, (offset + start.y) * gui.noiseStartScale, v * gui.noiseScale) + gui.noiseOffset) * gui.noiseMult;
    const pt = end.copy()
        .sub(start)
        .mult(v)
        .add(start)
        .add(0, n + offset);
    pts.push(pt)
  }
  return pts;
}

function getDesirePath2(center, radius) {
  const pts = [];
  const pt = createVector(1,0);
  for (let i = 0; i <= gui.pathPts; i++) {
    // const v = i / gui.pathPts;
    pt.rotate(1 / gui.pathPts * TWO_PI);

    const n = (noise((pt.x + gui.noiseStartX) * gui.noiseStartScale, pt.y * gui.noiseStartScale) + gui.noiseOffset) * gui.noiseMult;

    const resPt = pt.copy().mult(n * radius).add(center);
    pts.push(resPt)
  }
  return pts;
}



class Drifter {
  constructor(pos, desireFn, p, i, d) {
    this.pos = pos;
    this.vel = createVector();
    this.accel = createVector()
    this.error = createVector();
    this.errorAccum = createVector();
    this.desireFn = desireFn
    this.p = p;
    this.i = i;
    this.d = d;
    this.age = 0;
    this.path = [];
  }

  getError() {
    const desirePt = this.desireFn(this.age);
    return desirePt.copy().sub(this.pos);
  }

  update() {
    const error = this.getError().limit(300)
    this.errorAccum.add(error);

    const pCorrect = error.copy().mult(this.p).limit(15);
    const iCorrect = this.errorAccum.copy().mult(this.i).limit(15);
    const dCorrect = error.copy().sub(this.error).mult(this.d).limit(15);
    this.error = error;

    const correct = createVector().add(pCorrect).add(iCorrect).add(dCorrect);





    this.accel.add(correct).limit(gui.maxAccel)
    this.vel.add(this.accel).limit(gui.maxVel)
    // this.vel.add(correct)

    const frictionF = gui.friction * (this.vel.x ** 2 + this.vel.y ** 2);
    const frictionForce = this.vel.copy().normalize().mult(-frictionF);
    this.accel.add(frictionForce);

    this.pos.add(this.vel);


    this.age++;
  }

  render() {
    if (this.age < gui.maxAge) {
      this.path.push(this.pos.copy());

      if (gui.renderBalls) {
        fill(0)
        ellipse(this.pos.x, this.pos.y, 5,5);
      }

      if (gui.renderTrace) {
        // noFill();
        // beginShape()
        // this.path.forEach(pt => vertex(pt.x, pt.y))
        // endShape();
        if (this.path.length > 1) {
          const p2 = this.path[this.path.length-1];
          const p1 = this.path[this.path.length-2];
          line(p1.x, p1.y, p2.x, p2.y);
        }
      }
    }
  }
}

class DesirePath {
  constructor(pts, fn) {
    this.pts = pts;
    this.fn = fn;
  }

  getPt(i) {
    i = max(0, min(i, 0.99999))
    const idx = floor(i * (this.pts.length - 1))
    const p1 = this.pts[idx];
    const p2 = this.pts[idx + 1];

    const rem = i * (this.pts.length - 1) - idx;
    const amt = this.fn(rem);
    return createVector(
      (p2.x-p1.x) * amt + p1.x,
      (p2.y-p1.y) * amt + p1.y,
    );
  }

  render() {
    stroke(0);
    strokeWeight(1)
    noFill();
    beginShape()
    const n = this.pts.length * 10
    for (let i = 0; i <= n; i++) {
      const p = this.getPt(i / n);
      vertex(p.x, p.y);
    }
    endShape();
  }
}