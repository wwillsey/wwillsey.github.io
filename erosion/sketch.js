var easycam;
let land;
const BOX_SIZE = 10;
let heightMapColors;
let E;
p5.disableFriendlyErrors = true
const LAND_HEIGHT_MULT = 500;
function setup() {
  noiseSeed(2);
  // noiseDetail(5,2)
  randomSeed(0)

  createCanvas(1200, 900, WEBGL);
  setAttributes('antialias', true);

  // easycam = createEasyCam({
  //   distance: 2500,
  //   // center: [100,100,0]
  //   rotation: [ 0, 0, 0.4871745, -0.8733046 ]
  // });
  // document.oncontextmenu = function() { return false; }
  // document.onmousedown   = function() { return false; }
  land = new Land(200, 200, 'NOISE')
  E = new p5.Ease();
  heightMapColors = [
    color(29, 52, 198),
    color(61, 153, 41),
    color(170, 142, 82),
    color(70, 73, 91),
    color(255)
  ];

  // debugMode()
  noStroke();
}


// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
//   easycam.setViewport([0,0,windowWidth, windowHeight]);
// }


function draw(){
    background(32);
    // background(255)
  orbitControl();
  rotateX(PI/2)

  // projection
  // perspective(60 * PI/180, width/height, 1, 100);

  // BG



  if (frameCount < 3)
    return
  else if (frameCount % 2 === 0) {
    // strokeWeight(0.5);
    // stroke(0);
    print('rendering land');
    const rain = new Rain(land);
    rain.applyRain(500);
    rain.applyErosion();
    // rain.render();
  }
  land.render();

  // triangle(mouseX, mouseY, mouseX + 40, mouseY + 20, mouseX - 40, mouseY + 20)
  // translate(-width/2, -height/2);
  // rotateX(PI/2)
  // beginShape(TRIANGLE_STRIP);
  // for(let i = 0; i < 25; i++) {
  //   fill(i * 10);
  //   vertex(i * 10, 0, i * 10);
  //   fill(255-i * 10);

  //   vertex((i) * 10, 100, sin(i) * 10);
  // }
  // endShape()
}


function createArr(w, h, type) {
  let fn;
  switch (type) {
    case 'UNIFORM_RANDOM':
      fn = () => random(0,1);
      break;
    case 'NOISE':
      fn = (x,y) => {


        const ns = .02;
        noiseDetail(5,.1);
        const base = pow(noise(x * ns, y * ns), 1);

        noiseDetail(3,.55);
        const mid =  pow(noise(x * ns, y * ns), 1);

        noiseDetail(5,.57);
        const peaks = pow(noise(x * ns, y * ns), 3)

        // return base * .1 + (mid * base) * .3 + (peaks ) * .5;
        return base * .4 + (mid) * .6 + peaks * .1
      }
      break;
    default:
      fn = (x,y) => x + y;
  }

  return Array.from({length: h}, (v, y) => Array.from({length: w}, (v, x) => fn(x,y)));
}

class Land {
  constructor(w, h, type) {
    this.array = createArr(w, h, type);
    this.width = w;
    this.height = h;
    this.size = BOX_SIZE;
  }

  get(x,y) {
    x = round(x);
    y = round(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      return undefined;
    return this.array[y][x];
  }

  erode(x,y, amt) {
    x = round(x);
    y = round(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height)
      return undefined;

      this.array[y][x] = max(0, this.array[y][x] - amt);
  }

  getVelAtPt(pt) {
    const center = this.get(pt.x, pt.y);

    const l = this.get(pt.x - 1, pt.y) || center;
    const r = this.get(pt.x + 1, pt.y) || center;
    const dx = r - l;

    const u = this.get(pt.x, pt.y - 1) || center;
    const d = this.get(pt.x, pt.y + 1) || center
    const dy = d - u;

    return createVector(dx, dy);
  }

  // render() {
  //   noStroke();
  //   push();
  //   translate(- this.width * this.size / 2, -  this.height * this.size / 2)
  //   for(let y = 0; y < this.height; y++) {
  //     translate(0, this.size);
  //     push();
  //     for(let x = 0; x < this.width; x++) {
  //       translate(this.size, 0);
  //       const v = this.get(x,y);
  //       fill(lerpColors(heightMapColors, E.quadraticOut(v)));
  //       push();
  //       translate(0,0,v * LAND_HEIGHT_MULT / 2);
  //       box(this.size, this.size, v * LAND_HEIGHT_MULT);
  //       pop()
  //     }
  //     pop()
  //   }
  //   pop();
  // }

  render() {
    translate(-this.width/2 * this.size, -this.height/2 * this.size)
    // noStroke();
    for(let y = 1; y < this.height-1; y++) {
      beginShape(TRIANGLE_STRIP);
      for (let dir = -1; dir <=1; dir += 2) {
      for(let x = 1; x < this.width-1; x++) {
          const v1 = this.get(x, y);
          const v2 = this.get(x+dir,y+dir);

          const p1 = createVector(x, y).mult(this.size).add(0,0, v1 * LAND_HEIGHT_MULT);
          const p2 = createVector(x+dir, y+dir).mult(this.size).add(0,0, v2 * LAND_HEIGHT_MULT);

          fill(lerpColorsWithCache(heightMapColors, E.quadraticOut(v1)));
          vertex(p1.x, p1.y, p1.z);
          fill(lerpColorsWithCache(heightMapColors, E.quadraticOut(v2)));
          vertex(p2.x, p2.y, p2.z);
        }
        endShape();
        }
    }
  }
}



const lerpCache = {};
function lerpColorsWithCache(colors, val)  {
  const bucket = round(val * 100);
  const res = lerpCache[bucket];
  if(!res) {
    lerpCache[bucket] = lerpColors(colors, val);
  }
  return lerpCache[bucket];
}




const maxRaindropLife = 200;
const maxRaindropVel = 1;
class RainDrop {
  constructor(land, pos) {
    this.land = land;
    this.pos = pos;
    this.vel = createVector(0,0);
    this.history = [];
  }

  createPath() {
    for(let i = 0; i < maxRaindropLife; i++) {
      this.history.push({
        x: this.pos.x,
        y: this.pos.y
      });

      const accel = this.land.getVelAtPt(this.pos).mult(10).add(this.vel.copy().setMag(-this.vel.mag() * .1))

      this.vel.add(accel).limit(maxRaindropVel);
      if (this.vel.mag() < .05 && accel.mag() < .05 ||
          this.pos.x >= this.land.width ||
          this.pos.x < 0 ||
          this.pos.y >= this.land.height ||
          this.pos.y < 0) {
        // print('done early', this.history.length);
        return
      }
      this.pos.add(this.vel);
    }
  }

  renderPath() {
    fill('blue');
    noStroke();
    this.history.forEach((pos) => {
      push();
        translate(pos.x * this.land.size, pos.y * this.land.size, this.land.get(pos.x, pos.y) * LAND_HEIGHT_MULT + 10);
        sphere(2, 2, 2);
        // print('drop pos', pos, this.land.get(pos.x, pos.y))
      pop();
    });
  }

}



class Rain {
  constructor(land) {
    this.land = land;
    this.raindrops;
  }


  createRaindrop() {
    const x = random(0, this.land.width - 1);
    const y = random(0, this.land.height - 1);

    return new RainDrop(this.land, createVector(x,y));
  }

  applyRain(nDrops) {
    this.raindrops = Array.from({length: nDrops}, () => {
      const rainDrop = this.createRaindrop();
      rainDrop.createPath();
      return rainDrop;
    });
  }

  applyErosion() {
    this.raindrops.forEach(drop => {
      let lastPos;
      drop.history.forEach(pos => {
        for (let dx = -1; dx <= 1; dx += 1) {
          for (let dy = -1; dy <= 1; dy += 1) {
            let amt = 0;
            const distance = dy != 0 || dx != 0 ? 1 / myDist(0,0, dx, dy) : 1;
            amt += pow(distance, 2);
            const speed = lastPos ? myDist(lastPos.x, lastPos.y, pos.x, pos.y) : 0;
            amt += pow(speed,.4);

            this.land.erode(pos.x + dx, pos.y + dy, .0001)//.001 * pow(distance, 2) * pow(speed, 2))
          }
        }
        lastPos = pos;
      })
    });
  }

  render() {
    push();
    translate(- this.land.width * this.land.size / 2, -  this.land.height * this.land.size / 2)
    this.raindrops.forEach(drop => {
      drop.renderPath()
    });
    pop();
  }
}


function myDist(x1, y1, x2, y2) {
  // print('used');
  // remove();
  let a = (x1 - x2);
  let b = (y1 - y2);
  return Math.sqrt(a*a + b * b)
}


// Dw.EasyCam.prototype.apply = function(n) {
//   var o = this.cam;
//   n = n || o.renderer,
//   n && (this.camEYE = this.getPosition(this.camEYE), this.camLAT = this.getCenter(this.camLAT), this.camRUP = this.getUpVector(this.camRUP), n._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2], this.camLAT[0], this.camLAT[1], this.camLAT[2], this.camRUP[0], this.camRUP[1], this.camRUP[2]))
// };