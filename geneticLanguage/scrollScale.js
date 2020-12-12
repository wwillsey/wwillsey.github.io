class ScrollScale {
  constructor() {
    this.pos = createVector();
    this.scale = 1;

  }

  handleScrollEvent(event) {
    const delta = createVector(event.deltaX / width, event.deltaY / height).mult(-gui.moveSpeed);

    const s = event.wheelDelta < 0 ? -1 : 1;

    const scaleMove = min(gui.maxScrollSpeed, abs(event.wheelDelta) * gui.scrollSpeed);
    if (!event.ctrlKey) {
      this.pos.sub(delta.mult(this.scale));
    } else {
      const mousePos = createVector((event.x / width) % (1.0 / cols), (event.y / height) % (1 / rows));
      const scaledMouse = this.scalePt(mousePos);
      const mouseDiff = this.pos.copy().sub(scaledMouse);
      this.pos.add(mouseDiff.mult(gui.scrollSpeed * 10 * s))
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