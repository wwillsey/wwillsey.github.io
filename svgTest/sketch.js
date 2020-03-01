/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

function keyPressed() {
  switch (keyCode) {
    case ALT:
      save('out','svg');
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(displayWidth, displayHeight, SVG);
  background(255);
  fill(150);
  stroke(150);
}

function draw() {
  var r = mouseX;
  background(255);
  ellipse(0, 0, r, r);
}