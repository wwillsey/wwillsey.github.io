/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let gui, img;



function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg('out', false);
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

function preload() {
  img = loadImage('../media/black and white.jpg');
}

function setup() {
  createCanvas(displayWidth, displayHeight);
  gui = new GUI();
  gui.add('rows', 4, 0, 100, 1).onChange(redraw);
  gui.add('cols', 4, 0, 100, 1).onChange(redraw);
  gui.add('size', 20, 0, 500).onChange(redraw);
  gui.add('xSep', gui.size + 5, 0, 500).onChange(redraw);
  gui.add('ySep', gui.size + 5, 0, 500).onChange(redraw);
  gui.add('minRowN', 3, 0, 500).onChange(redraw);
  gui.add('maxRowN', 10, 0, 500).onChange(redraw);
  gui.add('minColN', 3, 0, 500).onChange(redraw);
  gui.add('maxColN', 10, 0, 500).onChange(redraw);
  gui.add('noiseScale', .1, 0, 5, .001).onChange(redraw);
  gui.add('noiseOffset', 0, -1, 1, .001).onChange(redraw);
  gui.add('noisePow', 1, 0, 10, .001).onChange(redraw);
  gui.add('circlePow', 0, 0, 10, .001).onChange(redraw);
  gui.add('circleRad', 0, 0, 2, .001).onChange(redraw);
  // gui.add('r', 20, 0, 500).onChange(redraw);
  // gui.add('w', 20, 0, 500).onChange(redraw);
}

function draw() {
  noLoop();
  background(255);
  // const nLines = map(mouseX, 0, width, 1,100);
  // strokeWeight(map(mouseY, 0, height, 0,10))
  // drawLineCircle({x: width/2, y: height/2}, 100, nLines);
  for(let row = 0; row < gui.rows; row++){
    for(let col = 0; col < gui.cols; col++){
      const center = createVector(col * gui.xSep, row * gui.ySep);

      // let n = pow(noise(center.x * gui.noiseScale, center.y * gui.noiseScale), gui.noisePow) - gui.noiseOffset;



      let n = img.get(floor(col / gui.cols * img.width), floor(row / gui.rows * img.height));
      n = 1- (red(n) + green(n) + blue(n)) / 255 / 3;
      // print(n)

      const vR = ceil(map(n, 0, 1, gui.minRowN, gui.maxRowN));
      const vC = ceil(map(n, 0, 1, gui.minColN, gui.maxColN));
      // const vR = ceil(myMap(row, 0, gui.rows, gui.minRowN, gui.maxRowN));
      // const vC = myMap(col, 0, gui.cols, gui.minColN, gui.maxColN);

      drawLineRect(center, gui.size, gui.size, vR)
      drawLineCircle(center, gui.size/2 * pow(1 - (1-n)*gui.circleRad, gui.circlePow) , vC)
    }
  }
}


function drawLineCircle(c, r, nLines) {
  const w = 0
  for(let i = 0; i <= nLines; i++) {
    const y = i / nLines * r * 2 - r;
    const x = sqrt(r*r - y*y)
    if (x > 0) {
      line(c.x - x - w/2, c.y + y, c.x + x + w/2, c.y + y)
    }
  }
}

function drawLineRect(center, w, h, n) {
  for(let i = 0; i <= n; i++) {
    const p1 = createVector(w,0).mult(i/n).add(-w/2, -h/2).add(center);
    const p2 = p1.copy().add(0,h);
    line(p1.x, p1.y, p2.x, p2.y);
  }
}

function myMap(v, a1, a2, b1, b2) {
  const d = (v - a1) / (a2 - a1);
  return d * (b2-b1) + b1;
}