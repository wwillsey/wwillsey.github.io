/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let canvas, gui;
function setup() {
  createCanvas(400, 400);
  canvas = createGraphics(width, height);

  gui = new GUI();
  gui.add('blurAmt', 5, 1, 51);
  gui.add('blurTransparency', .5, 0, 1);
  frameRate(1)
}

function draw() {
  canvas.background(0);
  canvas.fill('pink');
  canvas.rect(width/2, height/2, 20, 100);
  applyNeonGlow(canvas, gui.blurTransparency);
  image(canvas, 0 ,0);
}


function applyNeonGlow(canvas, amt) {
  const w =  canvas.width
  const h = canvas.height;
  const g = createGraphics(w,h);
  canvas.push()
  g.image(canvas, 0, 0);
  canvas.filter(BLUR, round(gui.blurAmt));
  canvas.tint(255, amt * 255);
  canvas.image(g, 0, 0);
  canvas.pop()
}

