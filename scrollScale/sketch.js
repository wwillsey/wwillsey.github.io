/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let S, gui;

function setup() {
  createCanvas(1000, 1000);
  gui = new GUI()
  S = new ScrollScale(createVector(0,0));
  gui.add("moveSpeed", 1, -100, 100);
  gui.add('scrollSpeed', .0003, -1, 1);
  gui.add('maxScrollSpeed', .3, -1, 1);
  gui.add('scrollTargetSpeed',1, -100, 100);
}

function draw() {
  background(200)
  // print(frameRate())
  S.render()
  // print({
  //   '0': S.scalePt(createVector(0,0)),
  //   '.5': S.scalePt(createVector(.5,.5)),
  //   '1': S.scalePt(createVector(1,1)),
  //   pos: S.pos,
  // })
}


function mouseWheel(event) {
  // print(event)
  S.handleScrollEvent(event)
  return false;
}

class ScrollScale {
  constructor() {
    this.pos = createVector();
    this.scale = 1;

  }

  handleScrollEvent(event) {
    print(event)
    const delta = createVector(event.deltaX / width, event.deltaY / height).mult(-gui.moveSpeed);


    const s = event.wheelDelta < 0 ? 1 : -1;

    const scaleMove = min(gui.maxScrollSpeed, abs(event.wheelDelta) * gui.scrollSpeed);
    if (!event.ctrlKey) {
      this.pos.add(delta.mult(this.scale));
    } else {
      const mousePos = createVector(event.x / width, event.y / height);
      const scaledMouse = this.scalePt(mousePos);
      const mouseDiff = this.pos.copy().sub(scaledMouse);
      print(mouseDiff.copy().div(this.scale))
      this.pos.add(mouseDiff.mult(gui.scrollSpeed * gui.scrollTargetSpeed * s))
      this.scale *= (1 - s * scaleMove);
    }
    // print({mousePos, delta, pos: this.pos, scale: this.scale})
  }

  render() {
    stroke(0);
    rectMode(CENTER);

    rect(this.pos.x * width, this.pos.y * height, this.scale * width * .1, this.scale * height * .1)
  }

  scalePt(pt) {
    // return pt.copy().mult(this.scale).add(this.pos);
    return pt.copy().sub(.5,.5).mult(this.scale).add(this.pos)
  }
}

