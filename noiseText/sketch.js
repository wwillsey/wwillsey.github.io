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

let gui;

function setup() {
  createCanvas(displayWidth, displayHeight, SVG);
}


function draw() {

}



