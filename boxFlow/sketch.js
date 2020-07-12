/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let gui;

let boxes;

function setup() {
  createCanvas(400, 400, WEBGL);
  gui = new GUI();
  gui.add('x', 0, -1000, 1000);
  gui.add('y', 0, -1000, 1000);
  gui.add('z', 0, -1000, 1000);
  gui.add('dirX', 0, -TWO_PI, TWO_PI);
  gui.add('dirY', 0, -TWO_PI, TWO_PI);
  gui.add('dirZ', 0, -TWO_PI, TWO_PI);
  gui.add('noiseScale', .1, 0, 10);
  gui.add('noiseMult', .1, 0, 10);
  gui.add('noiseOffset', -.5, -1, 1);
  gui.add('speed', 0, -1, 1);
  gui.add("nBoxes", 10, 0, 10000).onFinishChange(start)
  gui.add("size", 1, 0, 1);


  start()
}


function start() {
  boxes = Array.from({length: gui.nBoxes}, () => new FlowBox(
    createVector(0,0,random()),
    createVector(20,20,50),
    createVector(random(), random(), random()),
  ))
}

function draw() {
  background(100);

  boxes.forEach(box => {
    box.update();
    box.render()
  })

  // print(s / sCount)

  // const box = new FlowBox(
  //   createVector(gui.x,gui.y, (frameCount * .01) % 1),
  //   createVector(20,20,50),
  //   createVector(gui.dirX,gui.dirY,gui.dirZ),
  // )
  // box.render();
}


let s = 0;
let sCount = 0;
class FlowBox {
  constructor(pos, shape, dir) {
    this.pos = pos;
    this.dir = dir;
    this.shape = shape;
  }

  setColorProperties() {
    // fill(200);
    normalMaterial()
  }

  render() {
    push()
    rotateX(this.dir.x),
    rotateY(this.dir.y);
    rotateZ(this.dir.z);
    translate(this.pos.x, this.pos.y, map(this.pos.z, 0, 1, -500, 500))

    this.setColorProperties();
    box(this.shape.x * gui.size, this.shape.y* gui.size, this.shape.z* gui.size);
    pop()
  }

  update() {
    const nx = noise(this.dir.x * gui.noiseScale);
    const ny = noise(this.dir.y * gui.noiseScale);
    const nz = noise(this.dir.z * gui.noiseScale);
    s += nx + ny + nz
    sCount += 3

    const n = createVector(nx,ny,nz)
      .add(gui.noiseOffset,gui.noiseOffset,gui.noiseOffset)
      .mult(gui.noiseMult);

    print(n)
    this.dir.add(n);
    this.pos.z = (this.pos.z + gui.speed + 1) % 1;

  }
}