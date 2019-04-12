/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */


const stepSize = .2;
const K0 = 0.001  * Math.sqrt(stepSize);
let updateSteps = 1;
const curvePts = 10;
const noiseScale = 0.000001;
const noiseAmp = 2;
noiseNu = 0;

const nu = .0001;
const nInit = 5;
const nMax = 10;

const maxSteps = 50000;

let desirePoint;

const curveHistory = {}

let curves;

function setup() {
  createCanvas(displayWidth * 2, displayHeight * 2);
  randomSeed(1);

  start();
}

function start() {
  curves = Array.from({length: nInit},
    () => new CurveWalk({ x: width / 2, y: height / 2 }, stepSize, K0, 2, 50, .0001));
  background(241, 219, 168);

  desirePoint = {
    enabled: false,
    x: width / 2 + random(),
    y: height / 2 + random(),
    strength: .0001,
  };
}


function keyPressed() {
  switch (keyCode) {
    case ENTER:
      saveCanvas(canvas, 'curveWalk', 'jpg');
      break
    case BACKSPACE:
      randomSeed(Date.now())
      seed = random(0, 10000);
    case SHIFT:
      start();
      break;
  }
}


function draw() {
  // print(updateSteps)

  curves.forEach((curve) => {
    if (curve.state.s > maxSteps) {
      return;
    }
    // print(curve.state.theta)
    noFill();
    strokeWeight(.1);
    // point(curve.state.x, curve.state.y);
    beginShape();
    curveVertex(curve.state.x, curve.state.y);
    for (let i = 0; i < curvePts; i++) {
      curveVertex(curve.state.x, curve.state.y);
      curve.update();

      push();
        for(let j = 0; j < updateSteps ; j++) {
          stroke(130, 115, 79, 10);
          // noStroke();
          const rand = randomGaussian(PI / 2, .1);
          const theta = curve.state.theta;
          const d = constrain(randomGaussian(10, 10), -5, 30);
          const x1 = curve.state.x + cos(theta - rand) * d;
          const y1 = curve.state.y + sin(theta - rand) * d;
          // strokeWeight(.1);
          circle(x1,y1, 4);
          // circle(x2,y2, 4);
        }
      pop();
    }
    curveVertex(curve.state.x, curve.state.y);
    curveVertex(curve.state.x, curve.state.y);
    endShape();
  });
}


class CurveWalk {
  constructor(initState, stepSize, K0, binSize, targetDistance, pB) {
    this.K0 = K0;
    this.stepSize = stepSize;
    this.binSize = binSize;
    this.targetDistance = targetDistance;
    this.pB = pB;

    this.state = {
      k: 0,
      theta: 0,
      s: 0,
      ...initState,
    };
  }

  pushState() {
    const x = round(this.state.x / this.binSize);
    const y = round(this.state.y / this.binSize);

    if (!curveHistory[x]) {
      curveHistory[x] = {};
    }
    if (!curveHistory[x][y]) {
      curveHistory[x][y] = {
        ...this.state
      };
    }
  }

  getClosestTargetState() {
    const offset = round(this.targetDistance / this.binSize);
    const xStart = round(this.state.x / this.binSize);
    const yStart = round(this.state.y / this.binSize);


    let xOffset = 0;
    let yOffset = 0;

    for (let x = xStart; x <= xStart + offset && x >= xStart - offset; x += xOffset) {
      xOffset = -1 * (xOffset + 1);
      for (let y = yStart; y <= yStart + offset && y >= yStart - offset; y += yOffset) {
        yOffset = -1 * (yOffset + 1);
        if (curveHistory[x]) {
          const state = curveHistory[x][y];
          if (state) {
            if (this.state.s - state.s > 100 && dist(state.x, state.y, this.state.x, this.state.y) < this.targetDistance) {
              return state;
            }
          }
        }
      }
    }

    return null;
  }

  update() {
    let steps = updateSteps;
    const closestState = this.getClosestTargetState();
    while (steps) {
      this.state.s += 1;
      const turn = this.state.theta - this.state.theta % (PI / 4);
      this.state.x += cos(turn) * this.stepSize;
      this.state.y += sin(turn) * this.stepSize;
      this.state.theta += this.state.k;


      // print(closestState);
      if (closestState)
        this.state.theta = (1-nu) * this.state.theta + nu * closestState.theta;

      if (desirePoint.enabled) {
        const dX = desirePoint.x - this.state.x;
        const dY = desirePoint.y - this.state.y;

        const vec = createVector(dX, dY);
        const strength = desirePoint.strength * (abs(dX) + abs(dY));
        this.state.theta += strength * (vec.heading() - PI)
      }

      const val = 0.5 - this.state.k * 0.5;
      this.state.k += (random() > val ? -1 : 1) * ((1 - noiseNu) * this.K0 + noiseNu * noiseAmp * (noise(this.state.x * noiseScale, this.state.y * noiseScale, 19)));

      // print(this.state.k)
      // curveVertex(this.state.x, this.state.y);
      steps--;
    }
    updateSteps = max(1, round(pow(abs(this.state.k), .5) * 80));

    this.state.theta = ((this.state.theta + PI) % TWO_PI) - PI;

    this.pushState();

    if (curves.length < nMax && random() < this.pB) {
      print('new curve');
      curves.push(new CurveWalk({
        x: this.state.x,
        y: this.state.y,
        k: -this.state.k,
        s: this.state.s,
      }, this.stepSize, this.K0, this.binSize, this.targetDistance));
    }
  }
}
