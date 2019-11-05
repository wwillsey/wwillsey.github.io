/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let opts = {
  mask: {
    w: 10000,
    h: 10000,
    lineSeparation: 11,
    lineWidth: 10,
    moveSpeed: .3,
  }
}

const totalFrames = 50;

let animation;
let mainCanvas;
let img;


function preload() {
  img = loadImage('http://localhost:3000/curve/face2.jpg');
}

function setup() {
  createCanvas(displayWidth, displayHeight);
  noSmooth()
  backgroundCol = color(255);

  opts.w = width;
  opts.h = height;

  gui = new GUI();
  createAndRunAnimation();
}

function draw() {
  animation.drawWithMask(2000, 2000);
  // animation.getAnimationFrame(round(frameCount / 2) % totalFrames, noisy);
}


function applyMask(canvas, center, opts, col) {
  canvas.rectMode(CENTER);
  canvas.fill(col);
  canvas.noStroke();
  for(let x = 0; x < opts.mask.w; x += opts.mask.lineSeparation) {
    canvas.rect(x + center.x - opts.mask.w / 2, center.y, opts.mask.lineWidth, opts.mask.h);
  }
}

class Animation {
  constructor(opts) {
    this.opts = opts;
    this.finalCanvas = createGraphics(opts.w, opts.h);
    this.animationCanvas = createGraphics(opts.w, opts.h);
    this.workCanvas = createGraphics(opts.w, opts.h);
  }

  renderFinal(nFrames, animationFn) {
    let frame = 0;
    while(frame++ < nFrames) {
      animationFn(this.animationCanvas, frame);
      this.workCanvas.image(this.animationCanvas, 0, 0);
      const maskPos = createVector(
        this.workCanvas.width / 2 + frame * this.opts.mask.moveSpeed,
        this.workCanvas.height / 2);
      applyMask(this.workCanvas, maskPos, this.opts, backgroundCol);

      this.finalCanvas.blendMode(DARKEST);
      this.finalCanvas.image(this.workCanvas, 0, 0);
    }
  }

  drawWithMask(w, h) {
    this.workCanvas.background(backgroundCol);
    applyMask(this.workCanvas, createVector(mouseX, mouseY), {
      mask: {
        col: color(0),
        w,
        h,
        lineSeparation: this.opts.mask.lineSeparation,
        lineWidth: this.opts.mask.lineWidth,
      }
    }, color(0));
    image(this.finalCanvas, 0,0);
    blendMode(DARKEST)
    image(this.workCanvas, 0, 0);
    blendMode(BLEND)
  }

  getAnimationFrame(frame, animationFn) {
    animationFn(this.animationCanvas, frame);
    image(this.animationCanvas, 0, 0);
  }
}


function movingCircle(canvas, frame) {
  canvas.background(backgroundCol);
  canvas.fill(0);
  canvas.noStroke();

  canvas.circle(canvas.width/2, canvas.height/2, 10 * frame);
}


function orbits(canvas, frame) {
  canvas.background(255);
  canvas.noStroke();

  const pos = createVector(canvas.width / 4, 0);
  const nCircles = 10;
  pos.rotate(TWO_PI / nCircles * (frame / totalFrames));
  for(let i = 0; i < nCircles; i++) {
    // canvas.fill(200 * frame / totalFrames, 200 * (1 - frame / totalFrames), 0);
    canvas.fill(lerpColor(color('magenta'), color('orange'), frame / totalFrames));

    canvas.circle(pos.x + canvas.width / 2, pos.y + canvas.height / 2, 200 * sin(frame / totalFrames * PI));
    pos.rotate(TWO_PI / nCircles);
  }
}

function imageMove(canvas, frame) {
  canvas.background(255);
  canvas.noStroke();

  canvas.image(img, 500 * sin(frame / totalFrames * PI), 500 * cos(frame / totalFrames * PI) + canvas.height / 2 - img.height / 2);
}

function noisy(canvas, frame) {
  canvas.background(255);
  canvas.noStroke();

  for(let y = 0; y < canvas.height; y += 50) {
    for(let x = 0; x < canvas.width; x += 50) {
      const scale = 0.001;
      const n = noise(x * scale,y * scale, frame * scale * 50);
      canvas.fill(n * 250);
      canvas.square(x,y,50);
    }
  }
}


function createAndRunAnimation() {
  animation = new Animation(opts);
  animation.renderFinal(totalFrames, imageMove);
};


class GUI {
  constructor() {
    this.gui = new dat.GUI({width: 500});

    const maskFolder = this.gui.addFolder('mask');

    Object.keys(opts.mask).forEach(op => {
      // print(op)
      this[op] = opts.mask[op];
      const controller = maskFolder.add(this, op);
      controller.onFinishChange((val) => {
        if(val != opts.mask[op]) {
          opts.mask[op] = val
          createAndRunAnimation()
        }
      });
    });
  }
}