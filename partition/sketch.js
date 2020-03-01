/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let P;

let gui;

let cutPts = [];

function keyPressed() {
  switch (keyCode) {
    case ALT:
      save('out','svg');
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(1200, 900, SVG);
  print(displayWidth)
  print(displayHeight)
  // fill(150);
  // noStroke();
  background(200)
  // background(0);
  blendMode(REPLACE);

  noFill();



  gui = new GUI();
  gui.add('randomSeed', 0, 0, 100).onChange(redraw);
  gui.add('nPts', 0, 0, 5000).onChange(redraw);
  gui.add('borderSize', 0, 0, 100).onChange(redraw);
  gui.add('stroke', 1, 1, 10).onChange(redraw);
  gui.add('gaussianRadius', 50, 1, 500).onChange(redraw);
  gui.add('rows', 1, 1, 20).onChange(redraw);
  gui.add('cols', 1, 1, 20).onChange(redraw);
  gui.add('cellScale', 1, 0, 1).onChange(redraw);
}

function mousePressed() {
  // P.divide(createVector(mouseX, mouseY), random() < .5 ? 'x' : 'y');
  if (mouseX > width || mouseY > height) return;
  cutPts.push(createVector(mouseX, mouseY));

  redraw();
}

function draw() {
  noLoop();

  // noStroke();
  background(0,0);
  strokeWeight(gui.stroke)
  stroke(0);

  randomSeed(floor(gui.randomSeed));

  const lines = new LinesCollection();

  const dim = createVector(width / gui.cols / 2,  height / gui.rows / 2);
  for (let row = 0; row < gui.rows; row ++) {
    for (let col = 0; col < gui.cols; col ++) {

      const center = createVector(width/2, height/2).add(dim.x * 2 * (floor(gui.cols/2) - col), dim.y * 2 * (floor(gui.rows/2) - row));
      P = new Partition(center.copy().sub(dim.copy().mult(gui.cellScale)), center.copy().add(dim.copy().mult(gui.cellScale)));




      for(let i = 0; i < gui.nPts; i++) {
        // const pt = createVector(random(width), random(height));
        const pt = createVector(randomGaussian(0, gui.gaussianRadius)).rotate(random(PI)).add(center);
        pt.x = constrain(pt.x, P.p1.x, P.p2.x);
        pt.y = constrain(pt.y, P.p1.y, P.p2.y);
        P.divide(pt, i % 2 ? 'x' : 'y')
      }

      // randomSeed(floor(gui.randomSeed * 10));
      cutPts.forEach(pt => P.divide(pt, random() < .5 ? 'x' : 'y'))


      P.render(lines);
    }
  }
  lines.render();
}



class Partition {
  constructor(p1, p2, splitWay) {
    this.splitWay = splitWay;

    if(p1.x > p2.x || p1.y > p2.y) {
      this.p1 = p2;
      this.p2 = p1;
    } else {
      this.p1 = p1;
      this.p2 = p2;
    }

    this.children = [];
  }

  divide(pos, axis) {
    if (!(pos.x > this.p1.x && pos.y > this.p1.y && pos.x < this.p2.x && pos.y < this.p2.y)) return;
    if (this.children.length > 0) {
      this.children.forEach(c => c.divide(pos, axis));
      return;
    }
    if (axis === 'x') {
      const l = new Partition(this.p1.copy(), createVector(pos.x, this.p2.y), 'l');
      const r = new Partition(createVector(pos.x, this.p1.y), this.p2.copy(), 'r');
      this.children = [l,r];
    } else {
      const u = new Partition(this.p1.copy(), createVector(this.p2.x, pos.y), 'u');
      const d = new Partition(createVector(this.p1.x, pos.y), this.p2.copy(), 'd');
      this.children = [u,d];
    }
  }

  render(linesCollection) {
    if(this.children.length === 0) {
      const p1n = this.p1.copy().add(min(gui.borderSize, (this.p2.x - this.p1.x)/2), min(gui.borderSize, (this.p2.y - this.p1.y)/2));
      const p2n = this.p2.copy().sub(min(gui.borderSize, (this.p2.x - this.p1.x)/2), min(gui.borderSize, (this.p2.y - this.p1.y)/2));
      // rect(p1n.x, p1n.y, p2n.x, p2n.y);

      linesCollection.add('h', p1n.y, [p1n.x, p2n.x])
      linesCollection.add('h', p2n.y, [p1n.x, p2n.x])
      linesCollection.add('v', p1n.x, [p1n.y, p2n.y])
      linesCollection.add('v', p2n.x, [p1n.y, p2n.y])
      return;
    }


    this.children.forEach(c => c.render(linesCollection));
  }
}


class LinesCollection {
  constructor() {
    this.lines = {
      h: {},
      v: {},
    };
  }

  add(dir, main, [l1, l2]) {
    // print('adding ', dir, main, [l1, l2])
    if (!this.lines[dir][main]) this.lines[dir][main] = [];

    let added = false;
    this.lines[dir][main].forEach(([p1,p2], i) => {
      if (l1 <= p1) {
        if (l2 >= p1) {
          this.lines[dir][main][i] = [l1, max(l2, p2)];
          added = true;
        }
      } else {
        if (l1 <= p2) {
          this.lines[dir][main][i] = [p1, max(l2, p2)];
          added = true;
        }
      }

    });
    if (!added) {
      this.lines[dir][main].push([l1,l2]);
    }
  }


  render() {
    let cnt = 0;
    Object.keys(this.lines.v).forEach(k => {
      this.lines.v[k].forEach(([l1,l2]) => {
        line(k, l1, k, l2);
        cnt++;
      });
    });

    Object.keys(this.lines.h).forEach(k => {
      this.lines.h[k].forEach(([l1,l2]) => {
        line(l1, k, l2, k);
        cnt++
      });
    });

    print('rendered lines', cnt)
  }
}