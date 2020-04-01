/* eslint-disable no-use-before-define, class-methods-use-this */

let speed = .0001;
let circles;

let n = 25;
let firstSize = 400;

let E;

let time = 0;

function setup() {
  createCanvas(1200, 900, SVG);

  E = new p5.Ease();

  circles = new CircleStack(n, offsetFn, angleFn);
  blendMode(REPLACE)
}

function keyPressed() {
  if(keyCode === ENTER) {
    save();
  }
}

function draw() {
  handleKeys()
  // background(241, 225, 197);
  background(0,0)
  circles.render();

  time += speed;
}

function handleKeys() {
  if (keyIsDown(LEFT_ARROW)) {
    speed -= .00001;
  }

  if (keyIsDown(RIGHT_ARROW)) {
    speed += .00001;
  }

  if (keyIsDown(UP_ARROW)) {
  }

  if (keyIsDown(DOWN_ARROW)) {
  }

  if (keyIsDown(ENTER)) {
  }
}

function offsetFn(i) {
  return (n - i) * ;
}


function angleFn(i) {
  const angleVal = E.quadraticBezierStaircase(time % 1);

  return 2 * PI * angleVal;
}

function getCol(i) {
  return i % 2 ?
    lerpColor(color(99, 28, 0), color(71, 225, 197), i / n) :
    lerpColor(color(0, 71, 99), color(225, 71, 99), i / n);
}


class CircleStack {
  constructor(n, offsetFn, angleFn) {
    this.n = n;
    this.offsetFn = offsetFn;
    this.angleFn = angleFn;
  }

  renderCircle(center, i) {
    const col = getCol(i);

    // noStroke();
    stroke(0);
    strokeWeight(1)
    fill(col);


    const size = firstSize - firstSize * E.iterativeSquareRoot(i / n);
    ellipse(center.x, center.y, size, size);
  }

  render() {
    let angle = 0;
    let center = createVector(width / 2, height / 2);
    for (let i = 0; i < this.n; i++) {
      angle += this.angleFn(i);
      const toAdd = p5.Vector.fromAngle(angle);
      toAdd.setMag(this.offsetFn(i));

      center.add(toAdd);

      this.renderCircle(center, i);
    }
  }
}
