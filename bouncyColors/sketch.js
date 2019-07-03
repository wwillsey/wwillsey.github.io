/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let physics;
let balls;

let mouseRepel;
let mouseRepelAttractions = []

const useBackgroundImage = false;
let backgroundImage;

let rows = 25;
let cols = 25;

function preload() {
  backgroundImage = useBackgroundImage ? loadImage('http://localhost:3000/curve/starry.jpg') : null
}

function setup() {
  createCanvas(displayWidth, displayHeight);

  blendMode(ADD);
  physics = new Physics(0, .01);
  balls = Array.from({length: rows * cols}, (v, i) => {
    const pos = {
      x: (i % cols) * width / cols,
      y: floor(i / cols) * height / rows
    };
    return new Bouncy(
    pos,
    {
      mass: 1,
      attractionK: .01,
      color: useBackgroundImage ? backgroundImage.get(map(pos.x, 0, width, 0, backgroundImage.width), map(pos.y, 0, height, 0, backgroundImage.height)) : color('white'),
      radius: 30
    }
  )})

  mouseRepel = physics.makeParticle(1, mouseX || 0, mouseY || 0)
  mouseRepel.makeFixed();
  mouseRepel.dead = true;

  balls.forEach(_ball => {
    _ball.balls.forEach(ball => {
      let attraction = physics.makeAttraction(mouseRepel, ball, randomGaussian(-1000, 200), 50);
      attraction.on = false;
      mouseRepelAttractions.push(attraction);
    })
  });
  noLoop();
  physics.onUpdate(redraw);
  physics.toggle();
}

function draw() {
  // background(255)
  clear();
  background(0,0)
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
    fill(red(this.opts.color), 0, 0, 255);
    circle(this.balls[0].position.x, this.balls[0].position.y, this.opts.radius);
    fill(0, green(this.opts.color), 0, 255);
    circle(this.balls[1].position.x, this.balls[1].position.y, this.opts.radius);
    fill(0, 0, blue(this.opts.color), 255);
    circle(this.balls[2].position.x, this.balls[2].position.y, this.opts.radius);
  }
}

function handleMouse() {
  if (mouseIsPressed) {
    mouseRepel.position.x = mouseX;
    mouseRepel.position.y = mouseY;
    if (mouseRepel.dead) {
      mouseRepel.dead = false;
      mouseRepelAttractions.forEach(a => {
        a.on = true
      });
    }
  } else if (!mouseRepel.dead) {
    mouseRepel.dead = true;
    mouseRepelAttractions.forEach(a => {
      a.on = false;
    });
  }
}
