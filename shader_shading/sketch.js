/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let mainCanvas;
let colorCanvas;
let shadeCanvas;
let dotShader;
let shaderLayer;
let img;
let video;

let layer = 2;

function preload() {
  dotShader = loadShader('effect.vert', 'effect.frag');
  img = loadImage('http://localhost:3000/curve/face2.jpg');
}

function keyPressed(){
  switch (key) {
    case ' ':
    layer = (layer + 1) % 3; break;
    case ENTER:
      reset();
  }
}


function setup() {
  mainCanvas = createCanvas(displayWidth, displayHeight, WEBGL);
  colorCanvas = createGraphics(width, height);
  shadeCanvas = createGraphics(width, height);
  shaderLayer = createGraphics(width, height, WEBGL);

  video = createVideo('http://localhost:3000/geneticLanguage/videos/archimedes.mp4');
  video.loop();
  video.hide();
  // lights()
}

function draw() {
  // orbitControl();
  // fill(color('magenta'))
  // strokeWeight(.1)
  noStroke()
  renderScene()
  colorCanvas.image(mainCanvas, 0, 0);
  background(0);

  if (layer > 0) {
    renderWithLights();
    shadeCanvas.image(mainCanvas, 0, 0);
    background(100);
  }

  if (layer === 0) {
    translate(-width/2, -height/2);
    image(colorCanvas, 0, 0);
  }
  if (layer === 1) {
    translate(-width/2, -height/2);
    image(shadeCanvas, 0, 0);
  }

  if (layer === 2) {
    shaderLayer.shader(dotShader);
    dotShader.setUniform('colorMap', colorCanvas);
    dotShader.setUniform('shadeMap', shadeCanvas);
    dotShader.setUniform('time', frameCount);
    dotShader.setUniform('screenWidth', width);
    shaderLayer.rect(-width/2, -height/2, width, height);
    // sphere(500)
    // image(thisCanvas, 0, 0);
    // background(0);
    texture(shaderLayer);
    // rect(0, 0, width, height)
    translate(-width/2, -height/2);
    rect(0, 0, width, height)
  }
}

function applyLights() {
  let locX = mouseX - width / 2;
  let locY = mouseY - height / 2;
  ambientLight(50, 50);
  pointLight(250, 250, 250, locX, locY, 150);
}

// function renderScene() {
//   background(0);
//   for(let offset = -1; offset < 2; offset++) {
//     push();
//     rotateX(frameCount / 100)
//     rotateZ(frameCount / 40)
//     const d = offset * 100;
//     translate(d,d,d);
//     fill(color(200, 73, 128));
//     // sphere(60)
//     // texture(img);
//     box(60)
//     pop();
//   }
// }

function renderScene() {
  texture(video)
  rect(-width/2,-height/2,width, height)
}



function renderWithLights() {
  push()
  applyLights();
  renderScene()
  pop();
}