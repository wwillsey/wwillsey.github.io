let img;
let canvas;
let backgroundImg;
let backgroundGradient = {}

const isHSB = false;
const backgroundEnabled = true;
const useBackgroundSourceImage = true;
const maxColorVal = isHSB ? 100 : 255;
const backgroundSplitMean = .993;
const backgroundSplitVariance = .1;
const nborWeight = .1;
const shuffleIn = true;

const useDepth = false;
const depthScale = 1000;
const maxDepth = 0;

const backgroundNegative = true;
let wipeScreen = true;

const scale = 1.5
const useDisplayDimensions = true;
const isGreyscale = false;


let stdDevs;
const stdDevFn = () => randomGaussian(5, 0.01)
let data;


let numRuns = 0;
let seed;

function preload() {
  // backgroundImg = loadImage('http://localhost:3000/curve/starry.jpg');
  backgroundImg = loadImage('http://localhost:3000/colorWalk/cloudy.jpeg');

}


// function mousePressed() {
//   if(focused)
//     start(mouseX, mouseY);
// }

function keyPressed() {
  switch (keyCode) {
    case ENTER:
      saveCanvas(canvas, 'colors', 'jpg');
      break
    case BACKSPACE:
      randomSeed(Date.now())
      seed = random(0, 10000);
    case SHIFT:
      start();
      break;
    case TAB:
      randomSeed(Date.now())
      seed = random(0, 10000);
      backgroundImg = createImage(width,height);
      backgroundImg.loadPixels();
      numRuns = 0;
      start();
  }
}

function start(xPos, yPos) {
  numRuns++;

  data = Array.from({length: height}, () => Array.from({length: width}, () => null));

  // if (wipeScreen || numRuns === 1) {
    img = createImage(width,height);
    img.loadPixels();
  // }
  // colorMode(HSB, 100)

  // if (backgroundNegative && numRuns === 1)
    // negateImage(backgroundImg)

  // seed = 94412;
  print('seed', seed);
  randomSeed(seed);

  stdDevs = Array.from({length: 3}, stdDevFn);
  print('stddevs', stdDevs);

  setTimeout(() => createColorWalk(img, createFrontier(img, xPos, yPos), false), 200);
}

function setup() {
  canvas = useDisplayDimensions ?
    createCanvas(displayWidth, displayHeight) :
    createCanvas(2880 * scale, 1800 * scale);

  backgroundImg.resize(width, height)
  seed = round(random(0, 100000));
  start();
}

function draw() {
  background(0)
  img.updatePixels();
  if (isGreyscale)
    img.filter(GRAY);
  image(img, 0, 0);
}

function getRandomPixelIndex(frontier) {
  // const index = 0;

  let index = random(frontier.length * .998, frontier.length * .99995)

  // const index = random(0, frontier.length - 1);
  // const index = randomGaussian(frontier.length * .95, frontier.length * .1)
  // const index = randomGaussian(frontier.length / 2, 200)
  // const index = randomGaussian(getByGradient(frontier, img), 10);

  return constrain(round(index), 0, frontier.length-1);
}


function killInTime(x,y, ms) {
  setTimeout(() => {
    if (random() >= .0) {
      img.set(x,y, color(0,0,0,0));
    } else {
      killInTime(x,y, randomGaussian(1000, 500))
    }
  }, ms);
}



function colorWithCircle(x, y, col) {
  fill(red(col), blue(col), green(col), 100);
  ellipse(x,y, abs(randomGaussian(5, 2)))
};

function applyColor(x, y, d) {
  const col = d.col;
  const depth = d.depth || 0;

  if (isHSB) {
    img.set(x,y, color(HSVtoRGB(...col)));
    backgroundImg.set(x,y, color(HSVtoRGB(...col)));
  } else {
    img.set(x,y, color(col))
    backgroundImg.set(x,y, color(col))
  }
  // colorWithCircle(x,y,col);

  data[y][x] = {col, depth};
  // stroke(col);
  // point(x,y);
}


function createFrontier(img, xPos, yPos) {
  const frontier = [{
    x: xPos || img.width / 2,
    y: yPos || img.height / 2,
    col: [random(0, maxColorVal),random(0, maxColorVal),random(0, maxColorVal)]
  }];

  // const col1 = color(random(0,255),random(0,255),random(0,255));
  // const col2 = color(random(0,255),random(0,255),random(0,255));

  // for(let i = 0; i < 1; i += 1 / 4) {
  //   for (let j = 0; j < 1; j += 1 / 4) {
  //     frontier.push({
  //       x: img.width * i,
  //       y: img.height * j,
  //       col: color(random(0,255),random(0,255),random(0,255))//backgroundImg.get(img.width * i,img.height * j)
  //     })
  //   }
  // }
  frontier.forEach(p => applyColor(p.x, p.y, { col: p.col }));
  print('startcol: ', frontier[0].col);
  return frontier;
}


function getNbors(p, img) {
  const nbors = [];
  for (let dx = -1 ; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const x = dx + p.x;
      const y = dy + p.y;
      if ((dx != 0 || dy != 0) && x >= 0 && x < img.width && y >= 0 && y < img.height) {
        if (dist(x,y, img.width/2, img.height/2) < img.height * .45)
        nbors.push({ x,y })
      }
    }
  }
  return nbors;
}

function getPixelColor(p, img) {
  const c = data[p.y][p.x];
  // if (!c) {
  //   return undefined;
  // }
  // print('img c:', color(c))
  return c;
}


let step = 0;
function modifyColor(d, p) {
  const center = [0,0,0];
  const c = d.col;
  const depth = d.depth;
  // if (random(0,1) > .99) {
  //   return color(20)
  // }


  // const fns = [hue, saturation, brightness];

  const coloredNbors = getNbors(p, img).map(px => getPixelColor(px, img)).filter(col => col != null);
  coloredNbors.forEach(col => {
    center[0] += nborWeight * ((col.col[0]) - (c[0]));
    center[1] += nborWeight * ((col.col[1])  - (c[1]));
    center[2] += nborWeight * ((col.col[2]) - (c[2]));
  })

  // const coloredBackgroundNbors = getNbors(p, backgroundImg).map(px => getPixelColor(px, backgroundImg)).filter(col => col != null);
  // coloredBackgroundNbors.forEach(col => {
  //   center[0] += nborWeight * ((col[0]) - (c[0]));
  //   center[1] += nborWeight * ((col[1])  - (c[1]));
  //   center[2] += nborWeight * ((col[2]) - (c[2]));
  // })


 /// -1        0         1


  let backgroundCol;
  let split;

  const useBackgroundData = backgroundEnabled && (useBackgroundSourceImage || ! (numRuns === 1));

  if (useBackgroundData) {
    backgroundCol = backgroundImg.get(p.x,p.y);
    split = randomGaussian(backgroundSplitMean, backgroundSplitVariance);
  }

  const gaussianFn = (fn, cent, stdDev) => {
    return useBackgroundData ?
      (fn(c) + randomGaussian(cent, stdDev)) * split + (fn(backgroundCol)) * (1 - split) :
      (fn(c) + randomGaussian(cent, stdDev));
  }


  // print(hue(c),  saturation(c), brightness(c))
  let r = constrain(gaussianFn(x => (x[0]), center[0], stdDevs[0]), 0, maxColorVal);
  let g = constrain(gaussianFn(x => (x[1]), center[1], stdDevs[1]), 0, maxColorVal)
  let b = constrain(gaussianFn(x => (x[2]), center[2], stdDevs[2]), 0, maxColorVal);

  if (useDepth) {
    const distanceFactor = (.45 * height - dist(p.x, p.y, width/2, height/2)) / (.45 * height);
    r += depth / depthScale * distanceFactor;
    g += depth / depthScale * distanceFactor;
    b += depth / depthScale * distanceFactor;
  }


  return {col: [r,g,b], depth: depth + 1};
}

function processPixel(p, img) {
  const c = getPixelColor(p,img);
  let unProcessedNbors = getNbors(p, img).filter(px => !getPixelColor(px, img));
  unProcessedNbors.forEach(px => {
    applyColor(px.x, px.y, modifyColor(c, px));
  });

  if(maxDepth)
    unProcessedNbors = unProcessedNbors.filter(px => getPixelColor(px).depth < maxDepth);

  if (shuffleIn)
    return shuffle(unProcessedNbors);

  return unProcessedNbors;
}

function processNextPixel(frontier, img) {
  const indx = getRandomPixelIndex(frontier);
  const p = frontier.splice(indx, 1)[0];
  processPixel(p, img).forEach(p => frontier.push(p));
}


function createColorWalk(img, frontier, hard = false) {

  if (hard) {
    while(frontier.length) {
      processNextPixel(frontier, img)
    }
    img.updatePixels()
    image(img, 0, 0)
  }
  setInterval(() => {
    for (let i = 0; i < 2000; i ++) {
      if(frontier.length) {
        processNextPixel(frontier, img)
    }
  }
  }, 10);
}


function getByGradient(frontier, img) {
  let indx = 0;
  let val = getGradientAt(frontier[0], img);
  val = dist(0,0, val.x, val.y);

  frontier.forEach((p,i) => {
    const {x,y} = getGradientAt(p, img);
    const d = dist(0,0, x, y);

    if (d > val) {
      val = d;
      indx = i;
    }
  });

  return indx;
}

function getGradientAt(p, img) {
  const x = round(p.x / img.width * backgroundGradient.x.width);
  const y = round(p.y / img.height * backgroundGradient.x.height);

  return {
    x: red(backgroundGradient.x.get(x,y)),
    y: red(backgroundGradient.y.get(x,y))
  }
}





function convolveImage(img, matrix) {
  let newImage = createImage(img.width, img.height);
  newImage.loadPixels();

  for (let x = 0; x < img.width; x++) {
    for (let y = 0; y < img.height; y++) {
      let c = convolution(x, y, matrix, img, 255 / 2, 3);
      // print(c);
      newImage.set(x, y, color(c));
    }
  }
  newImage.updatePixels();
  return newImage;
}


function convolution(x, y, matrix, img, offset, channels = 1) {
  let vTotal = channels === 1 ? 0 : Array.from({
    length: channels
  }).map(() => 0);
  const mlenX = matrix[0].length;
  const mlenY = matrix.length;
  for (let i = 0; i < mlenX; i++) {
    for (let j = 0; j < mlenY; j++) {
      // What pixel are we testing
      let xloc = constrain(x + i - round(mlenX / 2), 0, img.width - 1);
      let yloc = constrain(y + j - round(mlenY / 2), 0, img.height - 1);

      let col = img.get(xloc, yloc);//img[yloc][xloc];
      let vals = [red(col), blue(col), green(col)];
      if (channels === 1) {
        vTotal += vals * matrix[j][i];
      } else {
        vals.forEach((v, idx) => {
          vTotal[idx] += v * matrix[j][i]
        });
      }
    }
  }
  // Return the resulting val
  return vTotal;
}


function CreateSobelKernel(n) {

  let Kx = Array.from({
    length: n
  }).map(() => Array.from({
    length: n
  }));
  let Ky = Array.from({
    length: n
  }).map(() => Array.from({
    length: n
  }));

  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      let i = x - floor(n / 2);
      let j = y - floor(n / 2);
      if (i !== 0 || j !== 0) {
        Ky[y][x] = i / (i * i + j * j);
        Kx[y][x] = j / (i * i + j * j);
      } else {
        Kx[y][x] = 0;
        Ky[y][x] = 0;
      }
    }
  }

  return {
    Ky: Kx,
    Kx: Ky
  };
}



/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR
 * h, s, v
*/
function HSVtoRGB(h, s, v) {
  h /= 100;
  s /= 100;
  v /= 100;
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
      s = h.s, v = h.v, h = h.h;
  }
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
  }
  return [r * 255, g * 255, b * 255]
}


function negateImage(i) {
  for(let y =0 ; y < img.height; y++) {
    for(let x = 0; x < img.width; x++) {
      const c = img.get(x,y);
      img.set(x,y, color(255 - red(c), 255 - green(c), 255 - blue(c)));
    }
  }
  img.updatePixels();
}