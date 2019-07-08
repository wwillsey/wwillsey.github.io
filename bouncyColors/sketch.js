/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let physics;
let balls;

let mouseRepel;
let mouseRepelAttractions = []

const useBackgroundImage = false;
const useMusic = true;
let backgroundImage;
let music;

const ballRadius = 30;
let rows = 25;
let cols = 50;

let amplitude, fft;

const springStrength = 60000000;
let getSpringStrength = (s) => randomGaussian(s, s * .05);

function preload() {
  backgroundImage = useBackgroundImage ? loadImage('http://localhost:3000/curve/starry.jpg') : null
  music = useMusic ? loadSound('http://localhost:3000/geneticLanguage/sounds/static_snow.mp3') : null;
}

let blend = 0;

function keyPressed() {
  switch(keyCode) {
    // case ENTER:
    //   blend++; blendMode(blend); break;
  }
  switch (key) {
    case ' ':
      if (useMusic) music.isPlaying() ? music.pause() : music.play(); break;
  }
}


function setup() {
  createCanvas(displayWidth, displayHeight);
  cols = width / ballRadius;
  rows = height / ballRadius;

  blendMode(ADD);
  physics = new Physics(0, .05);
  balls = Array.from({length: rows * cols}, (v, i) => {
    const pos = {
      x: (i % cols) * width / cols,
      y: floor(i / cols) * height / rows
    };
    return new Bouncy(
    pos,
    {
      mass: 1,
      attractionK: 2,
      color: useBackgroundImage ? backgroundImage.get(map(pos.x, 0, width, 0, backgroundImage.width), map(pos.y, 0, height, 0, backgroundImage.height)) : color('white'),
      radius: ballRadius,
    }
  )})

  mouseRepel = physics.makeParticle(1, mouseX || 0, mouseY || 0)
  mouseRepel.makeFixed();
  mouseRepel.dead = true;

  balls.forEach(_ball => {
    _ball.balls.forEach(ball => {
      let attraction = physics.makeAttraction(mouseRepel, ball, getSpringStrength(), 50);
      attraction.on = false;
      mouseRepelAttractions.push(attraction);
    })
  });
  noLoop();
  physics.onUpdate(redraw);
  physics.toggle();

  fft = new p5.FFT();
  fft.smooth();
  amplitude = new p5.Amplitude();
  amplitude.toggleNormalize();
  amplitude.smooth(.1)
}

function draw() {
  // background(255)
  clear();
  background(0 )
  handleMouse();
  // print(frameRate());
  balls.forEach(ball => {
    // print(ball)
    ball.render()
  });
}

class Bouncy {
  constructor(pos, opts) {
    this.pos = pos;
    this.opts = opts;
    this.balls = Array.from({length: 3}, () => physics.makeParticle(1, pos.x, pos.y));

    const root = physics.makeParticle(1, pos.x, pos.y);
    root.makeFixed();

    this.balls.forEach(ball => physics.makeSpring(ball, root, opts.attractionK, .01, 0));
  }

  render() {
    noStroke();
    let n = 3;
    fill(red(this.opts.color), 0, 0, 255/n);
    square(this.balls[0].position.x, this.balls[0].position.y, this.opts.radius);
    fill(0, green(this.opts.color), 0, 255/n);
    square(this.balls[1].position.x, this.balls[1].position.y, this.opts.radius);
    fill(0, 0, blue(this.opts.color), 255/n);
    square(this.balls[2].position.x, this.balls[2].position.y, this.opts.radius);
  }
}

function handleMouse() {
  if (mouseIsPressed) {
    mouseRepel.position.x = mouseX;
    mouseRepel.position.y = mouseY;
    mouseRepel.dead = false;

    // if (mouseRepel.dead) {
    let spectrum = fft.analyze();
    let nyquist = 22050;
    spectralCentroid = fft.getCentroid();
    let mean_freq_index =  pow(amplitude.getLevel(),2) / log(spectralCentroid/(nyquist/spectrum.length))

      mouseRepelAttractions.forEach(a => {
        a.on = true;
        a.constant = getSpringStrength(-abs(springStrength * mean_freq_index));
        a.distanceMin = mean_freq_index * 100;
      });
    // }
  } else if (!mouseRepel.dead) {
    mouseRepel.dead = true;
    mouseRepelAttractions.forEach(a => {
      a.on = false;
    });
  }
}
