/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let gui;

let board;
let img;


function preload() {
  img = loadImage("../media/7524_21.jpg")
}
function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg('out');
      break;
    case SHIFT:
      init();
      // noLoop();
      break;
    case ENTER:
      redraw();
      // noLoop();
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(displayWidth, displayHeight);
  gui = new GUI();
  randomSeed(1)
  img.loadPixels();

  gui.add("nIters", 2, 0, 500, 1).onFinishChange(init);
  gui.add("nPegs", 1000, 0, 10000, 1).onFinishChange(init);
  gui.add("pegSize", 3, 0, 1000).onFinishChange(init);
  gui.add("strokeWeight", 1, 0, 20).onFinishChange(init);
  gui.add("spiralA", 1, 0, 20).onFinishChange(init);
  gui.add("spiralB", .4, 0, 20).onFinishChange(init);
  gui.add("spiralSteps", 20, 0, 10000,1).onFinishChange(init);
  gui.add("wrapAmt", 40, 0, 500).onFinishChange(init);
  gui.add("wrapVariance", .3, 0, 2).onFinishChange(init);
  gui.add("renderPegs", true).onFinishChange(init);
  gui.add("renderFirstLeg", false).onFinishChange(init);
  gui.add("imgThreshBlur", 0, 0, 1).onFinishChange(init);
  gui.add("imgThresh", .5, 0, 1).onFinishChange(init);
  gui.add("arrangeFn", 0, 0, 2, 1).onFinishChange(init);
  gui.add("renderMirror", false).onFinishChange(init);
  init()
  noLoop();
}


function mouseClicked() {
  // board.pegs.push(new Peg(
  //   createVector(mouseX, mouseY),
  //   gui.pegSize
  // ))

  const p = new PegPath(
    createVector(mouseX, mouseY),
    {
      name: "free"
    },
    board);
  for(let i = 0; i < gui.nIters; i++) {
    p.update()

  }
  board.paths.push(
    p
  );
  //print(board)
  redraw()
}


function draw() {
  clear()
  board.updatePaths(gui.nIters);
  board.render();
}


function init() {
  clear();
  board = new PegBoard()
  board.arrange(gui.nPegs);
  redraw();
}

function pos2World(pos) {
  return createVector(
    pos.x * width,
    pos.y * height
  );
}


let pegId = 0;
class Peg {
  constructor(pos, radius) {
    this.pos = pos
    this.radius = radius
    this.id = pegId++;
  }

  render() {
    ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
  }

  static getRandom() {
    return new Peg(
      createVector(random(.2, .8) * width, random(.2, .8) * height),
      gui.pegSize// max(randomGaussian(gui.pegSize, gui.pegSize * .5), 1)
    )
  }
  collidesWith(seg) {
    return inteceptCircleLineSeg(
      {
        center: this.pos,
        radius: this.radius
      },
      seg
    )
  }

}

class PegBoard {
  constructor() {
    this.paths = []
  }

  arrangeRandom(n) {
    print("arranging random", n)
    this.pegs = Array.from({length: n}, () => {
      const peg = Peg.getRandom();
      return peg;
    })
  }

  arrangeGrid(n) {
    const sn = sqrt(n)
    this.pegs = []
    for(let x = 0; x < sn; x++) {
      for(let y = 0; y < sn; y++) {
        this.pegs.push(new Peg(
          createVector(
            map(x / sn, 0, 1, .2, .8) * width,
            map(y / sn, 0, 1, .2, .8) * height,
          ).add(p5.Vector.random2D().setMag(10)), gui.pegSize
        ))
      }
    }
  }

  arrangeImage(img, n) {
    print("arrangingImage", img, n)
    const imgGet = (x,y) => { // set these to the coordinates
      let off = (y * img.width + x) * 4;
      let components = [
        img.pixels[off],
        img.pixels[off + 1],
        img.pixels[off + 2],
        img.pixels[off + 3]
      ];
      return components;
    }

    this.pegs = [];
    while(this.pegs.length < n) {
      const pt = createVector(
        random(),
        random()
      );

      const imgVal = imgGet(floor(pt.x * img.width), floor(pt.y * img.height));
      const grey = (imgVal[0] + imgVal[1] + imgVal[2]) / (765)
      if (grey + randomGaussian(0, max(gui.imgThreshBlur, 0.0001)) > gui.imgThresh) {
        this.pegs.push(new Peg(
          createVector(
            map(pt.x, 0, 1, .2, .8) * width,
            map(pt.y, 0, 1, .2, .8) * height),
            gui.pegSize
        ))
        print("added peg", this.pegs[this.pegs.length - 1])
      }
    }
  }

  arrange(n) {
    // this.arrangeRandom(n)
    [() => this.arrangeRandom(n), () => this.arrangeImage(img, n), () => this.arrangeGrid(n)][floor(gui.arrangeFn)]();
  }

  updatePaths(n) {
    for(let i = 0; i < n; i++) {
      this.paths.forEach(path => {
        path.update()
      })
    }
  }

  getClosestCollision(seg, startPeg) {
    let closest = null;
    this.pegs.forEach(peg => {
      if (startPeg && peg.id == startPeg.id) return
      const collision = peg.collidesWith(seg)
      if (collision.length == 2) {
        const d = min(seg.p1.dist(collision[0]), seg.p1.dist(collision[1]))
        //print('collision found', collision, d);

        if (closest == null || d < closest.dist) {
          closest = {
            dist: d,
            peg,
            collision
          }
        }
      }
    })
    return closest;
  }

  render() {
    noFill();
    strokeWeight(gui.strokeWeight);
    stroke(0);

    const collection = new PathCollection();
    //print('rendering board', this)
    // this.paths.forEach(path => path.render());

    this.paths.forEach(path => collection.addPath(path.pts.slice(gui.renderFirstLeg ? 0 : 1)));

    if (gui.renderMirror) {
      this.paths.forEach(path => collection.addPath(
        path.pts.slice(gui.renderFirstLeg ? 0 : 1)
        .map(pt => createVector(
          (width - pt.x),
          pt.y
        ))
      ));
    }


    if (this.paths.length > 0) {
      collection.render({
        optimize: false,
        curve: true,
        simplify: {
          simplifyTolerance: .1,
          roundTo: .1
        }
      });
    }


    if (gui.renderPegs) {
      strokeWeight(.5);
      stroke(0);
      this.pegs.forEach(peg => peg.render())
    }
  }
}


class PegPath {
  constructor(initPos, initState, board) {
    this.pts = [initPos]
    this.state = initState
    this.board = board
  }

  render() {
    beginShape();
    this.pts.forEach((pt, i) => {
      if (!gui.renderFirstLeg && i == 0) return
      vertex(pt.x, pt.y)
    })
    endShape();
  }

  getPos() {
    return this.pts[this.pts.length - 1]
  }

  updatePegged() {
    const peg = this.state.peg;
    const dir = this.state.dir;
    peg.dir = dir;

    const a = peg.radius;

    const wrapAmt = max(randomGaussian(gui.wrapAmt, gui.wrapAmt * gui.wrapVariance), TWO_PI)

    let nSteps = gui.spiralSteps * wrapAmt
    let startTheta = (peg.radius - a) / gui.spiralB * dir;


    let head = atan2(this.getPos().y - peg.pos.y, this.getPos().x - peg.pos.x);
    // let head = (peg.pos.heading(this.getPos()) + TWO_PI) % TWO_PI
    startTheta += head;

    let newPts = []
    let theta;

    for (let i = 0; i < nSteps; i++) {
      theta = (i / nSteps * wrapAmt) * dir + startTheta;
      //print(theta)

      const x = (a + gui.spiralB * theta) * cos(theta);
      const y = (a + gui.spiralB * theta) * sin(theta);
      newPts.push(createVector(x, y).add(peg.pos))
    }
    //print("updating radius", peg.radius, (a + gui.spiralB * theta), newPts)
    peg.radius = abs(a + gui.spiralB * theta);

    newPts = simplify(newPts, 0.05);

    this.pts.push(...newPts);

    this.state = {
      name: "free",
      peg
    }
    return true;
  }

  updateFree() {
    const p1 = this.getPos();
    const p2 = this.pts[this.pts.length - 2] || p1.copy().add(p5.Vector.random2D())

    const diff = p1.copy().sub(p2).setMag(10000);
    //print("updating free with", p1, p2, diff)

    const nSteps = 500;
    let sign = 1;
    for(let i = 0; i < PI; i += 1 / nSteps) {
      const diffR = diff.copy().rotate(i * sign);
      const seg = {
        p1,
        p2: p1.copy().add(diffR)
      }
      const intersect = this.board.getClosestCollision(seg, this.state.peg)
      if (intersect) {
        //print("intersection found", intersect, seg)
        const closePt = p1.dist(intersect.collision[0]) < p1.dist(intersect.collision[1]) ? intersect.collision[0] : intersect.collision[1];
        this.state = {
          name: "pegged",
          peg: intersect.peg,
          dir: 1//intersect.peg.dir == undefined ? (random() > .5 ? 1: -1) : intersect.peg.dir
        }
        this.pts.push(closePt);
        return true;
      }
      sign *= -1;
    }

    return false;
  }


  update() {
    switch (this.state.name) {
      case "pegged":
        this.updatePegged()
        break;
      case "free":
        this.updateFree()
        break;
      default:
        throw new Exception("state not found" + state.name)
    }
  }
}


function inteceptCircleLineSeg(circle, line){
  var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
  v1 = {};
  v2 = {};
  v1.x = line.p2.x - line.p1.x;
  v1.y = line.p2.y - line.p1.y;
  v2.x = line.p1.x - circle.center.x;
  v2.y = line.p1.y - circle.center.y;
  b = (v1.x * v2.x + v1.y * v2.y);
  c = 2 * (v1.x * v1.x + v1.y * v1.y);
  b *= -2;
  d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
  if(isNaN(d)){ // no intercept
      return [];
  }
  u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
  u2 = (b + d) / c;
  retP1 = {};   // return points
  retP2 = {}
  ret = []; // return array
  if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
      retP1.x = line.p1.x + v1.x * u1;
      retP1.y = line.p1.y + v1.y * u1;
      ret[0] = retP1;
  }
  if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
      retP2.x = line.p1.x + v1.x * u2;
      retP2.y = line.p1.y + v1.y * u2;
      ret[ret.length] = retP2;
  }
  return ret.map(p => createVector(p.x, p.y));
}
