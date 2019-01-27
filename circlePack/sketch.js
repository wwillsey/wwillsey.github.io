

let pack;
let cam;
let is3D;

function keyPressed() {
  switch(keyCode) {
    case ENTER:
      noLoop()
      break;
    case SHIFT:
      saveCanvas('myCanvas', 'jpg');
      break
  }
}
function setup() {
  is3D = false;

  createCanvas(800, 800,WEBGL);
  cam = createEasyCam();
  randomSeed(1);
  ellipseMode(CENTER);
  // frameRate(10)
  pack = new Pack(20);

  fastRun(true)
}

function fastRun(shouldDraw) {
  if (!shouldDraw)
    noLoop();
  background(255)

  let pos;
  const numAttempts = 20;
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

  let locX = mouseX - height / 2;
  let locY = mouseY - width / 2;

  ambientLight(60, 60, 60);
  pointLight(255, 255, 255, locX, locY, 100);


  pack.head.render(pack.radius);
}


let nodeId = 0;

class PackNode {
  constructor(pos) {
    this.nodeId = nodeId++;
    this.children = []
    this.pos = pos;
    this.range = {
      x: [this.pos.x, this.pos.x],
      y: [this.pos.y, this.pos.y],
      z: [this.pos.z, this.pos.z]
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
      x: [min(this.range.x[0], newNode.pos.x), max(this.range.x[1], newNode.pos.x)],
      y: [min(this.range.y[0], newNode.pos.y), max(this.range.y[1], newNode.pos.y)],
      z: [min(this.range.z[0], newNode.pos.z), max(this.range.z[1], newNode.pos.z)]
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


  getPointsWithinRadius(pos, rad) {
    let res = [];
    // print('considering', this, 'for ', pos);
    if (this.pos.dist(pos) <= rad)
      res.push(this);
    this.children.forEach((child) => {
      // print('child to try recursion', child);
      if (child.range.x[0] - rad <= pos.x &&
          child.range.y[0] - rad <= pos.y &&
          child.range.z[0] - rad <= pos.z &&
          child.range.x[1] + rad >= pos.x &&
          child.range.y[1] + rad >= pos.y &&
          child.range.z[1] + rad >= pos.z)
        child.getPointsWithinRadius(pos, rad).forEach((node) => res.push(node));
      });
    return res;
  }

  render(rad) {

    if (is3D) {
      // fill('blue')
      ambientMaterial(127,30,200);
      noStroke()
      push();
      translate(this.pos.x, this.pos.y, this.pos.z);
      sphere(rad);
      pop();
    } else {
      fill(0,30)
      ellipse(this.pos.x, this.pos.y, rad * 2)
    }

    this.children.forEach((child) => {
      child.render(rad)
    });
  }
}

class Pack {
  constructor(radius) {
    this.radius = radius;
  }

  add(pos) {
    if (!this.head) {
      this.head = new PackNode(pos);
      return true;
    }

    const rad = 2 * this.radius;
    const pointsWithinRadius = this.head.getPointsWithinRadius(pos, rad)

    // print('attempting to add pos,', pos);
    // print('pointsWithinRadius', pointsWithinRadius);
    if (pointsWithinRadius.length === 0) {
      this.head.add(new PackNode(pos));
      return true;
    }
    return false;
  }
}

Dw.EasyCam.prototype.apply = function(n) {
  var o = this.cam;
  n = n || o.renderer,
  n && (this.camEYE = this.getPosition(this.camEYE), this.camLAT = this.getCenter(this.camLAT), this.camRUP = this.getUpVector(this.camRUP), n._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2], this.camLAT[0], this.camLAT[1], this.camLAT[2], this.camRUP[0], this.camRUP[1], this.camRUP[2]))
};