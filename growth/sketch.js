/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let system;
const nPts = 40;
const randomScale = 0;

function setup() {
  createCanvas(displayWidth, displayHeight);

  system = createStartPoints(nPts);
  // system.system.play();

  // noLoop();
  // background(0)
  // system.update();
}

function draw() {
  background(200, 10);
  system.update();
  // print(system);
}


function createStartPoints(n) {
  const pts = new Points();

  const gap = 50;
  const prevPts = [];
  for (let i = 0; i < n; i++) {

    const pos = p5.Vector.fromAngle(i * 2 * PI / n);
    pos.setMag(100);
    pos.add(width / 2, height / 2);


    const pt = pts.createPoint(pos.x, pos.y);
    print(pt);
    pts.connect(prevPts[prevPts.length - 1], pt);
    prevPts.push(pt);
  }

  // pts.connect(prevPts[prevPts.length - 1], prevPts[0]);

  return pts;
}

let ptId = 0;
class Point {
  constructor(data) {
    this.data = data;
    this.prev = null;
    this.next = null;
    this.id = ptId;
    ptId++;
    if (this.id > 2000) {
      throw new Error('no more')
    }
  }
}


class Points {
  constructor() {
    this.system = new ParticleSystem();
    // this.system.onUpdate(() => this.update());
    this.head = null;
  }

  update() {
    // this.system.applyForces();
    this.system.tick();
    // print(this.system)
    let pt = this.head;
    let looped = false;
    fill(200);
    while (pt && !looped) {
      if (pt.next) {
        const ptX = pt.data.particle.position.x;
        const ptY = pt.data.particle.position.y;
        const nptX = pt.next.data.particle.position.x;
        const nptY = pt.next.data.particle.position.y;
        line(ptX, ptY, nptX, nptY);

        pt.data.particle.velocity.x = min(pt.data.particle.velocity.x, 10);
        pt.data.particle.velocity.y = min(pt.data.particle.velocity.y, 10);


        if (ptId < 100 && dist(ptX, ptY, nptX, nptY) > pt.data.springR.length * 1) {
          const newPt = this.createPoint((ptX + nptX) / 2 + random() * randomScale, (ptY + nptY) / 2 + random() * randomScale);

          newPt.data.particle.velocity.x = pt.data.particle.velocity.x;
          newPt.data.particle.velocity.y = pt.data.particle.velocity.y;


          this.connect(pt, newPt);
        }

      }
      circle(pt.data.particle.position.x, pt.data.particle.position.y, 5);
      pt = pt.next;
      if (pt === this.head) {
        looped = true;
      }
    }
  }

  addForceBetween(ptA, ptB) {
    if (ptA && ptB) {
      const k = .009;
      const d = .95;
      const l =  2 * dist(ptA.data.particle.position.x, ptA.data.particle.position.y, ptB.data.particle.position.x, ptB.data.particle.position.y);

      const spring = this.system.makeSpring(ptA.data.particle, ptB.data.particle, k, d, l);
      // print(`created spring between ${ptA.id} and ${ptB.id}`, spring);
      ptA.data.springR = spring;
      ptB.data.springL = spring;
    }
  }

  removeForceBetween(ptA, ptB) {
    if (ptA && ptB) {
      const spring = ptA.data.springR;
      spring.on = false;
      delete ptA.data.springR;
      delete ptB.data.springL;
    }
  }

  createPoint(x, y) {
    const m = ptId === 0 || ptId === nPts - 1 ? 2 : 2;
    const particle = this.system.makeParticle(m, x, y);
    const point = new Point({
      particle
    });
    return point;
  }
  connect(ptA, ptB) {
    if (ptA) {
      if (ptA.next) {
        this.removeForceBetween(ptA, ptA.next);
        ptA.next.prev = ptB;
        ptB.next = ptA.next;
      }
      ptA.next = ptB;
      ptB.prev = ptA;
      this.addForceBetween(ptA, ptB);
      this.addForceBetween(ptB, ptB.next);
    } else {
      if (this.head) {
        this.head.prev = ptB;
      }
      ptB.next = this.head;
      this.head = ptB;
      this.addForceBetween(ptB, ptB.next);
    }
  }
}
