/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let song;
let fft;
let gui;
let noiseCache;

function preload() {
  song = loadSound('http://localhost:3000/geneticLanguage/sounds/static_snow.mp3');
}

function keyPressed(){
  switch (key) {
    case ' ':
    toggleMusic(); break;
    case ENTER:
      reset();
  }
}

function toggleMusic() {
  song.isPlaying() ? song.pause() : song.play();
}

function setup() {
  createCanvas(displayWidth, displayHeight);
  noStroke();
  // frameRate(1)
  background(0)
  fft = new p5.FFT();
  fft.smooth();
  gui = new GUI();
  gui.addColor('color1', [0,0,0]);
  gui.addColor('color2', [255,255,255]);
  noiseCache = new CachedNoise(.01);
}


let depth = 0;
let spectrum = Array.from({length: 16}, () => 0)
function draw() {
  background(...gui.color1);
  spectrum = fft.analyze(64);
  const shadowOffset = createVector((mouseX - width / 2) / 3, (mouseY - height / 2)/3 );
  // fill(random(255))
  const n = 25;
  const startCol = color(...gui.color1);
  const endColor = color(...gui.color2);
  for(let i = 0; i < n; i++) {
    const thisColor = lerpColor(startCol, endColor, i / (n-1));

    fill(thisColor);
    depth = i;
    createContourHole(createVector(width/2, height/2), width, height, 30 + 30 * i);

    if (i < n - 1) {
      depth = i + 1;
      const shadowColor = makeShadowColor(thisColor);
      fill(shadowColor)
      createContourHole(createVector(width/2 + shadowOffset.x, height/2 + shadowOffset.y), width, height, 30 + 30 * (i + 1.2));
    }
  }
}

function makeShadowColor(col) {
  const shadowPercent = .4;
  return color(red(col) * shadowPercent, green(col) * shadowPercent, blue(col) * shadowPercent, 100)
}


function getHoleWidth(ang) {
  const scale = .4;
  const v = createVector(scale,0).rotate(ang).add(10,10);

  const t = frameCount * .005;
  // return noise(v.x + t, v.y + t, depth * .05);
  return noiseCache.getVal(v.x + t, v.y + t, depth * .05);
}

function getContourPts(r) {
  const pts = []
  for(let ang = TWO_PI; ang > 0; ang -= TWO_PI / 50) {
    // const audio = map(spectrum[floor(map(ang, 0, TWO_PI, 0, spectrum.length-1))], 0, 255, .5, 1);
    const rad = getHoleWidth(ang) * r;
    pts.push(createVector(rad,0).rotate(ang));
  }
  return pts;
}

function createContourHole(center, w, h, r) {
  beginShape()
  vertex(center.x - w/2, center.y - h/2);
  vertex(center.x + w/2, center.y - h/2);
  vertex(center.x + w/2, center.y + h/2);
  vertex(center.x - w/2, center.y + h/2);
  beginContour();
  // noFill()
  getContourPts(r).forEach(pt => vertex(pt.x + center.x, pt.y + center.y));
  endContour();
  endShape(CLOSE);
}


// class GUI {
//   constructor() {
//     this.gui = new dat.GUI();

//     this.color1 = [0,0,0]
//     this.gui.addColor(this, 'color1');
//     this.color2 = [255,255,255]
//     this.gui.addColor(this, 'color2');
//   }
// }


class CachedNoise {
  constructor(binSize) {
    this.cache = {};
    this.binSize = binSize;
  }

  getVal(x,y,z) {
    const binIt = (val) => val - val % this.binSize;
    const keyX = binIt(x);
    const keyY = binIt(y);
    const keyZ = binIt(z);

    if (!this.cache[keyX] || !this.cache[keyX][keyY]|| !this.cache[keyX][keyY][keyZ]) {
      const val = noise(x,y,z);

      this.cache[keyX] = this.cache[keyX] ? this.cache[keyX] : {};
      this.cache[keyX][keyY] = this.cache[keyX][keyY] ? this.cache[keyX][keyY] : {};
      this.cache[keyX][keyY][keyZ] = val;
      return val;
    }
    return this.cache[keyX][keyY][keyZ];
  }
}