/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let flows = {};
let FlowId = 0;

let textCanvas;


function setup() {
  createCanvas(displayWidth, displayHeight);
  textCanvas = createGraphics(100,100);
  noFill();
}

function draw() {
  if (mouseIsPressed) {
    new Flowy({
      pos: createVector(mouseX, mouseY),
    },
    {
      col: color('black'),
      // speed: randomGaussian(1.5,.5),
      radius: .5,
      max_age: 1000,
    });
  }

  const n = Object.values(flows).length;

  for(let j = 0; j < n; j++) {
    const flow = Object.values(flows)[j]

    if (!flow) {
      continue
    }
    flow.render();
  }
}

function keyPressed() {
  background(255)
  let flows = {}
  const t = new FlowyText(textCanvas);
  t.paint(key);
  // image(t.canvas, 0, 0, width, height)
  // t.makeFlowy(1000);
  const interval = setInterval(() => {
    t.makeFlowy(100);
  }, 10);

  setTimeout(() => {
    clearInterval(interval)
  }, 1000);
}



class FlowyText {
  constructor(canvas) {
    this.canvas = canvas;
  }

  paint(s) {
    this.canvas.background(255);
    this.canvas.textSize(32);
    this.canvas.textAlign(CENTER);
    this.canvas.fill(0);

    this.canvas.text(s, this.canvas.width/2, this.canvas.height/2);
    this.canvas.loadPixels();
  }

  makeFlowy(n) {
    while(n) {
      const pt = createVector(random(this.canvas.width-1), random(this.canvas.height-1));
      const col = this.canvas.get(pt.x, pt.y);
      // print(pt, col);
      if (red(col) < 10) {
        n--;
        new Flowy({
          pos: createVector(
            pt.x / this.canvas.width * width,
            pt.y / this.canvas.height * height,
          )
        }, {
          col: color('black'),
          radius: .1,
          max_age: 20,
        })
      }
    }
  }
}



class Flowy {
  constructor(state, opts) {
    this.state = state;
    this.opts = opts;
    this.age = 0;
    this.id = FlowId++;
    flows[this.id] = this;

    randomSeed(this.state.pos.x + this.state.pos.y * width);

    this.state.vel = createVector();
    this.state.acc = createVector(2,0).rotate(random(TWO_PI));
    this.initialPos = this.state.pos.copy();

  }

  render() {
    strokeWeight(this.opts.radius)
    for(let i = 0; i < this.opts.max_age; i++) {
      let p1 = this.state.pos.copy();
      this.update();
      line(p1.x,p1.y, this.state.pos.x, this.state.pos.y);
    }
  }

  destroy() {
    // print('destroy', this.id)
    delete flows[this.id];
    const i = (this.opts.iteration || 0);
    if (i < 2) {
      new Flowy({pos: this.initialPos.copy()}, {
        ...this.opts,
        iteration: i + 1,
      });
    }
    this.destroyed = true;
  }

  update() {
    if (this.age > this.opts.max_age && !this.destroyed) {
      this.destroy();
    }

    this.age++;
    const scale = .1;
    const n = noise(this.state.pos.x * scale, this.state.pos.y * scale, (this.opts.iteration || 0) * .001);
    const n2 = noise(this.state.pos.x * scale, this.state.pos.y * scale, (this.opts.iteration || 0) * .001);
    // const n = randomGaussian(.5, .1)
    // const n = random()
    // const dir = createVector(this.opts.radius * .1, 0).rotate(n > .5 ? PI/2: -PI/2);
    // print (dir)
    this.state.acc.rotate((n < .5 ? PI/10 : -PI/10) * n2)
    this.state.acc.add(0,0).limit(this.opts.radius * 1000);
    this.state.vel.add(this.state.acc).limit(this.opts.radius * 10);
    this.state.pos.add(this.state.vel);
  }
}