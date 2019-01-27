

let pack;
let cam;
let is3D;
let circleColors;
let E;
let BUFFER;
function keyPressed() {
  switch(keyCode) {
    case ENTER:
      noLoop()
      break;
    case SHIFT:
      const res = pack.addRandom(10, 100)
      break
  }
}
function setup() {
  is3D = false;
  BUFFER = 2;

  createCanvas(2000, 1200, is3D ? WEBGL : undefined);
  cam = createEasyCam();
  E = new p5.Ease();
  randomSeed(1);
  ellipseMode(CENTER);
  rectMode(CORNERS);
  // frameRate(10)
  pack = new Pack();

  circleColors = [
    color(29, 52, 198),
    color(61, 153, 41),
    color(170, 142, 82),
    color(70, 73, 91),
    color(255)
  ];

  pack.fillWithSizes(
    [
      [300],
      [150],
      [100],
      [75],
      // [50],
      [20, 100],
      [10, 1000],
      [5, 500],
      [2, 100]
    ]
  )
}

function fastRun(shouldDraw) {
  if (!shouldDraw)
    noLoop();
  background(255)

  let pos;
  const numAttempts = 1;
  let attempts = numAttempts;
  do {
    pos = is3D ?
      p5.Vector.random3D().mult(randomGaussian(0, 100)) :
      p5.Vector.random2D().mult(randomGaussian(0, 100)).add(width/2, height/2)

    if (!pack.add(pos)) {
      attempts--;
    } else {
      attempts = numAttempts;
    }
  } while (attempts)

  pack.head.render(pack.radius);
}

function draw() {
  background(255);

  if (is3D) {
    let locX = mouseX - height / 2;
    let locY = mouseY - width / 2;

    ambientLight(60, 60, 60);
    pointLight(255, 255, 255, locX, locY, 100);
  }

  if (pack.head)
  pack.head.render(pack.radius);
}


let nodeId = 0;
class PackNode {
  constructor(pos, radius) {
    this.nodeId = nodeId++;
    this.children = []
    this.pos = pos;
    this.radius = radius;
    this.color = lerpColors(circleColors, random(0,1));
    this.range = {
      x: [this.pos.x - radius, this.pos.x + radius],
      y: [this.pos.y - radius, this.pos.y + radius],
      z: [this.pos.z - radius, this.pos.z + radius]
    }
  }

  getChildIndex(otherNode) {
    let idx = 0;
    if (this.pos.x > otherNode.pos.x)
      idx += 1;
    if (this.pos.y > otherNode.pos.y)
      idx += 1 << 1;
    if (this.pos.z > otherNode.pos.z)
      idx += 1 << 2;
    return idx
  }

  updateRange(newNode) {
    this.range = {
      x: [min(this.range.x[0], newNode.pos.x - newNode.radius), max(this.range.x[1], newNode.pos.x + newNode.radius)],
      y: [min(this.range.y[0], newNode.pos.y - newNode.radius), max(this.range.y[1], newNode.pos.y + newNode.radius)],
      z: [min(this.range.z[0], newNode.pos.z - newNode.radius), max(this.range.z[1], newNode.pos.z + newNode.radius)]
    }
  }

  add(newNode) {
    const idx = this.getChildIndex(newNode);
    const child = this.children[idx];
    if (child)
      child.add(newNode)
    else {
      this.children[idx] = newNode;
    }
    this.updateRange(newNode);
  }


  getCollidingWith(pos, rad) {
    let res = [];
    // print('considering', this, 'for ', pos);
    if (this.pos.dist(pos) <= rad + this.radius)
      res.push(this);
    this.children.forEach((child) => {
      // print('child to try recursion', child);
      if (child.range.x[0] <= pos.x + rad &&
          child.range.y[0] <= pos.y + rad &&
          child.range.z[0] <= pos.z + rad &&
          child.range.x[1] >= pos.x - rad &&
          child.range.y[1] >= pos.y - rad &&
          child.range.z[1] >= pos.z - rad)
        child.getCollidingWith(pos, rad).forEach((node) => res.push(node));
      });
    return res;
  }

  render() {

    if (is3D) {
      // fill(this.color)
      ambientMaterial(this.color);
      noStroke()
      push();
      translate(this.pos.x, this.pos.y, this.pos.z);
      sphere(this.radius);
      pop();
    } else {
      noStroke();
      fill(this.color)
      ellipse(this.pos.x, this.pos.y, this.radius * 2)

    }
    // fill(0)
    // text(this.nodeId, this.pos.x, this.pos.y)
    // fill(0,10);
    // rect(this.range.x[0], this.range.y[0], this.range.x[1], this.range.y[1])
    this.children.forEach((child) => {
      child.render(this.radius)
      // line(this.pos.x, this.pos.y, child.pos.x, child.pos.y)

    });
  }
}

class Pack {
  constructor() {
  }

  add(pos, radius) {
    if (!this.head) {
      this.head = new PackNode(pos, radius);
      return true;
    }

    // print('attempting to add pos,', pos, nodeId);
    const pointsWithinRadius = this.head.getCollidingWith(pos, radius + BUFFER);
    // print('pointsWithinRadius', pointsWithinRadius);
    if (pointsWithinRadius.length === 0) {
      this.head.add(new PackNode(pos, radius));
      return true;
    }
    return false;
  }

  addRandom(radius, numAttempts) {
    let pos;
    let attempts = numAttempts;
    do {
      pos = is3D ?
        p5.Vector.random3D().mult(random(0, 500)) :
        createVector(random(-100,width + 100), random(-100,height + 100));

      if (!this.add(pos, radius)) {
        attempts--;
      } else {
        return true;
      }
    } while (attempts)
   return false;;
  }

  fillWithSizes(balls) {
    balls.forEach(([radius, attempts]) => {
      print(radius, attempts);
      while(this.addRandom(radius, attempts || 100));
    })
  }
}

Dw.EasyCam.prototype.apply = function(n) {
  var o = this.cam;
  n = n || o.renderer,
  n && (this.camEYE = this.getPosition(this.camEYE), this.camLAT = this.getCenter(this.camLAT), this.camRUP = this.getUpVector(this.camRUP), n._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2], this.camLAT[0], this.camLAT[1], this.camLAT[2], this.camRUP[0], this.camRUP[1], this.camRUP[2]))
};