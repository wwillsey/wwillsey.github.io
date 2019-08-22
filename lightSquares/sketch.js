/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let gui;

function setup() {
  createCanvas(displayWidth, displayHeight, WEBGL);

  gui = new GUI();
}

function draw() {
  // orbitControl();
  rotateY(-.5)
  background(5);
  // lightFalloff(.9, .1, 0)
  lightFalloff(gui.x, gui.y, gui.z);
  // lights(10)
  ambientLight(50)

  const l = new LightBar({
    pos: createVector(0, 0, 75),
    size: createVector(10, 10, 500),
  });

  pushPop(() => {
    l.render();
    // drawGround();
  });
}


function drawGround() {
  // noStroke();
  pushPop(() => {
    // ambientMaterial(239, 198, 129);
    plane(500,500, 100, 100)
  });
}

class LightBar {
  constructor(opts) {
    this.opts = opts;
  }

  applyLights() {
    const col = color(196, 8, 129);
    for(let z = - this.opts.size.z / 2; z <= this.opts.size.z / 2 + 1; z += this.opts.size.z / 50) {
      const pos = this.opts.pos.copy();
      pos.add(this.opts.size.x, 0, z);
      pointLight(col, pos.x, pos.y, pos.z);
      pushPop(() => {
        translate(pos);
        sphere(3)
      })
    }
  }

  render() {
    this.applyLights();
    const n = 50;

    for(let z = - this.opts.size.z / 2; z <= this.opts.size.z / 2 + 1; z += this.opts.size.z / n) {
      pushPop(() => {
        translate(this.opts.pos.x, this.opts.pos.y, this.opts.pos.z + z);
        box(this.opts.size.x, this.opts.size.y, this.opts.size.z / n, 4, 4);
      })
    }
  }
}



function pushPop(fn) {
  push();
  fn();
  pop();
}



class GUI {
  constructor() {
    this.gui = new dat.GUI();

    this.x = .9;
    this.gui.add(this, 'x', 0.0, 1.0);
    this.y = .001;
    this.gui.add(this, 'y',0.0, 1.0);
    this.z = .001;
    this.gui.add(this, 'z', 0.0, 1.0);
  }
}