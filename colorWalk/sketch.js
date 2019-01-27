let img;

let backgroundImg;
let backgroundGradient = {}


function preload() {
  backgroundImg = loadImage('http://localhost:3000/curve/starry.jpg');
}

function setup() {
  createCanvas(300, 200);
  backgroundImg.resize(width,height);

  img = createImage(width,height);
  img.loadPixels();

  let {
    Kx,
    Ky
  } = CreateSobelKernel(3);

  let backImgSmall = createImage(round(backgroundImg.width / 4), round(backgroundImg.height / 4));
  backImgSmall.copy(backgroundImg, 0, 0, backgroundImg.width, backgroundImg.height, 0,0, backImgSmall.width, backImgSmall.height);
  backImgSmall.filter('gray');
  backgroundGradient.x = convolveImage(backImgSmall, Kx);
  backgroundGradient.y = convolveImage(backImgSmall, Ky);
  backgroundGradient.x.resize(backgroundImg.width, backgroundImg.height);
  backgroundGradient.y.resize(backgroundImg.width, backgroundImg.height);
  backgroundGradient.x.filter('blur', 3);
  backgroundGradient.y.filter('blur', 3);
  // let gY = convolveImage(backgroundImg, Kx);
  // image(backgroundGradient.y, 0,0);

  createColorWalk(img, createFrontier(img), false)
}


function draw() {
  img.updatePixels();
  image(img, 0, 0);
}


function createFrontier(img) {
  const frontier = [{
    x: img.width / 2,
    y: img.height / 2,
    col: backgroundImg.get(img.width / 2,img.height / 2)
  }];
  const col1 = color(random(0,255),random(0,255),random(0,255));
  const col2 = color(random(0,255),random(0,255),random(0,255));

  // for(let i = 0; i < 1; i += 1 / 1) {
  //   for (let j = 0; j < 1; j += 1 / 1) {
  //     frontier.push({
  //       x: img.width * i,
  //       y: img.height * j,
  //       col: backgroundImg.get(img.width * i,img.height * j)
  //     })
  //   }
  // }
  frontier.forEach(p => img.set(p.x, p.y, p.col));
  return frontier;
}


function getNbors(p, img) {
  const nbors = [];
  for (let dx = -1 ; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const x = dx + p.x;
      const y = dy + p.y;
      if ((dx != 0 || dy != 0) && x >= 0 && x < img.width && y >= 0 && y < img.height) {
        nbors.push({ x,y })
      }
    }
  }
  return nbors;
}

function getPixelColor(p, img) {
  const c = img.get(p.x,p.y);
  if (alpha(c) === 0) {
    return undefined;
  }
  return c;
}

function modifyColor(c, p) {
  const center = [0,0,0];
  const stdDev = 2;


  const coloredNbors = getNbors(p, img).map(px => getPixelColor(px, img)).filter(col => col != undefined);
  coloredNbors.forEach(col => {
    center[0] += .01 * (red(col) - red(c));
    center[1] += .01 * (blue(col)  - blue(c));
    center[2] += .01 * (green(col) - green(c));
  })

  const backgroundCol = backgroundImg.get(p.x,p.y);
  const split = randomGaussian(.9, .01);
  const gaussianFn = (fn, cent) => {
    return (fn(c) + randomGaussian(cent, stdDev)) * split + (fn(backgroundCol)) * (1-split);
  }

  const r = constrain(gaussianFn(red, center[0]), 0, 255);
  const g = constrain(gaussianFn(green, center[1]), 0, 255);
  const b = constrain(gaussianFn(blue, center[2]), 0, 255);
  return color(r,g,b)
}

function processPixel(p, img) {
  const c = getPixelColor(p,img);
  const unProcessedNbors = getNbors(p, img).filter(px => getPixelColor(px, img) === undefined);
  unProcessedNbors.forEach(px => {
    img.set(px.x, px.y, modifyColor(c, px));
  });
  return shuffle(unProcessedNbors);
}

function getRandomPixelIndex(frontier) {
  // const index = random(frontier.length * .9975, frontier.length * .9999)
  // const index = random(0, frontier.length - 1);
  // const index = randomGaussian(frontier.length * .9, frontier.length * .1)
  // const index = randomGaussian(frontier.length / 2, 10)
  const index = randomGaussian(getByGradient(frontier, img), 10);
  return constrain(round(index), 0, frontier.length-1);
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
  }
  setInterval(() => {
    for (let i = 0; i < 100; i ++) {
      if(frontier.length) {
        processNextPixel(frontier, img)
    }
  }
  }, 5);
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