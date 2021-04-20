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
  gui = new GUI();
  gui.add("text", "hello").onChange(redraw);
  gui.add("noisePower", 10, 0, 1000).onChange(redraw);
  gui.add("n", 10, 0, 1000).onChange(redraw);
  gui.add("xSpacing", 20, 0, 1000).onChange(redraw);
  gui.add("ySpacing", 5, 0, 1000).onChange(redraw);
  gui.add("textSize", 20, 0, 1000).onChange(redraw);
  gui.add("noiseScale", .1, 0, 5).onChange(redraw);
  gui.add("nPow", .5, 0, 5).onChange(redraw);

  noLoop();
}


function draw() {
  clear();

  translate(width/2, height/2)
  const text = gui.text;
  for(let i = 0; i < text.length; i++) {
    const l = text.charAt(i)
    const initState = {
      x: 0 + i * gui.xSpacing,
      y: 0,
      delta: gui.noiseScale,
      noisePower: gui.noisePower,
      textSize: gui.textSize,
      rotate: 0,
    }

    const flow = new FlowText(l, initState)
    flow.render(gui.n)
  }
}


class FlowText {
  constructor(text, initState) {
    this.text = text;
    this.state = initState
  }

  updateState() {
    const n = (noise(this.state.x * gui.noiseScale, this.state.y * gui.noiseScale) - noise((this.state.x + this.state.delta)* gui.noiseScale, (this.state.y + this.state.delta)* gui.noiseScale)) * this.state.noisePower;
    this.state.textSize += n
    this.state.textSize = constrain(this.state.textSize, 1, 100)
    this.state.x += 0
    this.state.y += gui.ySpacing
    this.state.rotate += n;
  }

  render(n) {
    fill(0, 50)
    while(n-- > 0) {
    push()
      rotate(this.state.rotate)
       translate(this.state.x, this.state.y)

      textSize(this.state.textSize)

      for (let i = 0; i < pow(n, gui.nPow); i++){
        text(this.text, 0, 0)
      }

      this.updateState()
    pop()

    }
  }
}