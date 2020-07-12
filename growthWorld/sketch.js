/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let gui, W;

function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg('out');
      break;
    case SHIFT:
      startWorld();
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(displayWidth * 2, displayHeight * 2);
  gui = new GUI();
  rectMode(CENTER);

  gui.add("repulsionForce", 1, 0, 100)
  gui.add("distToAddNbor", 10, 0, 500)
  gui.add("desireDist", 5, 0, 500)
  gui.add("springStrength", .005, 0, 5)
  gui.add("alignmentForce", .005, 0, 5)
  gui.add("friction", .01, 0, 5)
  gui.add("maxPts", 300, 0, 5000,1)
  gui.add("stroke", 0, 0, 1)

  startWorld();
}

function draw() {
  // clear();
  if(gui.stroke == 0) {
    background(0);
  }

  W.update();
}

function startWorld() {
  stroke(255, gui.stroke > 0 ? 255 * gui.stroke : 255);
  noFill();
  clear();
  background(0);

  const blobs = [];
  blobs.push(makeBlob(
    createVector(width/2, height/2),
    100,
    20
  ));

  // blobs.push(makeBlob(
  //   createVector(width/2 + 300, height/2),
  //   100,
  //   20
  // ));

  // blobs.push(makeBlob(
  //   createVector(width/2 + 150, height/2),
  //   100,
  //   20
  // ));

  // blobs.push(makeBlob(
  //   createVector(width/2, height/2),
  //   20,
  //   20
  // ));

  W = new World(blobs);
}

function makeBlob(pos, r, n) {
  const pts = Array.from({length: n}, (v,i) => {
    const p = createVector(r, 0).rotate(i / n * TWO_PI).add(pos);
    const pt = {
      x: p.x,
      y: p.y,
      vx: 0 ,
      vy: 0
    }
    return pt;
  })
  for (let i = 0; i < n; i++) {
    const pt = pts[i];
    pt.next = pts[(i + n + 1) % n];
    pt.prev = pts[(i + n - 1) % n];
  }
  return new Blob(pts, []);
}


class World {
  constructor(blobs) {
    this.blobs = blobs;
  }

  update() {
    const allPts = []
    this.blobs.forEach(b =>  {
      b.pts.forEach(p => {
        allPts.push({
          minX: p.x,
          minY: p.y,
          maxX: p.x,
          maxY: p.y,
        });
      })
    });


    // this.tree = new kdTree(allPts, (pt1, pt2) => , ["x", "y"]);
    this.tree = new rbush();
    this.tree.load(allPts);

    this.blobs.forEach(b => {
      b.updatePts();
      b.render();
    });
  }

  getNearest(pt) {
    const nearest = knn(this.tree, pt.x, pt.y, min(15, max(1, gui.maxPts * .05)))
      .map(p => [
        {x: p.minX, y: p.minY},
        Math.sqrt((p.minX - pt.x) ** 2 + (p.minY - pt.y) ** 2)
      ]);
    return nearest
  }

  getFriction(pt) {
    return createVector(pt.vx, pt.vy).normalize().mult(- sqrt(pt.vx ** 2 + pt.vy**2) * gui.friction);
  }
}


class Blob {
  constructor(pts, genome) {
    this.pts = pts;
    this.genome = genome;
  }

  genOpts() {
    this.opts = {
      distToAddNbor: gui.distToAddNbor,
      repulsionForce: gui.repulsionForce,
      desireDist: gui.desireDist,
      springStrength: gui.springStrength,
      alignmentForce: gui.alignmentForce,
    }
  }

  tryAddNbor(pt1, pt2) {
    if(this.pts.length > gui.maxPts) return null;
    const d = Math.sqrt((pt1.x - pt2.x) ** 2 + (pt1.y - pt2.y) ** 2);
    if (d > this.opts.distToAddNbor) {
      const pt = {
        x: (pt1.x + pt2.x) / 2,
        y: (pt1.y + pt2.y) / 2,
        vx: (pt1.vx + pt2.vx) / 2,
        vy: (pt1.vy + pt2.vy) / 2,
        prev: pt1,
        next: pt2,
      };
      pt1.next = pt;
      pt2.prev = pt;
      return pt;
    }
  }


  getDirectForce(pt1, pt2) {
    const d = this.opts.desireDist - Math.sqrt((pt1.x - pt2.x) ** 2 + (pt1.y - pt2.y) ** 2);
    return createVector(pt1.x - pt2.x, pt1.y - pt2.y).normalize().mult(d * this.opts.springStrength);
  }

  getAlignmentForce(pt) {
    const mid = createVector(pt.prev.x, pt.prev.y).add(pt.next.x, pt.next.y).mult(0.5);

    const d = (pt.x - mid.x) ** 2 + (pt.y - mid.y) ** 2;
    return createVector(pt.x - mid.x, pt.y - mid.y).normalize().mult(this.opts.alignmentForce / d);
  }

  getForce(pt) {
    const nBors = W.getNearest(pt);
    const f = createVector();
    nBors.forEach(([n, dist]) => {
      const d = pow(dist,.8);
      // print(dist, d)
      const repulsion = createVector((pt.x - n.x), (pt.y - n.y)).normalize().mult(this.opts.repulsionForce / d);
      f.add(repulsion);

      f.add(this.getDirectForce(pt, pt.next));
      f.add(this.getDirectForce(pt, pt.prev));
      f.add(this.getAlignmentForce(pt));
      f.add(W.getFriction(pt));
    })

    return f;
  }

  updatePts() {
    this.genOpts()

    const ptsToConsider = shuffle(this.pts);
    const newPts = [];
    for (let i = 0; i < ptsToConsider.length && i < gui.maxPts * 2; i++) {
      const pt = ptsToConsider[i];


      const newNext = this.tryAddNbor(pt, pt.next);
      if (newNext) {
        ptsToConsider.push(newNext)
      }

      const newPrev = this.tryAddNbor(pt.prev, pt);
      if (newPrev) {
        ptsToConsider.push(newPrev)
      }

      newPts.push(pt);
    }
    newPts.forEach(pt => {
      // const ax = abs(pt.vx);
      // const ay = abs(pt.vy);

      // if (ax < .05 && ay < .05 && random() > .1) {
      //   return;
      // }
      const f = this.getForce(pt).limit(.1)
      pt.vx += f.x;
      pt.vy += f.y;
      pt.x += pt.vx;
      pt.y += pt.vy;
    })

    this.pts = newPts;
  }

  render() {
    // fill(0);

    beginShape()
    const head = this.pts[0];
    let pt = head;
    do {
      vertex(pt.x, pt.y)
      pt = pt.next;
    } while(pt != head)

    endShape(CLOSE)
  }
}