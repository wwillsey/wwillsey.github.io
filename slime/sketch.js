/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let W;
let slimes;
let canvas;
let drawCanvas;
const startSlimes = 10000;
const maxSlimes = 15000;
const friction = .01;

const boxLengthMult = .02;
const boxSizeMult = .02;

const decayFrequency = 17;
const decayAmount = 60;

const blurFrequency = 17;

const renderFrames = false;
const saveFrequency = 17;
let saveFrameNum = 1;

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
  canvas = createCanvas(1920 / 4, 1080 / 4);
  randomSeed(1);
  // slowColor = color(202, 122, 181);
  // fastColor = color(122, 202, 143);

  // slowColor = color(15, 89, 248);
  // fastColor = color(156, 186, 252);

  colors = reverse([color(222, 12, 73), color(222, 222, 73), color(222, 222, 210), color(130, 222, 210)]);


  pixelDensity(1);
  drawCanvas = createGraphics(width, height);
  pixelDensity(2);
  W = new World({
    w: width,
    h: height,
  });

  slimes = Array.from({length: startSlimes}, () => createSlime());
  // drawCanvas.rectMode(CENTER);
  drawCanvas.background(0,0);
  drawCanvas.noStroke();
  // drawCanvas.loadPixels();
  canvas.background(0,0);
  background(0);
  stroke(color(255));
  strokeWeight(4);
  fill(0,0);
  circle(width/2, height/2, 50);
  print({
    sensorLength: width * boxLengthMult,
    sensorBoxSize: width * boxSizeMult,
  })
}


function createSlime(x,y) {
  const angle = random() * 2 * PI;
  return new Slime({
    x: x || random(0, W.options.w),
    y: y || random(0, W.options.h),
    vx: cos(angle) * .001,
    vy: sin(angle) * .001,
    m: 20,
    angle,
  }, W, {
    sensorAttempts: 3,
    sensorAngle: PI / randomGaussian(10, 2),
    sensorLength: width * boxLengthMult,
    sensorBoxSize: width * boxSizeMult,
    speed: 0.01,
    maxVel: 0.2,
    depositAmount: 10,
  });
}

function draw() {

  slimes.push(createSlime());
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
  if(frameCount % 17 === 1) {
    W.sumMap = W.createSumMap();
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
    const sensorAngle = randomGaussian(this.options.sensorAngle, this.options.sensorAngle * .05);
    const sensorLength = randomGaussian(this.options.sensorLength, this.options.sensorLength * .5);
    const sensorBoxSize = this.options.sensorBoxSize / 2;
    const worldW = this.world.options.w;
    const worldH = this.world.options.h;

    const offset = (sensorAttempts - 1) / 2;
    const sensed = shuffle(Array.from({ length: sensorAttempts }, (v, i) => {
      const angle = (i - offset) * sensorAngle + this.state.angle;
      const x = this.state.x + cos(angle) * sensorLength;
      const y = this.state.y + sin(angle) * sensorLength;

      const xTop = constrain(round(x + sensorBoxSize), 0, worldW - 1);
      const yTop = constrain(round(y + sensorBoxSize), 0, worldH - 1);
      const xBottom = constrain(round(x - sensorBoxSize), 0, worldW - 1);
      const yBottom = constrain(round(y - sensorBoxSize), 0, worldH - 1);

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

    const vel = pow(this.state.vx, 2) + pow(this.state.vy, 2);
    const amt = pow(vel / pow(this.options.maxVel, 2), 3);

    const col = lerpColors(colors, amt - randomGaussian(0, .1));

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
    loadPixels();
    const w = this.options.w;
    const h = this.options.h;
    const sumMap = Array.from({ length: w }, () => Array.from({ length: h }, () => 0));
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y ++) {
        const ul = safeGet(x-1, y-1, w, h, sumMap, 0);
        const u = safeGet(x, y-1, w, h, sumMap, 0);
        const l = safeGet(x-1, y, w, h, sumMap, 0);


        // index = 4 * ((y * d + j) * width * d + (x * d + i));
        // pixels[index] = r;
        // pixels[index+1] = g;
        // pixels[index+2] = b;
        // pixels[index+3] = a;

        // const mapColor = get(x,y) || color(0);
        // // print(mapColor)
        // const mapVal = red(mapColor) / 255 * alpha(mapColor) / 255
        const mapVal = getFromPixels(x,y);
        // print(mapVal)
        sumMap[x][y] = mapVal + u + l - ul;
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
    filter('BLUR', radius);
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
  const c = get(x,y);
  return (red(c) + green(c) + blue(c)) / (255 * 3);
  // const pd = pixelDensity()
  // const d = 1
  // index = 4 * ((y * pd + d) * width * pd + (x * pd + d));
  // return pixels[index] + pixels[index + 1] + pixels[index + 2];
}