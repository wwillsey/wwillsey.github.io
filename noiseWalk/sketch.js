
let cam;
let drifters;
let img;
let lvl = 0;

function preload() {
  // img = loadImage('http://localhost:3000/noiseWalk/face.jpg');
}

function keyPressed() {
  switch(keyCode) {
    case ENTER:
      remove();
      break;
    case SHIFT:
      background(0);
  }
}

function setup() {
  createCanvas(1200, 800, WEBGL);

  // cam = createEasyCam();
  noiseSeed(0);
  noiseDetail(5,.07);
  background(0);

  const heightMap = {};
  const heightBuckets = 6;
  drifters = Array.from({length: 300}).map(() => {
    let x,y,z,h;
    let count = 0;
    do {
      count++;
      x = random(0,width);
      y = random(0, height);
      z = sampleNoise(x,y);
      h = round(z) - round(z) % heightBuckets;
    } while (count < 20 && (heightMap[h] || heightMap[h] < 10));

    if (heightMap[h]) {
      heightMap[h]++;
    } else {
      heightMap[h] = 1;
    }

    // let col;
    // if (random(0,1) > .5) {
    //   col = lerpColor(color('white'), color('purple'), random(0,1));
    // } else {
    //   col = lerpColor(color('white'), color('blue'), random(0,1));
    // }
    let col = lerpColors([color(17, 157, 173), color('white'), color(110, 25, 214)], randomGaussian(.5,.5));
    let size = random(.5, 8);
    return new Drifter({x,y,z}, size/2, col, size);
  });
}

function draw() {
  orbitControl()
  translate(-width/2, -height/2)
  if (keyIsDown(SHIFT))
    background(0);

  if (keyIsDown(UP_ARROW)) {
    lvl += .001;
  }
  if (keyIsDown(DOWN_ARROW)) {
    lvl -= .001;
  }
  drifters.forEach((d) => {
    d.updatePos();
    d.drawIt();
  })
}

function lerpColors(colors, v) {
  v = constrain(v, 0, .99999999);
  const indx = v * (colors.length - 1);
  const col1 = colors[floor(indx)];
  const col2 = colors[floor(indx) + 1];
  return lerpColor(col1, col2, indx - floor(indx));
}

function createNoiseImage(w,h, scale, amp, t) {

  translate(-width/2, -height/2);
  for(let y = 0; y < h; y += 10) {
    for(let x = 0; x < w; x += 10) {
      const n = noise(x * scale, y * scale, t);
      const z = n * amp;
      const color1 = color('red');
      const color2 = color('blue');
      translate(x, y, z);
      noStroke();
      const col = lerpColor(color1, color2, n * 2);
      // print(col);
      fill(col);
      sphere(2);
      translate(-x,-y,-z);
      // img.set(x,y, color(...colorVals, 255));
    }
  }
}

function sampleNoise(x,y) {
  const scale = 0.01;
  return pow(noise(x * scale, y * scale, lvl), .05) * 300
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
