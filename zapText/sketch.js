let mainCanvas;

function setup() {
  mainCanvas = createCanvas(400, 400);
  background(200);

  const zap = new ZapText('H');
  zap.setupCanvas();
  zap.zap(10);
  image(zap.canvas, 0, 0, width, height);
}

function draw() {
}


function writeText(canvas, text, col) {
  canvas.fill(col);
  canvas.textAlign(CENTER);
  canvas.textSize(100);
  canvas.text(text, canvas.width * .5, canvas.height * .75);
}

class Zap {
  constructor(canvas) {
    this.canvas = canvas;
  }

  drawPath(pts) {
    fill(0);
    stroke(0);
    strokeWeight(2);
    for(let i = 1; i < pts.length; i++) {
      this.canvas.line(pts[i].x, pts[i].y, pts[i-1].x, pts[i-1].y);
    }

  }

  isPointInBounds(pt) {
    print('isPtINbound called: ', pt);
    if (pt)
      print('alpha', alpha(this.canvas.get(pt.x, pt.y)));
    return pt !== undefined && alpha(this.canvas.get(pt.x, pt.y)) !== 0;
  }

  generatePath(n) {
    let pt;
    while(!this.isPointInBounds(pt)) {
      print('find inbound pt');
      pt = createVector(random(0, this.canvas.width), random(0, this.canvas.height));
    }

    let vel = p5.Vector.random2D().mult(random(5, 20));;
    const pts = [];
    for(let i = 0; i < n; i++) {
      let velAttempt = vel.copy();
      let newPt;
      while (!this.isPointInBounds(newPt)) {
        velAttempt.mult(.75);
        newPt = pt.copy().add(velAttempt);
      }

      if(!velAttempt.equals(vel)) {
        vel.rotate(randomGaussian(PI, 2));
      }
      pt = newPt;
      pts.push(pt);
    }
    return pts;
  }
}

class ZapText {
  constructor(text) {
    this.text = text;
    this.canvas = createGraphics(100, 100);
  }

  setupCanvas() {
    this.canvas.background(0,0,0,0);
    writeText(this.canvas, 'W', color('white'));
  }

  zap(n) {
    for(let i = 0; i < n; i++) {
      const zap = new Zap(this.canvas);
      const path = zap.generatePath(20);
      print(path);
      zap.drawPath(path);
    }
  }
}