

let pack;

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
  createCanvas(400, 400);
  randomSeed(1);
  ellipseMode(CENTER);
  // frameRate(10)
  pack = new Pack(5);
}

function draw() {
  if (frameCount % 100) {
    background(255)
    let pos;
    let attempts = 10;
    do {
      pos = createVector(random(0,width), random(0,height));
      attempts--;
    } while (attempts && !pack.add(pos))

    print(pack)
    pack.head.render(pack.radius);
    const searchRad = pack.radius * 10;
    pack.head.getPointsWithinRadius(createVector(mouseX, mouseY), searchRad)
      .forEach(node => {
        fill('green');
        print(pack)
        ellipse(node.pos.x, node.pos.y, pack.radius * 2);
      })
    fill(0, 1);
    ellipse(mouseX,mouseY, searchRad * 2)
  }
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
    print('considering', this, 'for ', pos);
    if (this.pos.dist(pos) <= rad)
      res.push(this);
    this.children.forEach((child) => {
      print('child to try recursion', child);
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
    fill(0,20);
    ellipse(this.pos.x, this.pos.y, rad * 2);
    // fill(0);
    // text(this.nodeId, this.pos.x, this.pos.y);
    this.children.forEach((child) => {
      // line(this.pos.x, this.pos.y, child.pos.x, child.pos.y)
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

    print('attempting to add pos,', pos);
    print('pointsWithinRadius', pointsWithinRadius);
    if (pointsWithinRadius.length === 0) {
      this.head.add(new PackNode(pos));
      return true;
    }
    return false;
  }
}