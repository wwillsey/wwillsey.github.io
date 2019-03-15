let img;
let canvas;
let backgroundImg;
let backgroundGradient = {}

const isHSB = true;
const maxColorVal = isHSB ? 100 : 255;
let stdDevs;
let data;


function preload() {
  backgroundImg = loadImage('http://localhost:3000/curve/starry.jpg');
}

function keyPressed() {
  switch (keyCode) {
    case ENTER:
      saveCanvas(canvas, 'colors', 'jpg');
      break
    case BACKSPACE:
      start();
  }
}

function start() {
  data = Array.from({length: height}, () => Array.from({length: width}, () => null));

  img = createImage(width,height);
  img.loadPixels();
  // colorMode(HSB, 100)

  let seed = round(random(0, 100000));
  seed = 94412;
  print('seed', seed);
  randomSeed(seed);

  stdDevs = Array.from({length: 3}, () => randomGaussian(1, 1));
  print('stddevs', stdDevs);

  createColorWalk(img, createFrontier(img), false);
}

function setup() {
  canvas = createCanvas(2880 / 2, 1800 / 2);
  start();
}

function draw() {
  background(20)
  img.updatePixels();
  image(img, 0, 0);
}

function getRandomPixelIndex(frontier) {
  // const index = 0;

  let index = random(frontier.length * .999, frontier.length * .99995)

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

function applyColor(x, y, col) {
  if (isHSB) {
    img.set(x,y, color(HSVtoRGB(...col)));

  } else {
    img.set(x,y, color(col))
  }
  // colorWithCircle(x,y,col);

  data[y][x] = col;
  // stroke(col);
  // point(x,y);
}


function createFrontier(img) {
  const frontier = [{
    x: img.width / 2,
    y: img.height / 2,
    col: [random(0, maxColorVal),random(0,maxColorVal),random(0,maxColorVal)]
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
  frontier.forEach(p => applyColor(p.x, p.y, p.col));
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
function modifyColor(c, p) {
  const center = [0,0,0];
  // if (random(0,1) > .99) {
  //   return color(20)
  // }


  // const fns = [hue, saturation, brightness];

  const coloredNbors = getNbors(p, img).map(px => getPixelColor(px, img)).filter(col => col != null);
  coloredNbors.forEach(col => {
    center[0] += .1 * ((col[0]) - (c[0]));
    center[1] += .1 * ((col[1])  - (c[1]));
    center[2] += .1 * ((col[2]) - (c[2]));
  })

  // const backgroundCol = backgroundImg.get(p.x,p.y);
  // const split = randomGaussian(.98, .01);
  const gaussianFn = (fn, cent, stdDev) => {
    // print(fn(c))
    return (fn(c) + randomGaussian(cent, stdDev))// * split + (fn(backgroundCol)) * (1-split);
  }


  // print(hue(c),  saturation(c), brightness(c))
  let r = constrain(gaussianFn(x => (x[0]), center[0], stdDevs[0]), 0, maxColorVal);
  let g = constrain(gaussianFn(x => (x[1]), center[1], stdDevs[1]), 0, maxColorVal)
  let b = constrain(gaussianFn(x => (x[2]), center[2], stdDevs[2]), 0, maxColorVal);
  // print(r,g,b)
  // const x = color(r,g,b);
  // print('c', color(c))
  // print('x', x)
  // step++;
  // if (step > 10)
    // remove()
  // const n = 255 / 20;
  // r = r  - r % n + n/2
  // g = g - g % n + n/2
  // b = b - b % n + n/2
  // print(r,g,b);
  return [r,g,b]
}

function processPixel(p, img) {
  const c = getPixelColor(p,img);
  const unProcessedNbors = getNbors(p, img).filter(px => !getPixelColor(px, img));
  unProcessedNbors.forEach(px => {
    applyColor(px.x, px.y, modifyColor(c, px));
  });
  return shuffle(unProcessedNbors);
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
