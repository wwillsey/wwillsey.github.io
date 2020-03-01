/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let P;

let gui;

let cutPts = [];

function keyPressed() {
  switch (keyCode) {
    case ENTER:
      save();
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(displayWidth/2, displayHeight/2, SVG);
  print(displayWidth)
  print(displayHeight)
  // fill(150);
  // noStroke();
  noStroke();
  background(0, 0);
  // background(0);
  // blendMode(REPLACE);

  stroke(0);
  fill(200);


  // ellipse(100, 100, 100, 100);
  // ellipse(120, 120, 100, 100);
  // ellipse(140, 140, 100, 100);

  circle(createVector(100,100), 75, 100)
  circle(createVector(150,100), 75, 100)
}

function mousePressed() {
  // P.divide(createVector(mouseX, mouseY), random() < .5 ? 'x' : 'y');
  if (mouseX > width || mouseY > height) return;
  cutPts.push(createVector(mouseX, mouseY));
}

function draw() {

}

function circle(pos, rad, n) {
  beginShape();
  const pt = createVector(rad, 0);
  // curveVertex(pos.x + rad, pos.y);
  for(let i = 0; i <= n; i++) {
    vertex(pos.x + pt.x, pos.y + pt.y);
    pt.rotate(1 / n * TWO_PI);
  }
  // curveVertex(pos.x + rad, pos.y);
  endShape();
}