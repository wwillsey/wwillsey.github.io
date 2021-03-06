/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let W;
const slimes = [];
let canvas;
let drawCanvas;
const startSlimes = 1000;
const maxSlimes = 5000;
const friction = .001;

const boxLengthMult = .013;
const boxSizeMult = .009;

const decayFrequency = 17;
const decayAmount = 3;

const blurFrequency = 171;

const renderFrames = false;
const saveFrequency = 17;
let saveFrameNum = 1;

let useBackgroundImg = false;
let backgroundImg;

const sumMapScale = 5;


const pourPts = [];
function preload() {
  // backgroundImg = loadImage('http://localhost:3000/curve/starry.jpg');
  backgroundImg = loadImage('http://localhost:3000/curve/starry.jpg');
  // backgroundImg = loadImage('http://localhost:3002/colorWalk/sunsetColors.png');
}

// const renderFrequency = 5;

let colors;


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
  canvas = createCanvas(1920/5, 1080/5);
  backgroundImg.resize(width, height);
  // slowColor = color(202, 122, 181);
  // fastColor = color(122, 202, 143);

  // slowColor = color(15, 89, 248);
  // fastColor = color(156, 186, 252);

  colors = [color(46, 214, 222), color(214, 222, 46), color(46, 214, 222), color(222, 46, 214)];
  // colors = reverse([color(222, 12, 73), color(222, 222, 73), color(222, 222, 210), color(130, 222, 210)]);


  pixelDensity(1);
  drawCanvas = createGraphics(width, height);
  pixelDensity(2);
  W = new World({
    w: width,
    h: height,
  });

  // slimes.push(...Array.from({length: startSlimes}, () => createSlime()));
  // slimes.push(...Array.from({length: startSlimes}, () => createSlime(undefined, undefined, color('black'))));

  // drawCanvas.rectMode(CENTER);
  drawCanvas.background(0,0);
  drawCanvas.noStroke();
  // drawCanvas.loadPixels();
  canvas.background(0,0);
  background(0);
  stroke(color(255));
  strokeWeight(4);
  fill(0,0);
  print({
    sensorLength: width * boxLengthMult,
    sensorBoxSize: width * boxSizeMult,
  })

  // pourPts.push(...Array.from({length: 6}, () => ({x: randomGaussian(width / 2, width / 8), y: randomGaussian(height / 2, height / 6) })));
  pourPts.push(...Array.from({length: 10}, (v,i) => p5.Vector.fromAngle(i * 2 * PI / 10).setMag(100).add(width/2, height/2)))
}


function createSlime(x,y, color, vel) {
  const angle = random() * 2 * PI;
  const px = x || random(0, W.options.w);
  const py = y || random(0, W.options.h);
  return new Slime({
    x: px,
    y: py,
    vx: cos(angle) * (vel || .001),
    vy: sin(angle) * (vel || .001),
    m: 200,
    angle,
  }, W, {
    sensorAttempts: 3,
    sensorAngle: PI / randomGaussian(100, 5),
    sensorLength: width * boxLengthMult,
    sensorBoxSize: width * boxSizeMult,
    speed: 0.03,
    maxVel: 0.2,
    depositAmount: color ? 25 : 6,
    color: color || (useBackgroundImg ? backgroundImg.get(px, py) : null)
  });
}

function draw() {
  // for (let i = 0; i < 1; i++)
  //   slimes.push(createSlime(width/2, height/2, color('black')));
  if (slimes.length < maxSlimes)
    pourPts.forEach((pt) => slimes.push(createSlime(pt.x, pt.y, null, .12)));

  if (slimes.length > maxSlimes)
    slimes.splice(0,1)


  // const n = 4;
  // const x = randomGaussian((round(frameCount / 500) % n) * width / n, 2);
  // const y = randomGaussian((round(frameCount / 500) % n) * height / n, 2);
  // slimes.push(...Array.from({length: 1}, () => createSlime(x, y)));
  // tint(255)

  // if (frameCount % 20 === 0)
  //   W5.render();
  // if (frameCount % renderFrequency === 1)
    W.render();

  if (renderFrames && frameCount % saveFrequency === 1) {
    saveCanvas(`slime_${saveFrameNum}`);
    saveFrameNum++;
  }
  // }
  if(frameCount % 27 === 1) {
    W.createSumMap();
  }

  if (frameCount % decayFrequency === 1)
    W.decay(decayAmount);

  if (frameCount % blurFrequency === 1)
    W.Blur(1);


  slimes.forEach(slime => slime.update());
}


class Slime {
  constructor(state, world, options) {
    this.state = state;
    this.world = world;
    this.options = options;
  }

  sense() {
    const sensorAttempts = this.options.sensorAttempts;
    const sensorAngle = this.options.sensorAngle//, this.options.sensorAngle * .0000005);
    const sensorLength = constrain(randomGaussian(this.options.sensorLength, this.options.sensorLength), this.options.sensorLength * .05, this.options.sensorLength * 10);
    const sensorBoxSize = this.options.sensorBoxSize / 2;
    const worldW = round(this.world.options.w / sumMapScale);
    const worldH = round(this.world.options.h / sumMapScale);

    const offset = (sensorAttempts - 1) / 2;
    const sensed = shuffle(Array.from({ length: sensorAttempts }, (v, i) => {
      const angle = (i - offset) * sensorAngle + this.state.angle;
      const x = this.state.x + cos(angle) * sensorLength;
      const y = this.state.y + sin(angle) * sensorLength;

      const xTop = constrain(round((x + sensorBoxSize) / sumMapScale), 0, worldW - 1);
      const yTop = constrain(round((y + sensorBoxSize) / sumMapScale), 0, worldH - 1);
      const xBottom = constrain(round((x - sensorBoxSize) / sumMapScale), 0, worldW - 1);
      const yBottom = constrain(round((y - sensorBoxSize) / sumMapScale), 0, worldH - 1);

      const top = safeGet(xTop, yTop, worldW, worldH, this.world.sumMap, 0);
      const bottom = safeGet(xTop, yBottom - 1, worldW, worldH, this.world.sumMap, 0);
      const left = safeGet(xBottom - 1, yTop, worldW, worldH, this.world.sumMap, 0);
      const bottomLeft = safeGet(xBottom - 1, yBottom - 1, worldW, worldH, this.world.sumMap, 0);

      return {
        angle,
        count: (top - bottom - left + bottomLeft),
      };
    }));

    return maxWith(sensed, sense => sense.count);
    // return minWith([sensed[1], [sensed[0], [sensed[2]]]], sense => sense.count);

    // let l = sensed[0].count;
    // let m = sensed[1].count;
    // let r = sensed[2].count;
    // const maxi = max(l, m, r);

    // l = round(l / maxi * 3);
    // m = round(m / maxi * 3);
    // r = round(r / maxi * 3);



    // // if (random() < .1) {
    // //   return random(sensed).angle;
    // // }

    // if (m > l && m > r)
    //   return sensed[1].angle;
    // if (m < l && m < r && l === r)
    //   return random([sensed[0].angle, sensed[2].angle]);
    // if (r > m && r > l)
    //   return sensed[2].angle;
    // if (l > m && l > r)
    //   return sensed[0].angle;
    // return sensed[1].angle;

  }

  deposit() {
    drawCanvas.strokeWeight(1);

    let col;
    if (this.options.color) {
      col = this.options.color
    } else {
      // const vel = pow(this.state.vx, 2) + pow(this.state.vy, 2);
      // const amt = pow(vel / pow(this.options.maxVel, 2), 3);
      // col = lerpColors(colors, amt - randomGaussian(0, .1));

      const xamt = abs(this.state.vx) / this.options.maxVel;
      const yamt = abs(this.state.vy) / this.options.maxVel;
      const cx = lerpColor(colors[0],colors[1], xamt);
      const cy = lerpColor(colors[2],colors[3], yamt);
      col = lerpColor(cx, cy, .5 - xamt / 2 + yamt / 2);
    }

    drawCanvas.stroke(color(red(col), green(col), blue(col), this.options.depositAmount));
    drawCanvas.point(this.state.x, this.state.y);
  }

  update() {
    const frictionVec = createVector(this.state.vx, this.state.vy);
    frictionVec.setMag(-max(0.0000001, frictionVec.mag()) * friction);

    const { angle, count } = this.sense();
    this.state.angle = randomGaussian(angle, 0.01);
    // print(count);
    const accel = p5.Vector.fromAngle(this.state.angle).mult(log(max(count, 1)) * this.options.speed / this.state.m).add(frictionVec);

    this.state.vx += accel.x;
    this.state.vy += accel.y;

    this.state.x += this.state.vx;
    this.state.y += this.state.vy;


    if (this.state.x < -10 || this.state.x > this.world.options.w + 10 || this.state.y < -10 || this.state.y > this.world.options.h + 10) {
      this.state.x = this.world.options.w / 2;
      this.state.y = this.world.options.h / 2;
    }

    this.deposit();
  }
}

class World {
  constructor(options) {
    this.options = options;
    // this.map = Array.from({ length: this.options.w }, () => Array.from({ length: this.options.h }, () => 0));
    this.map = canvas;
    this.sumMap = Array.from({ length: round(this.options.w / sumMapScale) }, () => Array.from({ length: round(this.options.h / sumMapScale) }, () => 0));
    this.sumMapGraphic = createGraphics(round(this.options.w / sumMapScale), round(this.options.h / sumMapScale));
  }

  render() {
    // /,,();
    // drawCanvas.tint(255, 1);
    image(drawCanvas, 0, 0);

    // drawCanvas.background(0)
    drawCanvas.clear();
    drawCanvas.background(0,0);
    // drawCanvas.background(0, 0);
  }


  createSumMap() {
    const start = Date.now();
    this.createSumMap3();
    print(`SumMap took: ${Date.now() - start} ms`)
    // return map;
  }

  // createSumMap1() {
  //   loadPixels();
  //   const w = this.options.w;
  //   const h = this.options.h;
  //   const sumMap  = this.sumMap;//= Array.from({ length: w }, () => Array.from({ length: h }, () => 0));
  //   let xlast = [];
  //   for (let x = 0; x < w; x++) {
  //     const xCurr = sumMap[x];
  //     for (let y = 0; y < h; y ++) {
  //       const ul = xlast[y-1] || 0;
  //       const u = xCurr[y-1] || 0;
  //       const l = xlast[y] || 0;

  //       const mapVal = getFromPixels(x,y);
  //       // print(mapVal)
  //       sumMap[x][y] = mapVal + u + l - ul;
  //     }
  //     xlast = xCurr;
  //   }
  //   return sumMap;
  // }

  createSumMap2() {
    loadPixels();
    const w = this.options.w;
    const h = this.options.h;
    const sumMap = this.sumMap;
    for (let x = 0; x < w; x++) {
      let lastVal = 0;
      for (let y = 0; y < h; y ++) {
        lastVal += getFromPixels(x,y);
        sumMap[x][y] = lastVal;
      }
    }

    for (let y = 0; y < h; y++) {
      let lastVal = sumMap[0][y];
      for (let x = 1; x < w; x ++) {
        lastVal = sumMap[x][y] += lastVal;
      }
    }
    return sumMap;
  }

  createSumMap3() {
    loadPixels();
    this.sumMapGraphic.image(canvas, 0, 0, this.sumMap.width, this.sumMap.height);
    this.sumMapGraphic.loadPixels();

    const w = round(this.options.w / sumMapScale);
    const h = round(this.options.h / sumMapScale);
    const sumMap = this.sumMap;
    for (let x = 0; x < w; x++) {
      let lastVal = 0;
      for (let y = 0; y < h; y ++) {
        // const col = this.sumMapGraphic.get(x,y);
        lastVal += getFromPixelsWith(x,y, this.sumMapGraphic);
        sumMap[x][y] = lastVal;
      }
    }

    for (let y = 0; y < h; y++) {
      let lastVal = sumMap[0][y];
      for (let x = 1; x < w; x ++) {
        lastVal = sumMap[x][y] += lastVal;
      }
    }
    return sumMap;
  }




  BlurHorizontal(source, dest, radius) {
    const w = this.options.w;
    const h = this.options.h;
    for (let y = 0; y < h; ++y) {
        for (let x = 0; x < w; ++x) {
            let total = 0
            for (let kx = -radius; kx <= radius; ++kx)
                total += safeGet(x + kx, y, w, h, source, 0);
            dest[x][y] = total / (radius * 2 + 1)
        }
    }
  }

  BlurVertical(source, dest, radius) {
    const w = this.options.w;
    const h = this.options.h;
    for (let x = 0; x < w; ++x) {
        for (let y = 0; y < h; ++y) {
            let total = 0
            for (let ky = -radius; ky <= radius; ++ky)
                total += safeGet(x, y + ky, w, h, source, 0);
            dest[x][y] = total / (radius * 2 + 1)
        }
    }
  }

  Blur(radius) {
    // const temp = Array.from({ length: this.options.w }, () => Array.from({ length: this.options.h }, () => 0));
    // this.BlurHorizontal(this.map, temp, radius);
    // this.BlurVertical(temp, this.map, radius);
    // filter('BLUR', radius);
  }

  decay(amount) {
    // blendMode(DARKEST);
    background(0, amount);
    // blendMode(BLEND);
  }
}


function maxWith(list, iterator) {
  let max = list[0];
  let maxVal = iterator(max);
  list.forEach((elem) => {
    const newVal = iterator(elem);
    if (newVal > maxVal) {
      maxVal = newVal;
      max = elem;
    }
  });
  return max;
}

function minWith(list, iterator) {
  let max = list[0];
  let maxVal = iterator(max);
  list.forEach((elem) => {
    const newVal = iterator(elem);
    if (newVal < maxVal) {
      maxVal = newVal;
      max = elem;
    }
  });
  return max;
}
function safeGet(x, y, w, h, map, def) {
  if (x >= w || y >= h || x < 0 || y < 0)
    return def;
  return map[x][y];
}

function safeUpdate(x, y, w, h, map, val) {
  if (x >= w || y >= h || x < 0 || y < 0)
    return;
  map[x][y] += val;
}


function getFromPixels(x, y) {
  if (x >= width || y >= height || x < 0 || y < 0)
    return 0;
  // const c = get(x,y);
  // return (red(c) + green(c) + blue(c)) / (255 * 3);
  const pd = pixelDensity()
  const d = 1
  index = 4 * ((y * pd + d) * width * pd + (x * pd + d));
  return (pixels[index] + pixels[index + 1] + pixels[index + 2]) / (255 * 3);
}

function getFromPixelsWith(x, y, g) {
  if (x >= g.width || y >= g.height || x < 0 || y < 0)
    return 0;
  // const c = get(x,y);
  // return (red(c) + green(c) + blue(c)) / (255 * 3);
  const pd = g.pixelDensity()
  const d = 1
  index = 4 * ((y * pd + d) * g.width * pd + (x * pd + d));
  return (g.pixels[index] + g.pixels[index + 1] + g.pixels[index + 2]) / (255 * 3);
}