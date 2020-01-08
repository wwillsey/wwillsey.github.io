/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */


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