/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let shape;
let gui;
let seed;
function setup() {
  createCanvas(400, 400, WEBGL);
  rectMode(CENTER);
  gui = new GUI();
  seed = random();
  normalMaterial();
}

function draw() {
  background(0)
  orbitControl();
  randomSeed(seed);
  shape = new Square(createVector(0,0), randomColor(), width, 0);
  addChildrenDeep(shape, 10);

  shape.render();
}

function randomColor() {
  return color(random(0,255));
}


class Shape {
  constructor(pos, col, size, orientation = 0) {
    this.pos = pos;
    this.col = col;
    this.size = size;
    this.orientation = orientation;
  }

  render(drawShape) {
    fill(this.col);
    noStroke();

    push();
    translate(this.pos.x, this.pos.y, this.pos.z);
    rotateZ(this.orientation);

    drawShape();

    (this.children || []).forEach(shape => shape.render());
    pop();
  }
}

class Square extends Shape {
  render() {
    super.render(() => {
      plane(this.size, this.size);
    });
  }

  addChildren() {
    this.children = [];
    const rad = this.size / 4;

    const fillWithSquares = () => {
      ([
      () => this.children.push(new Square(createVector(-rad, -rad, gui.offset), randomColor(), this.size / 2)),
      () => this.children.push(new Square(createVector(-rad, rad, gui.offset), randomColor(), this.size / 2)),
      () => this.children.push(new Square(createVector(rad, -rad, gui.offset), randomColor(), this.size / 2)),
      () => this.children.push(new Square(createVector(rad, rad, gui.offset), randomColor(), this.size / 2))
      ]).forEach(f => f());
    };

    const fillWithSquare = () => {
      this.children.push(new Square(createVector(0, 0, gui.offset), randomColor(), this.size / 2, 0));
    }

    const fillWithTriangles = () => {
      this.children.push(new Triangle(createVector(0, 0, gui.offset), randomColor(), this.size / 2, random([0, PI/2, PI, 1.5*PI])))
    }

    random([fillWithSquare, fillWithSquares, fillWithTriangles])();
  }
}

class Triangle extends Shape {
  render() {
    super.render(() => {
      const pt = createVector(0, -this.size);
      beginShape();
      vertex(0, -this.size);
      vertex(this.size, this.size);
      vertex(-this.size, this.size, pt.z);
      endShape(CLOSE);
    });
  }

  addChildren() {
    this.children = []

    const fillWithTriangles = () => {
      [
      () => this.children.push(new Triangle(createVector(0, -this.size / 2, gui.offset), randomColor(), this.size / 2, 0)),
      () => this.children.push(new Triangle(createVector(0, this.size / 2, gui.offset), randomColor(), this.size / 2, PI)),
      () => this.children.push(new Triangle(createVector(this.size/2, this.size / 2, gui.offset), randomColor(), this.size / 2, 0)),
      () => this.children.push(new Triangle(createVector(-this.size/2, this.size / 2, gui.offset), randomColor(), this.size / 2, 0)),
      ].splice(random, random(2, 4)).forEach(f => f());
    }

    const fillWithSquare = () => {
      this.children.push(new Square(createVector(0, this.size / 2, gui.offset), randomColor(), this.size, 0));
      this.children.push(new Triangle(createVector(0,-this.size / 2, gui.offset), randomColor(), this.size / 2, 0))

    }

    random([fillWithTriangles, fillWithSquare])();
  }
}

function addChildrenDeep(shape, n) {
  if (n > 0) {
    shape.addChildren();
    shape.children.forEach(s => addChildrenDeep(s, n-1))
  }
}

class GUI {
  constructor() {
    this.gui = new dat.GUI();

    this.offset = 0;
    this.gui.add(this, 'offset', 0, 25);
  }
}