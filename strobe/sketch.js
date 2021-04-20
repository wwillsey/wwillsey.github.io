/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

const startTime = Date.now()
let gui

const desiredFrameRate = 60;

let looping = true;

function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg('out');
      break;
    case SHIFT:
      if (looping) {
        print('pause')
        noLoop()
      } else {
        print('play')
        loop()
      }
      looping = !looping;
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(displayWidth, displayHeight, WEBGL);
  frameRate(desiredFrameRate)
  gui = new GUI();
  gui.add("colors", "")
  gui.add("n", 20, 0, 200);
  gui.add("freq", 5, 0, 200);
  gui.add("aSize", 100, 0, 1000);
  gui.add("bSize", 25, 0, 1000);
}

function draw() {
  // try {
  //   s = new Strobe(
  //       eval(gui.colors) || [color("magenta"), color("yellow"), color("cyan")],
  //       (i) => (i % gui.freq) / gui.freq
  //     )
  //     s.render()
  // } catch (e) {
  //   print(e)
  // }
  clear()

  const b = new BarStrobe(
    gui.n, width, height, gui.aSize, gui.bSize,
    [color("gold"), color(200, 20, 10), color(200, 30, 50), color("gold")],
    [color("white"), color("silver"), color("silver"), color("white")]
  )
  translate(0, -height/2)
  b.render()
}

class Strobe {
  constructor(colors, fn) {
    this.colors = colors
    this.fn = fn;
  }

  getColor() {
    // const life = Date.now() - startTime
    const life = frameCount;
    const v = this.fn(life)
    return lerpColors(this.colors, v, true)
  }

  render(time) {
    background(this.getColor())
  }
}



class BarStrobe {
  constructor(rows, w, h, aWidth, bWidth, aColors, bColors) {
    this.rows = rows;
    this.aWidth = aWidth;
    this.bWidth = bWidth;
    this.w = w;
    this.h = h;
    this.aColors = aColors;
    this.bColors = bColors;
  }


  makeBar(size, colors) {
    beginShape()
    fill(colors[0])
    vertex(-this.w/2, -size / 2)
    fill(colors[1])
    vertex(this.w/2, -size / 2)
    fill(colors[2])
    vertex(this.w/2, size / 2)
    fill(colors[3])
    vertex(-this.w/2, size / 2)
    endShape()
  }


  render() {
    push()
    noStroke()
    for (let row = 0; row < this.rows; row++) {
      if (row % 2 == 0) {
        this.makeBar(this.aWidth, this.aColors)
      } else {
        this.makeBar(this.bWidth, this.bColors)
      }
      translate(0, (this.aWidth + this.bWidth) / 2)
    }
    pop()
  }
}
