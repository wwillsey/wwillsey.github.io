/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let img, gui, slitShader, canvas, recorder, img2

let time = 0;

function preload() {
  img2 = loadImage("../media/2001_colors.jpeg")
  slitShader = loadShader('effect.vert', 'effect.frag');

}

function keyPressed(){
  print('key pressed', keyCode, key)
  switch (keyCode) {
    case ALT:
      recorder.toggle();
      break;
  }
}


function setup() {
  createCanvas(displayWidth, displayHeight, WEBGL);
  gui = new GUI();

  gui.add('timeSpeed', 5, 0, 1000)
  gui.add('center', .5, 0, 1)
  gui.add('offsetPowX', 2, -10, 10)
  gui.add('offsetPowY', 2, -10, 10)
  gui.add('yOffsetDiv', .5, -1, 1)
  gui.add('rows', 2, 0, 100, 1)
  gui.add('cols', 2, 0, 100,1)
  gui.add('size', 100, 0, 1000)
  gui.add('spotMix', .5, 0, 1)

  gui.add('fuzz', 0, 0, 1)
  recorder = new ScreenRecorder({
    framerate: 60,
  });

  img = createGraphics(displayWidth, displayHeight);

}

function draw() {
  img.background(0);
  img.fill(255);
  img.noStroke()
  for(let row = 0; row <= gui.rows; row++) {
    for(let col = 0; col <= gui.cols; col++) {

      img.circle(col / gui.cols * displayWidth, row / gui.rows * displayHeight, gui.size)
    }
  }
  if (frameCount == 1) {
    // recorder.toggle();
  }
  shader(slitShader);

  slitShader.setUniform("time", (time/ 1000) % 1);
  slitShader.setUniform("img", img);
  slitShader.setUniform("center", gui.center)
  slitShader.setUniform("offsetPowX", gui.offsetPowX + randomGaussian(0, gui.fuzz))
  slitShader.setUniform("offsetPowY", gui.offsetPowY + randomGaussian(0,gui.fuzz))
  slitShader.setUniform("yOffsetDiv", gui.yOffsetDiv)
  slitShader.setUniform("tex", img2)
  slitShader.setUniform("spotMix", gui.spotMix)

  rect(1,1)

  time += gui.timeSpeed
  if ((time/ 1000) >= 1) {
    // recorder.toggle()
    // noLoop();
  }
  recorder.takeFrame()
}
