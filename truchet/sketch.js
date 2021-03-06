let t1, t2;
let T;
let gui;

let c1,c2;


let tWidth;
let tHeight;

const squareTiles = true;

const strokeWeight = 2;
let strokeCol;

const noiseSpeed = .1;

let noiseOffset = { x: 0, y: 0, time: 0 };



function preload() {
  allColors = loadImage('http://localhost:3000/truchet/allColors.jpg')
}
function setup() {
  createCanvas(displayWidth, displayHeight);
  // allColors.tint(255, opacity)

  c1 = color(247, 0, 169);
  c2 = color(0, 247, 78);

  gui = new myGUI();
  gui.add("rows", 50, 0, 500, 1)
  gui.add("cols", 50, 0, 500, 1)
  gui.add("noiseScale", .25, 0, 1, .00001);
  gui.add("tWidthScale", .5, 0, 1, .00001);

  // start();
}

function draw() {
  // background(255);
  clear()
  handleKeys();

  const x = map(mouseX, 0, width, 0, allColors.width);
  const y = map(mouseY, 0, height, 0, allColors.height);

  c1 = color(255,0)//allColors.get(x,allColors.height / 2);
  c2 = color(255,0)//allColors.get(y,allColors.height / 2);

  tWidth = width / gui.cols;
  tHeight = height / gui.rows;

  strokeCol = color(0)//color(113, 0, 194)

  const m = max(tWidth, tHeight);
  if (squareTiles) {
    tWidth = max(tWidth, m);
    tHeight = max(tHeight, m);
  }

  start();

}


function start() {
  const tiles = [
    Tile.createFromFunction(tile => fromCircle2(tile, tWidth * gui.tWidthScale), tWidth, tHeight),
    Tile.createFromFunction(tile => fromCircle1(tile, tWidth * gui.tWidthScale), tWidth, tHeight),
    Tile.createFromFunction(tile => fromPlus1(tile, tWidth * gui.tWidthScale), tWidth, tHeight),
    Tile.createFromFunction(tile => fromPlus2(tile, tWidth * gui.tWidthScale), tWidth, tHeight),
    Tile.createFromFunction(tile => fromCircle1(tile, tWidth * gui.tWidthScale), tWidth, tHeight),
    Tile.createFromFunction(tile => fromCircle2(tile, tWidth * gui.tWidthScale), tWidth, tHeight),

  ];


  T = new TruchetTiles(tiles, width / tWidth , height / tHeight);
  T.render();
}

function handleKeys() {
  if (keyIsDown(LEFT_ARROW)) {
    noiseOffset.x += noiseSpeed;
  }

  if (keyIsDown(RIGHT_ARROW)) {
    noiseOffset.x -= noiseSpeed;
  }

  if (keyIsDown(UP_ARROW)) {
    noiseOffset.y += noiseSpeed;
  }

  if (keyIsDown(DOWN_ARROW)) {
    noiseOffset.y -= noiseSpeed;
  }

  if (keyIsDown(ENTER)) {
    noiseOffset.time += noiseSpeed;
  }
}




function drawCircleCorner(tile, w, x, y) {
  // tile.canvas.fill(c1);
  // tile.canvas.ellipse(x,y, (tile.width  + 3 *w));
  // tile.canvas.fill(c2);
  // tile.canvas.ellipse(x, y, (tile.width - 2 * w));

  tile.canvas.strokeWeight(strokeWeight)
  // tile.canvas.stroke(c2)
  tile.canvas.stroke(strokeCol);
  // tile.canvas.noStroke();

  tile.canvas.fill(c1);
  tile.canvas.ellipse(x,y, (tile.width  + w));
  tile.canvas.fill(c2);
  tile.canvas.ellipse(x, y, (tile.width - w));

  // tile.canvas.fill(c1);
  // tile.canvas.ellipse(x,y, (tile.width  - 2 * w));
  // tile.canvas.fill(c2);
  // tile.canvas.ellipse(x, y, (tile.width - 3 * w));
}


function fromCircle1(tile, w) {
  tile.canvas.background(c2);

  drawCircleCorner(tile, w, 0, 0);
  drawCircleCorner(tile, w, tile.width, tile.height);
}


function fromCircle2(tile, w) {
  tile.canvas.background(c2);

  drawCircleCorner(tile, w,  tile.width, 0);
  drawCircleCorner(tile, w , 0, tile.height);
}

function fromPlus1(tile, w) {
  tile.canvas.background(c2);

  tile.canvas.fill(c1);
  tile.canvas.strokeWeight(strokeWeight)
  // tile.canvas.stroke(c2)
  tile.canvas.stroke(strokeCol)

  const offset = 5 * strokeWeight;
  tile.canvas.rect((tile.width - w) / 2, -offset, w, tile.height + 2 * offset);
  tile.canvas.rect(-offset, (tile.height - w) / 2, tile.width + 2 * offset, w);
}

function fromPlus2(tile, w) {
  tile.canvas.background(c2);

  tile.canvas.fill(c1);
  tile.canvas.strokeWeight(strokeWeight)
  // tile.canvas.stroke(c2)
  tile.canvas.stroke(strokeCol)

  const offset = 5 * strokeWeight;
  tile.canvas.rect(-offset, (tile.height - w) / 2, tile.width + 2 * offset, w);
  tile.canvas.rect((tile.width - w) / 2, -offset, w, tile.height + 2 * offset);
}


class Tile {
  constructor(w,h) {
    this.width = w;
    this.height = h || w;
    this.canvas = createGraphics(this.width, this.height);
  }

  render(x, y) {
    image(this.canvas, x, y);
  }

  static createFromImage(img, w, h) {
    img.resize(w,h);

    const tile = new Tile(w,h);
    tile.canvas.image(img, 0, 0);

    // print(tile.canvas);

    return tile;
  }

  static createFromFunction(fn, w, h) {
    const tile = new Tile(w,h);
    fn(tile);
    return tile;
  }
}


class TruchetTiles {
  constructor(tiles, w, h) {
    this.tiles = tiles;
    this.w = w;
    this.h = h;
  }

  chooseTile(x, y) {
    // const index = constrain(round(randomGaussian(.7, .2)), 0, 1);
    const scale = this.tiles.length;
    const index = constrain(floor(scale * pow(noise(x * gui.noiseScale + noiseOffset.x, y * gui.noiseScale + noiseOffset.y, noiseOffset.time), 1)), 0, this.tiles.length - 1);
    // print(index);
    return this.tiles[index];
  }

  render() {
    for (let x = 0; x < this.w; x++) {
      for (let y = 0; y < this.h; y++) {
        const tile = this.chooseTile(x,y);

        const xPos = x * tile.width;
        const yPos = y * tile.height;

        tile.render(xPos, yPos);
      }
    }
  }
}