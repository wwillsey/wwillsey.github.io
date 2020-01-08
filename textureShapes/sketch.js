/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let textureLayer;

const pts = [];

function setup() {
  createCanvas(displayWidth, displayWidth, WEBGL);
  textureLayer = createTextureLayer();

}

function draw() {
  updatePts();
  renderToTextureLayer(textureLayer)

  texture(textureLayer);
  translate(0,0,-100)
  rotateX(PI)
  sphere(200, 20)
  // image(textureLayer, -width/2,-height/2, width, height);
}

function createTextureLayer() {
  textureLayer = createGraphics(width, height);
  textureLayer.background(0);

  for(let i = 0; i < 500; i++) {
    pts.push({
      pos: createVector(random(width), random(height)),
      vel: createVector(1).rotate(random(TWO_PI)),
    });
  }
  return textureLayer;
}

function updatePts() {
  pts.forEach(pt => {
    let newPos = pt.pos.copy().add(pt.vel);
    if (newPos.x < 0 || newPos.x >= textureLayer.width) {
      // pt.vel.x *= -1;
      newPos.x = (newPos.x + width) % width;
    }
    if (newPos.y < 0 || newPos.y >= textureLayer.height) {
      // pt.vel.y *= -1;
      newPos.y = (newPos.y + height) % height;
    }
    pt.pos = newPos
  })
}


function getClosest(pts) {
  const closest = [];
  const nClosest = 2;
  const tryToAdd = (pt, val, closeList) => {
    if (closeList.length < nClosest) {
      closeList.push({
        pt, val
      });
    } else {
      for (let x = 0; x < nClosest; x++) {
        if(val < closeList[x].val) {
          closeList[x] = { pt, val };
          return;
        }
      }
    }
  }

  for (let i = 0; i < pts.length; i++) {
    const closeForI = [];
    for (let j = 0; j < pts.length; j++) {
      if(i != j) {
        const val = dist(pts[i].pos.x, pts[i].pos.y, pts[j].pos.x, pts[j].pos.y);
        tryToAdd(pts[j], val, closeForI);
      }
    }
    closest.push(closeForI);
  }

  return closest;
}

function renderToTextureLayer(t) {
  t.background(0);
  const closest = getClosest(pts);
  t.stroke(255)
  t.fill(255, 100);

  closest.forEach((close, i) => {
    const pt = pts[i];
    // print(i, pt, close)
    t.beginShape();
    t.vertex(pt.pos.x, pt.pos.y);
    close.forEach(c => t.vertex(c.pt.pos.x, c.pt.pos.y))
    t.endShape(CLOSE);
  });
}




