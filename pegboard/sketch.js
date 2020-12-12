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
  createCanvas(3500 / 2, 2375 / 2, SVG);
  gui = new GUI();
  randomSeed(1)
  img.loadPixels();

  gui.add("nIters", 2, 0, 500, 1)//.onFinishChange(init);
  gui.add("nPegs", 1000, 0, 10000, 1)//.onFinishChange(init);
  gui.add("pegSize", 2, 0, 1000)//.onFinishChange(init);
  gui.add("strokeWeight", 1, 0, 20)//.onFinishChange(init);
  gui.add("spiralA", 1, 0, 20)//.onFinishChange(init);
  gui.add("spiralB", .4, 0, 20)//.onFinishChange(init);
  gui.add("spiralSteps", 20, 0, 10000,1)//.onFinishChange(init);
  gui.add("wrapAmt", 40, 0, 500)//.onFinishChange(init);
  gui.add("minSize", 15, 0, 500)//.onFinishChange(init);
  gui.add("wrapVariance", .6, 0, 2)//.onFinishChange(init);
  gui.add("renderPegs", true)//.onFinishChange(init);
  gui.add("renderFirstLeg", false)//.onFinishChange(init);
  gui.add("imgThreshBlur", 0, 0, 1)//.onFinishChange(init);
  gui.add("imgThresh", .5, 0, 1)//.onFinishChange(init);
  gui.add("arrangeFn", 0, 0, 2, 1)//.onFinishChange(init);
  gui.add("renderMirror", false)//.onFinishChange(init);
  gui.add("boundingX", .5, 0, 5)//.onFinishChange(init);
  gui.add("boundingY", .5, 0, 5)//.onFinishChange(init);
  gui.add("middleDistChance",0, -1, 1)//.onFinishChange(init);
  gui.add("middleDistChanceVar", .00001, 0, 1)//.onFinishChange(init);
  gui.add("lineThickness", 2, 0, 100)//.onFinishChange(init);

  init()
  noLoop();
}


let mouseClickAction = false;
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
  mouseClickAction  =true;
  redraw()
}


function draw() {
  clear()
  if (!mouseClickAction) board.updatePaths(gui.nIters);
  board.render();
  mouseClickAction = false
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
      let peg, p, d
      do {
        peg = Peg.getRandom();
        d = peg.pos.dist(createVector(width/2, height/2)) / (width *  .6);
        p = randomGaussian(d, gui.middleDistChanceVar)
      } while(p < gui.middleDistChance)
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
        // print("added peg", this.pegs[this.pegs.length - 1])
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

  getClosestPegCollision(seg, startPeg, pathStart) {
    let closest = null;
    this.pegs.forEach(peg => {
      if (startPeg && peg.id == startPeg.id) return
      const collision = peg.collidesWith(seg)
      if (collision.length == 2) {
        const d = min(seg.p1.dist(collision[0]), seg.p1.dist(collision[1]))
        const closePt = seg.p1.dist(collision[0]) < seg.p1.dist(collision[1]) ? collision[0] : collision[1];

        if (abs(closePt.x - pathStart.x) > gui.boundingX * .6 * width) return
        if (abs(closePt.y - pathStart.y) > gui.boundingY * .6 * height) return

        if (closest == null || d < closest.dist) {
          closest = {
            closePt,
            dist: d,
            peg,
            collision
          }
        }
      }
    })
    return closest;
  }

  getClosestLineCollision(seg, pathStart) {
    let closest = null;
    this.paths.forEach(path => {
      path.lines.forEach(line => {
        const collision = segment_intersection(
          seg.p1.x, seg.p1.y,
          seg.p2.x, seg.p2.y,
          line.p1.x, line.p1.y,
          line.p2.x, line.p2.y);

        if (collision) {
          // print("collision found", {seg, path, line, collision})
          const d = seg.p1.dist(collision);

          const closePt = collision;
          if (abs(closePt.x - pathStart.x) >  gui.boundingX * .6 * width) return
          if (abs(closePt.y - pathStart.y) > gui.boundingY * .6 * height) return

          if (closest == null || d < closest.dist) {
            closest = {
              closePt,
              dist: d,
              collision,
              type: "line",
              line
            }
          }

        }
      })
    })
    return closest;
  }

  getClosestCollision(seg, startPeg, pathStart) {
    let closestPeg = this.getClosestPegCollision(seg, startPeg, pathStart);
    let closestLine = null//this.getClosestLineCollision(seg, pathStart);

    if (closestPeg && closestLine) {
      return closestPeg.dist < closestLine.dist ? closestPeg : closestLine;
    } else if (closestPeg) {
      return closestPeg
    } else {
      return closestLine
    }
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
        simplify: {
          simplifyTolerance: .05,
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
    this.lines = [];
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

    const wrapAmt = max(randomGaussian(gui.wrapAmt, gui.wrapAmt * gui.wrapVariance), gui.minSize)

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

  handleLineIntersect(seg, intersect) {
    const lineThickness = gui.lineThickness;

    const p1 = intersect.line.p1
    const p2 = intersect.line.p2
    const x0 = seg.p1.x;
    const y0 = seg.p1.y;
    const x1 = p1.x
    const y1 = p1.y
    const x2 = p2.x
    const y2 = p2.y

    const distToLine = (x,y) => abs((y2 - y1)*x - (x2-x1)*y + x2 * y1 - y2*x1) / (p1.dist(p2))

    const d = distToLine(x0, y0);
    const stepBack = intersect.dist * lineThickness / d;

    const newP2 = seg.p2.copy().sub(seg.p1).setMag(intersect.dist - stepBack);
    const newP2Final = newP2.copy().add(seg.p1);
    this.pts.push(newP2Final);
    const ang = asin(d / intersect.dist);
    const nextPt1 = newP2.copy().rotate(ang).setMag(10).add(newP2Final)
    // const d1 = distToLine(nextPt1.x, nextPt1.y)
    // const nextPt2 = newP2.copy().rotate(ang + PI).setMag(10).add(newP2Final)
    // const d2 = distToLine(nextPt2.x, nextPt2.y)


    this.pts.push(nextPt1);
    // if (abs(d1 - lineThickness) <= abs(d2 - lineThickness)) {
    //   this.pts.push(nextPt1.setMag(.1))
    // } else {
    //   this.pts.push(nextPt2.setMag(.1))
    // }



    // print("handled intersection", {intersect, newP2, nextPt, p1: seg.p1, p2: seg.p2, d, })
  }

  updateFree() {
    const p1 = this.getPos();
    const p2 = this.pts[this.pts.length - 2] || p1.copy().add(p5.Vector.random2D())

    const diff = p1.copy().sub(p2).setMag(10000);
    //print("updating free with", p1, p2, diff)
    const line = {
      p1: p1.copy()
    };

    const nSteps = 500;
    let sign = 1;
    for(let i = 0; i < PI; i += 1 / nSteps) {
      const diffR = diff.copy().rotate(i * sign);
      const seg = {
        p1,
        p2: p1.copy().add(diffR)
      }

      const intersect = this.board.getClosestCollision(seg, this.state.peg, this.pts[0])
      if (intersect) {
        //print("intersection found", intersect, seg)
        // const closePt = p1.dist(intersect.collision[0]) < p1.dist(intersect.collision[1]) ? intersect.collision[0] : intersect.collision[1];
        if (intersect.line) {
          this.handleLineIntersect(seg, intersect)
          line.p2 = this.pts[this.pts.length - 2];
        } else {
          this.state = {
            name: "pegged",
            peg: intersect.peg,
            dir: 1 //intersect.peg.dir == undefined ? (random() > .5 ? 1: -1) : intersect.peg.dir
          }
          this.pts.push(intersect.closePt);
          line.p2 = this.getPos().copy();
        }
        this.lines.push(line);
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


const eps = 0.0000001;
const between = (a, b, c) => a - eps <= b && b <= c + eps;

// const segment_intersection = (x1, y1, x2,y2, x3, y3, x4, y4) => {
//     const inter = Intersects.lineLine(x1, y1, x2,y2, x3, y3, x4, y4);

//     var x = ((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
//             ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));

//     var y = ((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
//             ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));

//     if (inter) print("should intersect!", {x,y, x1, y1, x2,y2, x3, y3, x4, y4})


//     if(
//         (isNaN(x) || isNaN(y)) ||
//         (x1>=x2 && !between(x2, x, x1) || !between(x1, x, x2)) ||
//         (y1>=y2 && !between(y2, y, y1) || !between(y1, y, y2)) ||
//         (x3>=x4 && !between(x4, x, x3) || !between(x3, x, x4)) ||
//         (y3>=y4 && !between(y4, y, y3) || !between(y3, y, y4))
//     ) {
//         return false;
//     }

//     return createVector(x,y);

// };

function segment_intersection(x1,y1,x2,y2, x3,y3,x4,y4) {
  var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
          ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
  var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
          ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));

    // const inter = Intersects.lineLine(x1, y1, x2,y2, x3, y3, x4, y4);
    // if (inter) print("should intersect!", {x,y, x1, y1, x2,y2, x3, y3, x4, y4})


  if (isNaN(x)||isNaN(y)) {
      return false;
  } else {
      if (x1>=x2) {
          if (!between(x2, x, x1)) {return false;}
      } else {
          if (!between(x1, x, x2)) {return false;}
      }
      if (y1>=y2) {
          if (!between(y2, y, y1)) {return false;}
      } else {
          if (!between(y1, y, y2)) {return false;}
      }
      if (x3>=x4) {
          if (!between(x4, x, x3)) {return false;}
      } else {
          if (!between(x3, x, x4)) {return false;}
      }
      if (y3>=y4) {
          if (!between(y4, y, y3)) {return false;}
      } else {
          if (!between(y3, y, y4)) {return false;}
      }
  }
  return createVector(x,y);
}