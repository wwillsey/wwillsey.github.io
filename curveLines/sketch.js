/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let drawCanvas;
let cam;

function setup() {
  background(255)
  randomSeed(2)

  const canvas = createCanvas(displayWidth, displayHeight, WEBGL);
  setAttributes('antialias', true);

  drawCanvas = createGraphics(displayWidth * 2, displayHeight * 2);
  drawCanvas.background(255)
  // cam = createEasyCam();


  const pad = 25;
  const n = 30;

  let j = 1;

  while(j) {
    j--;
    for(let i = 0; i <= n; i++) {
      const y = height * .5 - (n/2*pad) + i * pad;
      const c = new CurveLine(
        createVector(width * .1, y),
        createVector(width * .9, y),
        2100,
        { disturbFn: (x) => {
          return createVector(0, pow(abs(i - n/2), 1.8) * sin( (i >= n/2 ? PI/2: -PI/2) + x * TWO_PI * 10))
        }
      }
      );
      c.render(drawCanvas);
    }
  }
}

function draw() {
  background(255)
  orbitControl()
  // textureWrap(CLAMP)

  let dirX = (mouseX / width - 0.5) * 4;
  let dirY = -(mouseY / height - 0.5) * 4;
  directionalLight(250, 250, 250, -dirX, -dirY, -1);



  noStroke();
  texture(drawCanvas);
  sphere(300,100,100);


  // save('out.svg')
  // noLoop();
}


class CurveLine {
  constructor(start, end, n, opts) {
    this.start = start;
    this.end = end;
    this.n = n;
    this.opts = opts;
  }

  disturb(pt, i) {
    return pt.add(this.opts.disturbFn(i));
  }

  getPts() {
    const diff = this.end.copy().sub(this.start);
    return Array.from({length: this.n}, (v,idx) => {
      const i = idx / (this.n - 1);
      let disturbance = createVector();
      this.disturb(disturbance, i);
      const d = diff.copy().mult(i).add(disturbance);
      return d.add(this.start);
    });
  }

  render(c) {
    const pts = this.getPts();

    c.noFill();
    c.strokeWeight(1);
    c.stroke(0, 250)
    c.beginShape();
    c.curveVertex(pts[0].x, pts[0].y);
    pts.forEach(pt => c.curveVertex(pt.x, pt.y));
    c.curveVertex(pts[pts.length-1].x, pts[pts.length-1].y);
    c.endShape();
  }
}