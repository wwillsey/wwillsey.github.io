/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let img, originalImg;
let d, gui;

function preload() {
  originalImg = loadImage('../curve/starry.jpg');
}

function keyPressed() {
  switch (keyCode) {
    case ALT:
      save('out.svg');
      break;
    default:
      break;
  }
}


function setup() {
  createCanvas(displayWidth, displayHeight, SVG);

  d = 1
  // print(`image resolution: ${img.width} : ${img.height}`);
  // pixelateImage(img, {x: floor(img.width/20), y: floor(img.height/20)}, RectangleRGB);

  gui = new GUI();
  gui.add('size', .05, 0, .2).onFinishChange(updateImage);
  gui.add('dotSize', .5, 0, 1).onFinishChange(redraw);
  gui.add('dotSpread', .1, 0, 1).onFinishChange(redraw);
  gui.add('dotRotateOffset', 45, 0, 360).onFinishChange(redraw);
  gui.add('nColors', 100, 1, 255).onFinishChange(redraw);
  gui.add('strokeWeight', 1, 0, 10).onFinishChange(redraw);
  gui.add('dotDivBy', 75, 1, 200).onFinishChange(redraw);

  // noStroke();
  noFill();
  noLoop();
  updateImage();
}

function updateImage() {
  img = imageCopy(originalImg);
  const newSize = {x: round(img.width * gui.size), y: round(img.height * gui.size)};
  img.resize(newSize.x, newSize.y);
  img.loadPixels();
  redraw();
}


function draw() {
  blendMode(REPLACE)
  background(255);
  strokeWeight(gui.strokeWeight)

  // blendMode(ADD);
  pixelateImage(img, createVector(100,0), createVector(height / img.height, height/img.height));

  // if(frameCount > 1)
  // noLoop();
}

function imgGet(img, x,y) { // set these to the coordinates
  let off = (y * img.width + x) * d * 4;
  let components = [
    img.pixels[off],
    img.pixels[off + 1],
    img.pixels[off + 2],
    img.pixels[off + 3]
  ];
  return components;
}

function pixelateImage(img, offsets, size) {
  for(let y = 0; y < img.height; y++) {
    for(let x = 0; x < img.width; x++) {
      const c = imgGet(img, x,y);
      // print(x, y,c)
      const center = createVector((x + .5) * size.x + offsets.x, (y + .5) * size.y + offsets.y);
      new DotsRGB(c, center, size).render();
    }
  }
}

class PixelSVG {
  constructor(color, center, size) {
    this.center = center;
    this.size = size;
    this.color = color;
  }
}

class RectangleRGB extends PixelSVG {
  render() {
    const w = this.size.x / 3;
    const h = this.size.y;
    fill(this.color[0], 0,0);
    rect(this.center.x - w * 1.5, this.center.y - h/2, w, h);
    fill(0, this.color[1], 0);
    rect(this.center.x - w * .5, this.center.y - h/2, w, h);
    fill(0,0,this.color[2]);
    rect(this.center.x + w * .5, this.center.y - h/2, w, h);
  }
}

class DotsRGB extends PixelSVG {
  getSize(intensity, maxSize) {
    intensity *= 255;
    return (intensity - (intensity % (255 / round(gui.nColors)))) / 255 * maxSize;
  }

  getDotSizes(amt) {
    amt /= gui.dotDivBy;
    if (amt > .8) {
      return [.2, .4, .6, .8, 1]
    } else if (amt > .6) {
      return [.2, .6, .8]
    } else if (amt > .4) {
      return [.2, .8]
    } else if (amt > .2) {
      return [.4]
    } else {
      return [.2];
    }
  }

  render() {
    const r = this.size.x * gui.dotSize;
    const w = this.size.x;
    const h = this.size.y;

    const pt = createVector(w * gui.dotSpread);


    const [red,green,blue,alpha] = this.color;

    const {c, m, y} = rgb2cmyk(red, green, blue, false);

    // print({c,m,y})


    // stroke(color('cyan'));
    // // let d = this.getSize(c, r * 2);
    // pt.rotate(gui.dotRotateOffset / 360 * TWO_PI);
    // this.getDotSizes(this.getSize(c, 1)).forEach(d => {
    //   ellipse(this.center.x + pt.x, this.center.y + pt.y, d*r*2,d*r*2);
    // })

    // stroke(color('magenta'));
    // // d = this.getSize(m, r * 2);
    // pt.rotate(TWO_PI / 3);
    // this.getDotSizes(this.getSize(m, 1)).forEach(d => {
    //   ellipse(this.center.x + pt.x, this.center.y + pt.y, d*r*2,d*r*2);
    // })

    stroke(color('yellow'));
    // d = this.getSize(y, r * 2);
    pt.rotate(TWO_PI / 3);
    this.getDotSizes(this.getSize(y, 1)).forEach(d => {
      ellipse(this.center.x + pt.x, this.center.y + pt.y, d*r*2,d*r*2);
    })

  }
}


var rgb2cmyk = function(r, g, b, normalized){
  var c = 1 - (r / 255);
  var m = 1 - (g / 255);
  var y = 1 - (b / 255);
  var k = Math.min(c, Math.min(m, y));

  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);

  if(!normalized){
      c = Math.round(c * 10000) / 100;
      m = Math.round(m * 10000) / 100;
      y = Math.round(y * 10000) / 100;
      k = Math.round(k * 10000) / 100;
  }

  c = isNaN(c) ? 0 : c;
  m = isNaN(m) ? 0 : m;
  y = isNaN(y) ? 0 : y;
  k = isNaN(k) ? 0 : k;

  return {
      c: c,
      m: m,
      y: y,
      k: k
  }
}