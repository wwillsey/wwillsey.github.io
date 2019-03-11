let shapes = []

function setup() {
  createCanvas(400, 400, WEBGL);
  smooth();
  noiseDetail(10, .4)
  cam = createEasyCam();

  randomSeed(10);
  while(shapes.length < 20) {
    try {
      shapes.push(createFlatShape());
    } catch {

    }
  }
}

function draw() {
  background(200)

  rotateZ(.5)
  shapes.forEach(draw3d);
}



function draw3d(pts) {
  beginShape(TRIANGLES);
  fill(random(0, 255));
  pts.forEach(pt => {
    curveVertex(pt.x, pt.y, pts[0].z);
  });

  // vertex(pts[0].x, pts[0].y, pts[0].z);
  endShape(CLOSE);
}


function sampleNoise(x,y) {
  const amp = 500;
  const scale = .001;
  return noise(x * scale, y * scale) * amp;
}


function createFlatShape() {
  const x = random(0, width);
  const y = random(0, height);
  const startPos = createVector(x, y, sampleNoise(x,y));
  const D = new Drifter(
    startPos.copy(),
    3,
    color(0),
    2
  );

  let iters = 0;
  const distThreshold = 10;
  const done = () => {
    iters++;
    if (iters > 200) {
      throw new Error('too many');
    }
    return (iters > 10 && dist(startPos.x, startPos.y, startPos.z, D.pos.x, D.pos.y, D.pos.z) < distThreshold);
  };

  const trail = [];
  while (!done()) {
    D.updatePos();
    // D.drawIt();
    trail.push(D.pos.copy());
  }
  return trail;
}


class Drifter {
  constructor(startPos, vel, col, size) {
    this.pos = startPos;
    this.vel = vel;
    this.dir = random(0, 2 * PI);
    this.col = col;
    this.size = size;
  }

  updateDir(iters, low, high) {
    let newDir = this.dir;
    let bestDir = {
      dir: 0,
      z: 999999999999
    };

    for (let i = low; i <= high; i += (high - low) / iters) {
      const vec = createVector(this.vel, 0).rotate(i).add(this.pos.x, this.pos.y);

      const xp = vec.x;
      const yp = vec.y;
      const zp = sampleNoise(xp,yp);
      if (abs(zp - this.pos.z) <= abs(bestDir.z - this.pos.z)) {
        bestDir = {
          dir: i,
          z: zp
        }
      }
    }
    return bestDir.dir;
  }

  updatePos() {
    let newDir = this.updateDir(5, this.dir - PI * .5, this.dir + PI * .5);
    newDir = this.updateDir(5, newDir - PI * .1, newDir + PI * .1);

    this.dir = newDir;

    const vec = createVector(this.vel, 0).rotate(this.dir).add(this.pos.x, this.pos.y);
    const xp = vec.x;
    const yp = vec.y;

    this.pos.x = xp;
    this.pos.y = yp;
  }

  drawIt() {
    push();
    // translate(-width/2 + this.pos.x, -height/2 + this.pos.y, this.pos.z);
    stroke(this.col);
    strokeWeight(this.size / 2);
    fill(this.col);
    point(this.pos.x - width / 2 , this.pos.y - height / 2, this.pos.z * 5 - 500);
    pop();
  }
}