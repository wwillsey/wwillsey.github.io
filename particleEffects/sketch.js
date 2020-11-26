/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let gui;
let particles = []



function setup() {
  createCanvas(displayWidth, displayHeight, WEBGL);

  // debugMode();
  gui = new GUI();
  gui.add("centerForce", 0, -10, 10);
  gui.add("maxSpeed", 10, 0, 100);
  gui.add("noiseScale", 10, 0, 100);
  gui.add("particleSizes", 150, 0, 1000);
  gui.add("sizeRoundTo", 10, 0, 1000);
  gui.add("maxAge", 100, 0, 10000);
  gui.add("thickness", .1, 0, 1);
  gui.add("spawnSpeed", 10, 0, 1000, 1);
  gui.add("lightZ", 0, -1000, 1000, 1);

  noStroke();
  // noLights()
}

function draw() {
  // orbitControl()

  clear();
  background(138, 43, 108)
  // translate(-width/2, -height/2)
  particles = particles.filter(p => p.alive);
  if(mouseIsPressed) {
    for (let i = 0; i < gui.spawnSpeed; i++) {
      particles.push(Particle.init());
    }
  }
  let locX = mouseX - width / 2;
  let locY = mouseY - height / 2;
  // to set the light position,
  // think of the world's coordinate as:
  // -width/2,-height/2 -------- width/2,-height/2
  //                |            |
  //                |     0,0    |
  //                |            |
  // -width/2,height/2--------width/2,height/2

  pointLight(19, 227, 242, locX, locY, gui.lightZ);
  pointLight(138, 43, 108, locX, locY, gui.lightZ - 1);


  push()
  translate(locX, locY, gui.lightZ)
  sphere(5)
  pop()


  particles.forEach(p => {
    p.update();
    p.render();
  })

}


class Particle {
  constructor(state) {
    this.state = state;
    this.alive = true;
    this.age = 0;
  }

  static init() {
    const state = {
      pos: createVector(mouseX, randomGaussian(0, 100), (height/2 - mouseY) * 2 ),
      vel: createVector(),
      // size: randomGaussian(gui.particleSizes, 10)
    }
    state.pos.x += randomGaussian(0, 50)
    state.pos.z += randomGaussian(0, 50)
    return new Particle(state);
  }

  updatePos() {
    const dx = map(this.state.pos.x, -width, width, -gui.centerForce, gui.centerForce);
    this.state.vel.x -= randomGaussian(dx, dx * .5);
    const dy = map(this.state.pos.y, -height, height, -gui.centerForce, gui.centerForce);
    this.state.vel.y -= randomGaussian(dy, dy * .5);
    const dz = map(this.state.pos.z, -height, height, -gui.centerForce, gui.centerForce);
    this.state.vel.z -= randomGaussian(dz, dz * .5);

    this.state.vel.limit(gui.maxSpeed);
    this.state.pos.sub(this.state.vel);
  }

  updateSize() {
    let n = noise(
      this.state.pos.x * gui.noiseScale * 0.0001,
      this.state.pos.y * gui.noiseScale * 0.0001,
      this.state.vel.mag() * gui.noiseScale * 0.0001
    ) * randomGaussian(gui.particleSizes, gui.particleSizes * .01);
    // print('first', n)
    n = n - (n % gui.sizeRoundTo)
    n = max(n, 1)
    // print(n)
    this.state.size = n;
  }

  updateDeadOrAlive() {
    this.alive = (this.age < gui.maxAge) &&
      (this.state.size >= 5);
  }

  update() {
    // print(this)
    this.age ++;
    this.updatePos();
    this.updateSize();
    this.updateDeadOrAlive();
  }

  render() {
    // print(this.state.size / gui.particleSizes * 255)
    // fill(this.state.size / gui.particleSizes * 255)
    fill(138, 43, 108)
    if (!this.alive) return;
    push()
    rotateX(PI/2);
    translate(this.state.pos.x - width/2, this.state.pos.y - height/2, this.state.pos.z);

    const dX = min(ceil(this.state.size), 50);
    const dY = 1
    cylinder(this.state.size, this.state.size * gui.thickness, dX, dY, false, true)
    pop()
  }
}