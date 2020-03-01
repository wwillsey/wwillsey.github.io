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

  // (function f() {
  //   //hello

  //   const srcCode = '(' + f.toString() + ')();';
  //   print(srcCode)

  //   print(this.setup)
  // })();

  drawThis();
}

function drawThis() {
  text(drawThis.toString(), 10, 10);
}
