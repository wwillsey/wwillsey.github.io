/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let gui;

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

  gui = new GUI();

  gui.add("rows", 5, 0, 100).onChange(redraw);
  gui.add("cols", 5, 0, 100).onChange(redraw);
  gui.add("xOffset", 0, 0, width).onChange(redraw);
  gui.add("yOffset", 0, 0, height).onChange(redraw);
  gui.add("xSpread", 10, 0, 200).onChange(redraw);
  gui.add("ySpread", 10, 0, 200).onChange(redraw);
  gui.add("badValX1", 0, -10, 10).onChange(redraw);
  gui.add("badValX2", 0, -10, 10).onChange(redraw);
  gui.add("badValY1", 0, -10, 10).onChange(redraw);
  gui.add("badValY2", 0, -10, 10).onChange(redraw);
  gui.add("badX", 0, 0, 100).onChange(redraw);
  gui.add("badY", 0, 0, 100).onChange(redraw);
  gui.add("yFill", .75, 0, 1).onChange(redraw);
  gui.add("angOffset", 0, 0, 360).onChange(redraw);
  gui.add("nSides", 0, 0, 10).onChange(redraw);
}


function draw() {
  background(255);
  const badOne = {
    x: round(gui.badX),
    y: round(gui.badY),
  }
  for (let y = 0; y < gui.rows; y ++ ) {
    for (let x = 0; x < gui.cols; x ++ ) {
      if (y == badOne.y && x == badOne.x) {
        drawBadOne(x,y);
      } else {
        drawNormal(x,y);
      }
    }
  }
  noLoop();
}

function drawNormal(x,y) {
  const pos = createVector(
    x * gui.xSpread + gui.xOffset,
    y * gui.ySpread + gui.yOffset
  )
  // line(pos.x, pos.y, pos.x, pos.y + gui.ySpread * gui.yFill);
  drawPoly(pos, gui.angOffset / 360 * TWO_PI);
}

function drawBadOne(x,y) {
  const pos = createVector(
    x * gui.xSpread + gui.xOffset + gui.badValX1,
    y * gui.ySpread + gui.yOffset + gui.badValY1
  )

  // line(pos.x + gui.badValX1, pos.y + gui.badValY1, pos.x + gui.badValX2, pos.y + gui.ySpread * gui.yFill + gui.badValY2);

  drawPoly(pos, gui.angOffset / 360 * TWO_PI + PI);
}

function drawPoly(pos, ang) {
  beginShape()
  for(let i = 0; i < gui.nSides; i++) {
    const p = createVector(gui.ySpread * gui.yFill, 0).rotate(i / gui.nSides * TWO_PI + ang).add(pos);

    vertex(p.x, p.y);
  }
  endShape(CLOSE);
}