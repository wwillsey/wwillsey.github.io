/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */


let W, gui;

let head, img, d;


function preload() {
  img = loadImage("../curve/face.jpeg");
}


function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg('out');
      break;
    case ENTER:
      start();
      break;
    default:
      break;
  }
}

function start() {
  W = new World();

  head = new Node(
    createVector(width / 2, height/2),
    1.0,
    null
  );
  W.addNode(head)

  clear()
  background(255)
}

function mouseClicked() {
  const pt = new Node(
    createVector(mouseX, mouseY),
    1.0,
    null
  );
  W.addNode(pt)
}

function setup() {
  createCanvas(displayWidth, displayHeight, SVG);

  gui = new GUI();
  gui.add("childrenRate", 2, 0, 10)
  gui.add("childrenSpread", .5, 0, 1);
  gui.add("childDist", 3, 0, 100);
  gui.add("closestChild", 2, 0, 100);
  gui.add("energyUse", .01, 0, 1);
  gui.add("staticRatio", .2, 0, 1);
  gui.add("noiseScale", .1, 0, 1);
  gui.add("noiseOffset", 0, -1, 1);
  gui.add("dirStrength", 0, -1, 1);
  gui.add("noiseMult", 0, -10, 10);
  gui.add("size", 500, 0, 5000);


  start();
  img.loadPixels()
  d = 1
}


function draw() {
  // head.render();
  // print(head);
  // noLoop()
  W.update();
  W.render()
}

class World {
  constructor() {
    this.tree = new rbush();
    this.all = []
  }

  addNode(node) {
    this.all.push(node);
    this.tree.insert({
      minX: node.pos.x,
      maxX: node.pos.x,
      minY: node.pos.y,
      maxY: node.pos.y,
      node
    });
  }

  getNearest(node) {
    const nearest = knn(this.tree, node.pos.x, node.pos.y, 2)
      .filter(p => p.node.id != node.parent.id)
      .map(p => p.node)

    return nearest;
  }

  update() {

    if (frameCount % 5 == 0) {
      this.tree.clear()
      this.tree.load(this.all.map(node => ({
        minX: node.pos.x,
        maxX: node.pos.x,
        minY: node.pos.y,
        maxY: node.pos.y,
        node
      })))
    }


    for(let i = 0; i < this.all.length; i++) {
      this.all[i].update();
    }
  }

  render() {
    this.all.forEach(n => {
      // stroke(n.energy * 255)
      if(n.parent && !n.rendered) {
        line(n.pos.x, n.pos.y, n.parent.pos.x, n.parent.pos.y)
        n.rendered = true;
      }
    })
  }

}


let nodeId = 0;
class Node {
  constructor(pos, energy, parent) {
    this.pos = pos;
    this.energy = energy;
    this.children = []
    this.parent = parent;
    this.id = nodeId++
    this.age = frameCount;
    this.lastUpdate = this.age;
  }

  // render() {
  //   // this.update();
  //   if (this.rendered) return;

  //   this.children.forEach(node => {
  //     stroke(node.energy * 255)
  //     line(this.pos.x, this.pos.y, node.pos.x, node.pos.y);
  //     node.render();
  //   });
  //   this.rendered = true;
  // }

  isStatic() {
    return this.energy < 0 ||
    (frameCount - this.age > 10) && (frameCount - this.lastUpdate) / (frameCount - this.age) > gui.staticRatio
  }

  update() {
    if (this.isStatic()) return;
    const shouldSpawn = random() < .2;
    const newChildren = this.spawnChildren();
    if (newChildren.length > 0) this.lastUpdate = frameCount;
    this.children.push(...newChildren);
  }

  spawnChildren() {
    const numChildren = ceil(gui.childrenRate * this.energy)

    const dir = this.pos.copy().sub(this.parent ? this.parent.pos : 0).normalize();

    // const n = (noise(this.pos.x * gui.noiseScale, this.pos.y * gui.noiseScale) + gui.noiseOffset) * gui.noiseMult;
    // const col = imgGet(img,floor(this.pos.x / width * img.width), floor(this.pos.y / height * img.height));

    // const n = (col[0] + col[1] + col[2]) / (3.0 * 255)

    // const nDir = n * TWO_PI;
    // const ang = nDir.angleBetween(dir);
    // dir.rotate(nDir * gui.dirStrength);



    // const spread = gui.childrenSpread * (this.energy);
    const spread = gui.childrenSpread //* n;

    return Array.from({length: numChildren}, () => {
      const newDir = dir.copy().rotate(randomGaussian(0, spread))
      const dist = gui.childDist;
      const newPos = this.pos.copy().add(newDir.mult(dist));
      const newEnergy = this.energy - gui.energyUse;
      return new Node(newPos, newEnergy, this);
    })
    .filter(n => (n.pos.x - width/2) ** 2 + (n.pos.y - height / 2) ** 2  < gui.size ** 2)
    .filter(n => {
      const nearest = W.getNearest(n);

      let res = true;
      if (nearest.length > 0) {
        const near = nearest[0];
        const d = sqrt((near.pos.x - n.pos.x) ** 2 + (near.pos.y - n.pos.y) ** 2)
        res = d > gui.closestChild;
      }
      if (res) W.addNode(n);
      return res;
    })
  }
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