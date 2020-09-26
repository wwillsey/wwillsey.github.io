/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let gui;
let field;
let fieldPre, reducer, img, balls;
let mini = 0;
let maxi = 0;

p5.disableFriendlyErrors = true;

function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg('out');
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

// function preload() {
//   img = loadImage("../curve/face2.jpg")
// }

function setup() {
  createCanvas(displayHeight, displayHeight, SVG);//displayHeight);
  gui = new GUI();
  // img.loadPixels()

  gui.add("rows", 10, 0, 1000, 1).onChange(updateField);
  gui.add("cols", 10, 0, 1000, 1).onChange(updateField);
  gui.add("noiseScale", 1, 0, 10, .001).onChange(updateField);
  gui.add("noiseOffset", 0, -1, 1, .00001).onChange(updateField);
  gui.add("noiseRotate", 0, 0, PI, .001).onChange(updateField);
  gui.add("octaves", 4, 0, 10, 1).onChange(updateField);
  gui.add("falloff", .5, 0, 10, .001).onChange(updateField);
  gui.add("noiseT", 0, 0, 10, .001).onChange(updateField);
  gui.add("isoLines", 10, 0, 200, 1).onChange(redraw);
  gui.add("isoMin", 0, 0, 1, .001).onChange(redraw);
  gui.add("isoMax", 1, 0, 1, .001).onChange(redraw);
  gui.add("simplify", 0, 0, 1, .001).onChange(redraw);
  gui.add("nBalls", 1, 0, 1000, 1).onChange(updateField);
  gui.add("threshold", 1, 0, 2, .000001).onChange(updateField);
  gui.add("pow", .5, 0, 5, .000001).onChange(updateField);
  gui.add("pathMinLength", 0, 0, 1000, 1).onChange(redraw);
  gui.add("m", 0, 0, 10, .00001).onChange(updateField);
  gui.add("v1", 0, -2, 2, .00001).onChange(updateField);
  gui.add("v2", 0, -2, 2, .00001).onChange(updateField);
  gui.add("stroke", 255, 0, 255, 1).onChange(updateField);
  gui.add("normalize", false).onChange(updateField);

  updateField();
  noLoop();

}


function draw() {


  reducer = new LineReducer({
    modBy: 1,
    nFixed: 5,
  });
  clear()
  print(field)
  const contourLines = Array.from({length: gui.isoLines}, (v, i) => map(i, 0, gui.isoLines, gui.isoMin, gui.isoMax));
  const lines = MarchingSquaresJS.isoLines(fieldPre, contourLines, {
    noFrame: true,
    verbose: true,
  });

  lines.forEach(setOfLines => {
    setOfLines.forEach(renderPath)
  })

  reducer.reduce();
  reducer.render();
}

function renderPath(path) {
  stroke(0, gui.stroke);
  strokeWeight(1);
  noFill();

  if(path.length < gui.pathMinLength) {
    return;
  }
  let hasCorner = false;
  path = path.map(([x, y]) => {
    if ((x < 1 && y < 1) || (x >= gui.cols-1 && y >= gui.rows - 1)) {
      hasCorner = true;
    }
    return {x,y}
  });
  if (hasCorner) return;
  // print('path length before simplify', path.length)
  if(gui.simplify) {
    path = simplify(path, gui.simplify)
  }
  // print('path length after simplify', path.length)

  const getPos = ({x,y}) => ({
    x: x / gui.cols * width,
    y: y / gui.rows * height,
  });


  // const first = getPos(path[0]);
  // curveVertex(first.x, first.y);
  beginShape()
  path.forEach((pt, i) => {
    // if (i == 0) return
    // const pos2 = getPos(path[i - 1]);
    const pos = getPos(pt);
    vertex(pos.x, pos.y);
    // line(pos2.x, pos2.y, pos.x, pos.y);
    // reducer.add(pos2.x, pos2.y, pos.x, pos.y);
  })
  // const last = getPos(path[path.length-1]);
  // curveVertex(last.x, last.y)

  endShape();
}

function updateField() {

  randomSeed(0)
  balls = Array.from({length: gui.nBalls}, () => ({
    x: random(0, 1),
    y: random(0, 1),
    m: random(.001, gui.m),
  }))

  // print(balls)
  noiseDetail(gui.octaves, gui.falloff);

  field = generateField(gui.rows, gui.cols, (x,y) => withMetaballs(x,y) * gui.v1 + noiseField(x,y) * gui.v2);
  // field = generateField(gui.rows, gui.cols, (x,y) => fromImage(x,y));
  fieldPre = new MarchingSquaresJS.QuadTree(field);
  redraw();
}


function withMetaballs(x,y) {
  let sum = 0;
  balls.forEach(ball => {
    sum += ball.m / pow(((x - ball.x)**2 + (y - ball.y)**2), gui.threshold);
  });
  return pow(sum * .001, gui.pow) //sum > gui.threshold ? 1 : 0;
}


function noiseFromCenter(x,y) {
  return noise(gui.noiseScale * sqrt((x - .5)**2 + (y-.5)**2))
}

function noiseField(x, y) {
  let z = gui.noiseT;
  let q = gui.noiseRotate;
  x = z*sin(q) + x*cos(q)
  z = z*cos(q) - x*sin(q)


  return noise(gui.noiseScale * x, gui.noiseScale * y, z) + gui.noiseOffset;
  // return noise(gui.noiseScale * x, gui.noiseScale * y, z) + gui.noiseOffset;
  // const xp = noise(gui.noiseScale * x, 10000, z) + gui.noiseOffset;
  // const yp = noise(10000, gui.noiseScale * y, z) + gui.noiseOffset;
  // return noise(xp, yp)

}

function fromImage(x,y) {
  const col = imgGet(img, floor(y * img.height), floor(x*img.width))
  // print(col)
  return ((col[0] + col[1] + col[2]) / (3 * 255)) || 0
}

function generateField(rows, cols, fn) {
  mini = 9999999999
  maxi = -9999999999

  let arr = Array.from({length: cols + 1}, (v, x) => Array.from({length: rows + 1}, (v2, y) => {
    let res = fn(x / cols, y / rows);
    if (res > maxi) {
      maxi = res;
    }
    if (res < mini) {
      mini = res;
    }
    return res
  }))

  if (gui.normalize) {
    for (let x = 0; x < arr.length; x++) {
      for (let y = 0; y < arr[0].length; y++) {
        arr[x][y] = map(arr[x][y], mini, maxi, 0, 1);
      }
    }
  }
  return arr;
}

function imgGet(img, x,y) { // set these to the coordinates
  let off = (y * img.width + x) * 4;
  let components = [
    img.pixels[off],
    img.pixels[off + 1],
    img.pixels[off + 2],
    img.pixels[off + 3]
  ];
  return components;
}