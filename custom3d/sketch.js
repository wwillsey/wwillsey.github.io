/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let gui;
let camera;

let noisePos = 0;

function keyPressed() {
  switch (keyCode) {
    case ALT:
      save('out','svg');
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(displayWidth, displayHeight);
  gui = new GUI();

  gui.add('camera_x', width/2, 0, width);
  gui.add('camera_y', height/2, 0, width);
  gui.add('camera_z', width/2, 0, width);
  gui.add('camera_f', 500, 0, 10000);

  gui.add('s', 100, 0, width);
  gui.add('x', 0, 0, width);
  gui.add('y', 0, 0, width);
  gui.add('z', 1000, -10000, 10000);
  gui.add('ang', 0, 0, TWO_PI);
  gui.add('slices', 10, 0, 100);
  gui.add('detail', 20, 0, 1000);
  gui.add('noiseScale', .01, 0, .1);
  gui.add('noiseScale2', 0, 0, 1);
  gui.add('noiseVel', 0, 0.0, .2);
  gui.add('ptsSimplify', 0, 0, 1);
  gui.add('n', 1000, 0, 10000);


  stroke(255);
}


function draw() {
  noisePos += gui.noiseVel
  // strokeWeight(3);
  background(0);
  camera = {
    x: gui.camera_x,
    y: gui.camera_y,
    z: gui.camera_z,
    f: gui.camera_f,
  }
  // drawCube(gui.s, gui.x, gui.y, gui.z);

  // drawSphere(width * .2 + gui.x, height/2+gui.y, gui.z, 200, round(gui.slices), round(gui.detail))
  // drawSphere(width * .5+ gui.x, height/2+gui.y, gui.z, 200, round(gui.slices), round(gui.detail))
  // drawSphere(width * .8+ gui.x, height/2+gui.y, gui.z, 200, round(gui.slices), round(gui.detail))

  randomSeed(0)
  drawTunnel(width * .5 + gui.x, height * .5 + gui.y, gui.z, 100, 10000, gui.n);
}

function drawCube(s, x, y, z) {
  const verts = [
    createVector(-s, -s, -s),
    createVector(s, -s, -s),
    createVector(s, s, -s),
    createVector(-s, s, -s),
    createVector(-s, -s, s),
    createVector(s, -s, s),
    createVector(s, s, s),
    createVector(-s, s, s),
  ];

  verts.forEach(pt => {
    pt.rotate(gui.ang).add(x,y,z)
  })

  const lines = [
    [0,1],
    [1,2],
    [2,3],
    [3,0],
    [4,5],
    [5,6],
    [6,7],
    [7,4],
    [0,4],
    [1,5],
    [2,6],
    [3,7],
  ];


  lines.forEach(([i,j]) => {
    const p1 = verts[i];
    const p2 = verts[j];
    line3d(p1, p2);
  });

}

function getSpherePts(x,y,z, r, slices, detail) {

  // print({x,y,z, r, slices, detail})
  const pts = [];
  for(let i =0; i <= slices; i++) {

    const rad = max(r * sin(PI * i / slices), 1);

    const offset =  r - i / slices * r * 2

    // print(offset)

    const getPt = (ang) => {
      const p = createVector(rad, 0, 0).rotate(ang);
      p.setMag(p.mag() - p.mag() * (noise(p.x * gui.noiseScale, p.y * gui.noiseScale, noisePos) - noise(p.x * gui.noiseScale, p.y * gui.noiseScale, noisePos + gui.noiseScale2)))
      return p.add(x,y,z + offset)
    }

    let slicePts = Array.from({length: detail}, (v, idx) => {
      const p1 = getPt(idx / detail * TWO_PI)
      // const p2 = getPt((idx+1) / detail * TWO_PI)
      return p1
    })

    if (gui.ptsSimplify > 0) {
      const simplified = simplify(slicePts, gui.ptsSimplify, false);
      // print(`reduced ${slicePts.length} pts to ${simplified.length} with threshold ${gui.ptsSimplify}`);
      slicePts = simplified;
    }

    pts.push(slicePts);
  }
  return pts;
}

function drawSphere(x,y,z, r, slices, detail) {
  noFill();
  getSpherePts(x,y,z,r,slices,detail).forEach((slice) => {
    strokeWeight(camera.f / slice[0].z)

    // line3d(p1,p2);
    beginShape()
    slice.forEach(pt => {
      const p2d = transform(pt);
      vertex(p2d.x, p2d.y)
    })
    endShape(CLOSE);
  })
}

function drawTunnel(x,y,z,r,depth, n) {
  for (let i = 0; i < n; i++) {
    const [start,end] = [z, random(z, z + depth)].sort();
    const pt1 = createVector(0,r).rotate(random(TWO_PI)).add(x,y,start);
    const pt2 = pt1.copy().add(0,0,end-start);


    strokeWeight(camera.f / (pt1.z + pt2.z) / 2);
    // print(pt1, pt2)
    line3d(pt1, pt2);

  }
}

function point3d(x,y,z) {
  push()
  translate(x,y,z);
  point(0,0)
  pop()
}

function line3d(pt1, pt2) {
  const p1 = transform(pt1);
  const p2 = transform(pt2);

  line(p1.x, p1.y, p2.x, p2.y);
}


function transform(pt) {
  return createVector((pt.x - camera.x) * camera.f / pt.z + camera.x, (pt.y - camera.y) * camera.f / pt.z + camera.y);
}