/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let gui;


function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg('out');
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(displayWidth, displayHeight, SVG);
  rectMode(CENTER);
  gui = new GUI();

  gui.add("maxVal", 1, 0, 10).onFinishChange(redraw)
  gui.add("size", 200, 0, 1000).onFinishChange(redraw)
  gui.add("maxDepth", 10, 0, 100, 1).onFinishChange(redraw)
  gui.add("buffer", 0, 0, 100).onFinishChange(redraw)
  gui.add("noiseScale", 1, 0, 10).onFinishChange(redraw)
  gui.add("noiseOffset", 0, -1, 1).onFinishChange(redraw)
  gui.add("noiseMult", 1, -10, 10).onFinishChange(redraw)
  gui.add("nChildren", 2, 1, 20, 1).onFinishChange(redraw)

  noLoop();
}


function draw() {
  clear();
  stroke(0)

  noFill();

  const B = new BoxStack(
    createVector(width/2, height * .75),
    gui.size,
    {start: 0, end: 1},
    gui.nChildren,
    0,
    0
  );
  B.generate();
  B.render();
}


class BoxStack {
  constructor(pos, size, valueRange, nChildren, depth, value) {
    this.pos = pos;
    this.size = size;
    this.valueRange = valueRange;
    this.children = []
    this.nChildren = nChildren
    this.depth = depth;
    this.value = value;
  }

  getValue(val) {
    return (noise(val * gui.noiseScale) + gui.noiseOffset) * gui.noiseMult / (2 ** this.depth)
  }

  generate() {
    if (this.depth >= gui.maxDepth) return

    for(let i = 0; i < this.nChildren; i++) {
      const newRange = {
        start: (this.valueRange.end - this.valueRange.start) * (i/this.nChildren) + this.valueRange.start,
        end: (this.valueRange.end - this.valueRange.start) * ((i+1)/this.nChildren) + this.valueRange.start
      }

      const mid = (newRange.end + newRange.start)/2;
      const value = this.value + this.getValue(mid)

      print({newRange, mid, value})
      if (value < gui.maxVal) {
        const newPosX = map(mid, this.valueRange.start, this.valueRange.end, this.pos.x-this.size/2, this.pos.x + this.size/2);
        const newPosY = this.pos.y - (this.size / 2 + this.size / this.nChildren/2)
        const child = new BoxStack(
          createVector(newPosX, newPosY),
          this.size / this.nChildren - gui.buffer,
          newRange,
          this.nChildren,
          this.depth + 1,
          value
        );
        child.generate();
        this.children.push(child)
      }
    }
  }

  generate2() {
    if (this.depth >= gui.maxDepth) return

    for(let i = 0; i < this.nChildren; i++) {
      const newRange = {
        start: (this.valueRange.end - this.valueRange.start) * (i/this.nChildren) + this.valueRange.start,
        end: (this.valueRange.end - this.valueRange.start) * ((i+1)/this.nChildren) + this.valueRange.start
      }

      const mid = (newRange.end + newRange.start)/2;
      const value = this.value + this.getValue(mid)

      print({newRange, mid, value})
      if (value < gui.maxVal) {
        const newPosX = map(mid, this.valueRange.start, this.valueRange.end, this.pos.x-this.size/2, this.pos.x + this.size/2);
        const newPosY = this.pos.y - (this.size / 2 + this.size / this.nChildren/2)
        const child = new BoxStack(
          createVector(newPosX, newPosY),
          this.size / this.nChildren - gui.buffer,
          newRange,
          this.nChildren,
          this.depth + 1,
          value
        );
        child.generate();
        this.children.push(child)
      }
    }
  }

  render() {
    rect(this.pos.x, this.pos.y, this.size, this.size);

    this.children.forEach(child => child.render());
  }
}