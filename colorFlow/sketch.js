/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let flowShader;
let img;
let C, peaks, song;

const useCamera = true;

function preload() {
  img = loadImage('../curve/face3.jpg');
  flowShader = loadShader('effect.vert', 'effect.frag');
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
  const out = createGraphics(width, height, WEBGL);
  imageMode(CENTER);

  if(useCamera) {
    img = createCapture(VIDEO);
    img.size(windowWidth, windowHeight);

    // hide the html element that createCapture adds to the screen
    img.hide();
  }

  video = createVideo('../media/IMG_4353.MOV');
  video.loop();
  video.hide();
  // rotate(PI/4)

  peaks = song.getPeaks(1000);

  C = new ColorFlow(video, out, {
    nColorSamples: 10,
    colors: [
      // color('white'),
      // color('black'),
      // color('white'),
      // color('cyan'),
      color('red'),
      color('orange'),
      color('yellow'),
      color('green'),
      color('blue'),
      color('cyan'),
      color('indigo'),
      color('violet')
    ]
  })
}

let soundAcc = 0;
function draw() {
  const currentPeak = peaks[int(song.currentTime() / song.duration() * 1000)];
  soundAcc += currentPeak;
  C.apply({
    offset:  soundAcc * .04,
    // offset: frameCount,
  });
  C.render();
}

function sum(l) {
  let acc = 0;
  l.forEach(v => acc += v)
  return acc;
}


class ColorFlow {
  constructor(src, out, opts) {
    this.opts = opts;
    this.src = src;
    this.out = out;
    this.colors = createGraphics(this.opts.nColorSamples, 1);
    // this.colors.noSmooth();
    // this.colors.pixelDensity(1);
    this.colors.loadPixels();

    for(let i = 0; i < this.opts.nColorSamples; i++) {
      this.colors.set(i,0, lerpColors(this.opts.colors, i / (this.opts.nColorSamples - 1)));
    }
    this.colors.updatePixels();
  }

  apply(state) {
    this.out.shader(flowShader);
    flowShader.setUniform('src', this.src);
    flowShader.setUniform('offset', state.offset);
    flowShader.setUniform('colors', this.colors);

    this.out.noStroke();
    this.out.rect(0, 0, this.out.width, this.out.height);
  }
  render() {
    // rotate(PI/2)
    // translate(width/2, height/2);
    image(this.out,mouseX,mouseY, width, height)
  }
}