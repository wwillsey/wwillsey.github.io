/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let img, drawShader,shaderLayer, rectPos, rectDim, rects;

const N = 500;

function preload() {
  img = loadImage('http://localhost:3000/curve/face2.jpg');
  drawShader = loadShader('effect.vert', 'effect.frag');
}

function setup() {
  createCanvas(displayWidth/2, displayHeight/2);

  shaderLayer = createGraphics(width, height, WEBGL);

  rectPos = createGraphics(N, 1);
  rectDim = createGraphics(N, 1);

  // rectPos.noStroke();
  // rectDim.noStroke();

  rectPos.noSmooth();
  rectDim.noSmooth();

  rectPos.pixelDensity(1);
  rectDim.pixelDensity(1);


  rects = makeRects();

  stroke(0);
  point(width/2, height/2)
}

function draw() {
  background(255, 10)
  updateRects(rects);
  drawRects(rects);

  shaderLayer.shader(drawShader);

  drawShader.setUniform('rectPos', rectPos);
  drawShader.setUniform('rectDim', rectDim);
  drawShader.setUniform('resolution', [width, height]);
  drawShader.setUniform('tex', img)

  shaderLayer.rect(0,0,width, height);

  image(shaderLayer, 0, 0, width, height)

  // drawRectsNormally(rects)
}




function drawRects(rects) {
  rects.forEach((r, i) => {
    const c1 = color(r.pos.x * 255, r.pos.y * 255, 0);
    const c2 = color(r.dim.x * 255, r.dim.y * 255, 0);

    rectPos.set(i, 0, c1);
    rectDim.set(i, 0, c2);

    // rectDim.stroke(c2);
    // rectDim.point(i, 0);
  });
  rectPos.updatePixels();
  rectDim.updatePixels();
}

function drawRectsNormally(rects) {
  background(255)
  // translate(-width/2, -height/2)
  rects.forEach((r, i) => {
    const c1 = color(r.pos.x * 255, r.pos.y * 255, 0);
    const c2 = color(r.dim.x * 255, r.dim.y * 255, 0);

    fill(c1);
    rect(r.pos.x * width, r.pos.y * height, r.dim.x * width, r.dim.y * height);
    print(r)

    // rectDim.stroke(c2);
    // rectDim.point(i, 0);
  });
}



function makeRects() {
  rectPos.loadPixels();
  rectDim.loadPixels();

  return Array.from({length: N}, () => ({
    pos: createVector(random(), random()),
    dim: createVector(1, 1).mult(.01),
    vel: createVector(.01, 0).rotate(random(TWO_PI)),
  }))
}

function updateRects(rects) {
  rects.forEach(r => {
    const newPos = r.pos.copy().add(r.vel);

    if (newPos.x + r.dim.x < 0) {
      newPos.x += 1 + r.dim.x;
    } else if (newPos.x - r.dim.x > 1.0) {
      newPos.x -= 1 + r.dim.x;
    }

    if (newPos.y + r.dim.y < 0) {
      newPos.y += 1 + r.dim.y;
    } else if (newPos.y - r.dim.y > 1.0) {
      newPos.y -= 1 + r.dim.y;
    }
    r.pos = newPos;
  })
}