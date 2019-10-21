/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
const arcs = [];
let E;

function setup() {
  createCanvas(displayWidth, displayHeight);
  E = new p5.Ease();
  print(E.listAlgos());
}


function draw() {
  background(245, 225, 188)
  noFill();
  strokeWeight(4)

  if (mouseIsPressed) {
    arcs.push(makeRandomArc(createVector(mouseX, mouseY)));
  }

  arcs.forEach(arc => arc.render());
}


function makeRandomArc(pos) {
  return new Arc({
    radius: constrain(randomGaussian(80, 20), 10, 1000),
    pos,
    arcFn: E.linear,
    arcLength: max(abs(randomGaussian(PI, .5)), .1),
    followDelay: abs(randomGaussian(.3, .2)),
    arcSpeed: max(randomGaussian(.01, .01), 0.005),
    dir: random([1, -1]),
    float: randomGaussian(0, PI),
  })
}


class Arc {
  constructor(opts) {
    this.opts = opts;

    this.tic = 0;
    this.randomAngle = random(TWO_PI);
  }

  getCurvePts() {
    const leadAngle = this.opts.arcLength * this.opts.arcFn(constrain(this.tic, 0, 1));
    const followAngle = this.opts.arcLength * this.opts.arcFn(constrain(this.tic - this.opts.followDelay, 0, 1));
    if (abs(leadAngle - followAngle) < .001) {
      return [];
    }
    const curvePts = [];
    const pt = createVector(this.opts.radius + this.tic * 80, 0)
      .rotate(this.randomAngle + this.tic * this.opts.float);

    const nSamples = 50;
    for(let i = 0; i <= nSamples; i++) {
      let ang = map(i, 0, nSamples, followAngle, leadAngle);
      curvePts.push(pt.copy().rotate(ang * this.opts.dir).add(this.opts.pos));
    }
    // remove();
    return curvePts;
  }

  render() {
    beginShape();
    this.getCurvePts().forEach(pt => {
      curveVertex(pt.x, pt.y)
    });
    endShape();

    this.tic += this.opts.arcSpeed;
  }
}