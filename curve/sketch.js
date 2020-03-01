let img;
let choiceFn;
let backgroundColor;
let gui;

let pD;
let looping = false;

function preload() {
  print('preload')
  // img = loadImage('https://upload.wikimedia.org/wikipedia/commons/5/52/Electricsheep-3404.jpg');
  // img = loadImage('https://i.pinimg.com/736x/bd/eb/10/bdeb10474d1d6e6c2d15ad7dcbe568a9.jpg');
  img = loadImage('./starry.jpg');
}

function keyPressed() {
  print('key', `'${key}'`, keyCode)
  switch(keyCode) {
    case ENTER:
      remove()
      break;
    case SHIFT:
      save();
      break
  }

  switch(key) {
    case ' ':
      looping = !looping;
      looping ? loop(): noLoop();
      break;
  }
}

function setup() {
  // randomSeed(0);
  choiceFn = 'MIN';
  backgroundColor = color(250);
  img.resize(displayWidth,0);

  img.loadPixels();
  createCanvas(img.width, img.height, SVG);

  gui = new GUI();
  gui.add('strokeWeight', 1, 0, 10);
  gui.add('alpha', 0, 0, 255);
  gui.add('curveScale', 20, 1, 100);
  gui.add('compares', 10, 1, 100);
  gui.add('samples', 10, 1, 100);

  print(img)
  background(backgroundColor)
  // image(img,0,0)
  pD = 1//img.pixelDensity(); // set these to the coordinates

  noLoop();
}

function draw() {
  // background(255, 255, 255,1)
  // image(img, 0,0);

  // drawCurveGrid(6, 1, img);

  for(let i = 0; i < 100; i++) {
    drawRandom(gui.compares, gui.samples);
  }


  // const frames = 400;
  // if (frameCount % frames === 0) {
  //   print('saving');
  //   saveCanvas(`output_${frameCount / frames}`, 'jpg');
  //   loadImageIndex(frameCount / frames);
  //   background(backgroundColor);
  // }
}

function loadImageIndex(i) {
  noLoop();
  let index;
  if (i < 10) {
    index = `0${i}`;
  } else {
    index = i;
  }
  const url =`http://localhost:3000/assets/frame_${index}_delay-0.05s.gif`;
  print('loading ', url);
  loadImage(url, (d) => {
    img = d;
    img.resize(width, height);
    loop();
  })
}

function drawRandom(n, samples) {
  const xs = width / max(randomGaussian(gui.curveScale, 3), .5);
  const ys = height / max(randomGaussian(gui.curveScale * width / height, 3), .5);
  const x = random(0, width / xs - 1);
  const y = random(0, height / ys - 1);

  const c = getRandomBestCurve(img, n, (x - 0.5) * xs, (x + 1.5) * xs, (y - 0.5) * ys, (y + 1.5) * ys);
  // print('best',c);
  const sample = sampleCurve(c.c, samples, img, 0, img.width, 0, img.height);
  const col = processSampleAve(sample, 5);
  if (col) {
    drawCurve(c.c, color(col[0],col[1],col[2],gui.alpha));
  }
}

function createNoiseImage(w,h, scale) {
  noiseSeed(0);
  noiseDetail(.5,10);
  const img = createImage(w,h);
  img.loadPixels();

  for(let y = 0; y < h; y++) {
    for(let x = 0; x < w; x++) {
      const p = (x / width + y / height) / 5;
      const colorVals = Array.from({length: 3}).map((v, i) => {
        return 255 * (.6 * pow(noise(x * scale, y * scale, i* 2), p) +
               .4 * pow(noise(x * scale * 3, y * scale * 3, i* 2), p))
      });
      img.set(x,y, color(...colorVals, 200));
    }
  }
  img.updatePixels();
  return img;
}



function drawCurveGrid(n, z, img) {
  const XS = width / n;
  const YS = width / n;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      for (let i = 0; i < z; i++) {

        const xs = XS / max(randomGaussian(3, 2), .5);
        const ys = YS / max(randomGaussian(3, 2), .5);
        const xi = random(x, XS / xs + x - 1);
        const yi = random(y, YS / ys + y - 1);

        const c = getRandomBestCurve(img, 50, (xi - 0.5) * xs, (xi + 1.5) * xs, (yi - 0.5) * ys, (yi + 1.5) * ys);
        // print('best',c);
        const sample = sampleCurve(c.c, 5, img, 0, img.width, 0, img.height);
        const col = processSampleAve(sample, 5);
        if (col) {
          drawCurve(c.c, color(col[0],col[1],col[2], gui.alpha));
        }
        // print(getBezierPts(c, 10))
      }
    }
  }
}

function processSampleMeanSq(samples, numSamples) {
  let mean = [0,0,0,0];
  let count = 0;
  let vals = [0,0,0,0];

  samples.forEach(c => {
    if (c) {
      count += 1;
      c.forEach((cv, i) => {
        mean[i] += cv;
      });
    }
  });

  mean = mean.map(v => v / count);
  samples.forEach(c => {
    if (c) {
      c.forEach((cv, i) => {
        vals[i] += pow(cv - mean[i], 2);
      });
    }
  });

  return  count < numSamples / 4 ? undefined : vals;
}

function processSampleAve(samples, numSamples) {
  let ave = [0,0,0,0];
  let count = 0;

  if(samples === undefined)
    return undefined;

  samples.forEach(c => {
    if (c) {
      count += 1;
      c.forEach((cv, i) => {
        ave[i] += cv;
      });
    }
  });

  return  count < numSamples / 4 ? undefined : ave.map(v => v / count);
}

function colorSq(c) {
  let sum = 0;
  c.forEach(cv => {
    sum += pow(cv, 2);
  });
  return sum;
}


function chooseMaxValueCurve(curveValues, maxFn) {
  let maxi = {
    value: Array.from({length: 4}).map(() => 0)
  }
  curveValues.forEach(cv => {
    if (cv.value !== undefined && colorSq(cv.value) > colorSq(mini.value)) {
      maxi = cv;
    }
  });

  return maxi;
}


function chooseMinValueCurve(curveValues, minFn) {
  let mini = {
    value: Array.from({length: 4}).map(() => 999999999999)
  }
  curveValues.forEach(cv => {
    if (cv.value !== undefined && colorSq(cv.value) < colorSq(mini.value)) {
      mini = cv;
    }
  });

  return mini;
}

function chooseBestCurve(curveValues, choiceFn) {
  switch (choiceFn) {
    case 'MIN':
      return chooseMinValueCurve(curveValues);
    case 'MAX':
      return chooseMaxValueCurve(curveValues);
    default:
      print('err');
  }
}


function getRandomBestCurve(img, n, xMin, xMax, yMin, yMax) {
  const curveValues = Array.from({
    length: n
  }).map(() => {
    const c = getRandomCurve(xMin, xMax, yMin, yMax);

    const numSamples = 10;
    const sampled = sampleCurve(c, numSamples, img, xMin, xMax, yMin, yMax);
		// print('sampled', sampled);
    return {
      c,
      value: processSampleMeanSq(sampled, numSamples)
    }
  });
  // print('curvevalues;',curveValues);
  return chooseBestCurve(curveValues, choiceFn);
}


function sampleCurve(c, steps, img, xMin, xMax, yMin, yMax) {
  // print('sampleCurve', c, getBezierPts(c, steps));
  if (c === undefined) {
    return undefined;
  }
  return getBezierPts(c, steps).map(({
    x,
    y
  }) => {
    x = round(x);
    y = round(y);
    const cx = constrain(x, xMin, xMax);
    const cy = constrain(y, yMin, yMax);
    return cx === x && cy === y ? imgGet(img, x, y) : undefined;
  });
}

function getBezierPts(c, steps) {
  return Array.from({
    length: steps + 1
  }).map((v, i) => ({
    x: bezierPoint(c.x1, c.x2, c.x3, c.x4, i / steps),
    y: bezierPoint(c.y1, c.y2, c.y3, c.y4, i / steps),
  }));
}

function drawCurve(c, col) {
  let {
  x1,
  y1,
  x2,
  y2,
  x3,
  y3,
  x4,
  y4
} = c;

  strokeWeight(gui.strokeWeight);
  noFill();
  if(col) {
    stroke(col);
  } else {
    stroke(10, 10, 10, gui.alpha);
  }
  bezier(x1, y1, x2, y2, x3, y3, x4, y4);
  // fill(255);
}


function getRandomCurve(xMin, xMax, yMin, yMax) {
  const c = Array.from({
    length: 4
  }).map(() => ({
    x: random(xMin, xMax),
    y: random(yMin, yMax)
  }));

  return {
    x1: c[0].x,
    x2: c[1].x,
    x3: c[2].x,
    x4: c[3].x,
    y1: c[0].y,
    y2: c[1].y,
    y3: c[2].y,
    y4: c[3].y,
  };
}

function imgGet(img, x,y) {
  // return img.get(x,y)
  let off = (y * img.width + x) * pD * 4;
  // print('ahhh', x,y, off);
  let components = [
    img.pixels[off],
    img.pixels[off + 1],
    img.pixels[off + 2],
    img.pixels[off + 3]
  ];
  // print(c1,c2);
  return components;
}