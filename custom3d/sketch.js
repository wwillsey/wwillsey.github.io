/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let gui;
let camera;

let s;
let noisePos = 0;

p5.disableFriendlyErrors = true;


function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg('out')
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(displayWidth, displayHeight, SVG);
  gui = new GUI();

  gui.add('camera_x', width/2, 0, width).onChange(redraw);
  gui.add('camera_y', height/2, 0, width).onChange(redraw);
  gui.add('camera_z', width/2, 0, width).onChange(redraw);
  gui.add('camera_f', 500, 0, 10000).onChange(redraw);

  gui.add('s', 100, 0, width).onChange(redraw);
  gui.add('x', width/2, 0, width).onChange(redraw);
  gui.add('y', height/2, 0, width).onChange(redraw);
  gui.add('z', 0, -10000, 10000).onChange(redraw);
  gui.add('rotateX', 0, 0, 360, .00001).onChange(redraw);
  gui.add('rotateY', 0, 0, 360, .00001).onChange(redraw);
  gui.add('rotateZ', 0, 0, 360, .00001).onChange(redraw);

  gui.add('detailX', 5, 2, 1000).onChange(redraw);
  gui.add('detailY', 5, 2, 1000).onChange(redraw);

  gui.add('ang', 0, 0, TWO_PI).onChange(redraw);
  gui.add('slices', 10, 0, 100).onChange(redraw);
  gui.add('detail', 20, 0, 1000).onChange(redraw);
  gui.add('noiseScale', .1, 0, 10).onChange(redraw);
  gui.add('noiseMult', 1, 0, 10000).onChange(redraw);
  gui.add('noiseOffset', 0, -1, 1, 0.0001).onChange(redraw);
  gui.add('noisePow', 1, 0, 10, .0001).onChange(redraw);
  gui.add('noiseVel', 0, 0.0, .2).onChange(redraw);
  gui.add('ptsSimplify', 0, 0, 1).onChange(redraw);
  gui.add('n', 1000, 0, 10000).onChange(redraw);
  gui.add('roundTo', 1, 0, 10).onChange(redraw);
  gui.add('fn', 0, 0, 10, 1).onChange(redraw);

  stroke(0);
}


function draw() {
  noisePos += gui.noiseVel
  // strokeWeight(3);
  // background(255);
  clear();
  camera = {
    x: gui.camera_x,
    y: gui.camera_y,
    z: gui.camera_z,
    f: gui.camera_f,
  }

  // s = new SVGSphere(createVector(gui.x, gui.y, gui.z), gui.s, gui.detailX, gui.detailY);

  const pos = createVector(gui.x, gui.y, gui.z);

  const fn = [
    trefoil(pos, gui.s),
    noiseSphere(pos, gui.s),
    noisePlane(pos, gui.s, gui.s)
  ][gui.fn];


  // rotateX(gui.rotateX);
  // applyMatrix(1, 0, 0, 1, 40 + gui.rotateX * 100, 50);

  s = new ParametricGeometry(fn, gui.detailX, gui.detailY);

  s.render();
  noLoop();
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

  if (gui.roundTo > 0) {
    roundPt(p1, gui.roundTo);
    roundPt(p2, gui.roundTo);
  }

  line(p1.x, p1.y, p2.x, p2.y);
}


function transform(pt) {
  return createVector((pt.x - camera.x) * camera.f / (pt.z - camera.z) + camera.x, (pt.y - camera.y) * camera.f / (pt.z - camera.z) + camera.y);
}

function transformTo2D(pt) {
  return gui.roundTo > 0 ? roundPt(transform(pt), gui.roundTo) : transform(pt)
}

function roundPt(pt, to = 1) {
  pt.x -= pt.x % to;
  pt.y -= pt.y % to;
  return pt;
}

class SVGGeometry extends p5.Geometry3D {
  constructor(opts) {
    super();
  }

  backfaceCull() {
    this.computeFaceNormals();
    this.faces = this.faces.filter((f, i) => {
      const n = this.faceNormals[i];
      return this.vertices[f[0]].copy().sub(camera.x, camera.y, camera.z).dot(n) > 0
    })
  }


  getVertices2D() {
    return this.vertices.map((v) => transformTo2D(v));
  }

  getLinesFromFaces(twoD = true) {
    const verticesList = twoD ? this.getVertices2D() : this.vertices;
    const graph = {};
    this.faces.forEach(face => {
      const [a,b,c] = face.slice().sort();
      [a,b,c].forEach(x => {
        if (graph[x] == undefined) {
          graph[x] = {}
        }
      });

      graph[a][b] = true;
      graph[a][c] = true;
      graph[b][c] = true;
    });
    const lines = [];
    Object.keys(graph).forEach(a => Object.keys(graph[a]).forEach(b => {
      const p1 = verticesList[a];
      const p2 = verticesList[b];
      lines.push([p1, p2]);
    }))

    return lines;
  }

  render() {
    this.mergeVertices();
    this.backfaceCull();

    const lines2d = this.getLinesFromFaces();
    lines2d.forEach(([p1,p2]) => {
      line(p1.x, p1.y, p2.x, p2.y);
    });
  }
}


class SVGSphere extends SVGGeometry {
  constructor(pos, radius, detailX, detailY, transformTo2D) {
    super()
    this.transformTo2D = transformTo2D;

    const fn = (u, v) => {
      var theta = 2 * Math.PI * u;
      var phi = Math.PI * v - Math.PI / 2;
      var x = radius * Math.cos(phi) * Math.sin(theta);
      var y = radius * Math.sin(phi);
      var z = radius * Math.cos(phi) * Math.cos(theta);
      return new p5.Vector(x, y, z).add(pos);
    };
    this.parametricGeometry(fn, detailX, detailY);
  }
}

class ParametricGeometry extends SVGGeometry {
  constructor(fn, detailX, detailY, transformTo2D) {
    super();
    this.transformTo2D = transformTo2D;
    this.parametricGeometry(fn, detailX, detailY);
  }
}


function trefoil(pos,r) {
  return (a,b) => {
    const u = 2 * Math.PI * a;
    const v = Math.PI * b - Math.PI / 2;

    const x = r * Math.sin(3 * u) / (2 + Math.cos(v))
    const y = r * (Math.sin(u) + 2 * Math.sin(2 * u)) / (2 + Math.cos(v + Math.PI * 2 / 3))
    const z = r / 2 * (Math.cos(u) - 2 * Math.cos(2 * u)) * (2 + Math.cos(v)) * (2 + Math.cos(v + Math.PI * 2 / 3)) / 4

    return rotateVector(new p5.Vector(x,y,z), gui.rotateX, gui.rotateY, gui.rotateZ).add(pos);
  }
}

function noiseSphere(pos, r) {
  return (u, v) => {
    var theta = 2 * Math.PI * u;
    var phi = Math.PI * v - Math.PI / 2;

    // print(theta, phi)
    const n = noise(gui.noiseScale * sin(theta), gui.noiseScale * sin(phi)) * gui.noiseMult;
    const radius =  r + n;

    var x = radius * Math.cos(phi) * Math.sin(theta);
    var y = radius * Math.sin(phi);
    var z = n;//radius * Math.cos(phi) * Math.cos(theta);
    return rotateVector(new p5.Vector(x,y,z), gui.rotateX, gui.rotateY, gui.rotateZ).add(pos);
  };
}

function noisePlane(pos, w, h) {
  return (u,v) => {
      var x = 2 * w * u - w;
      var y = 2 * h * v - h;
      var z = -((noise(pos.x + x / w * gui.noiseScale, pos.y + y / h * gui.noiseScale) -gui.noiseOffset) ** gui.noisePow) * gui.noiseMult;
      return rotateVector(new p5.Vector(x,y,z), gui.rotateX, gui.rotateY, gui.rotateZ).add(pos);
  };
}

function rotateVectorX(v, theta) {
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  return createVector(
    v.x * c - v.y * s,
    v.x * s + v.y * c,
    v.z
  );
}

function rotateVectorY(v, theta) {
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  return createVector(
    v.x * c + v.z * s,
    v.y,
    - v.x * s + v.z * c
  );
}

function rotateVectorZ(v, theta) {
  const s = Math.sin(theta);
  const c = Math.cos(theta);
  return createVector(
    v.x,
    v.y * c - v.z * s,
    v.y * s + v.z * c
  );
}

function rotateVector(v, x,y,z) {
  x = x / 180 * PI;
  y = y / 180 * PI;
  z = z / 180 * PI;
  return rotateVectorZ(rotateVectorY(rotateVectorX(v, x), y), z);
}


class Triangle {
  constructor(a,b,c) {
    this.a = a;
    this.b = b;
    this.c = c;
  }
}


function doTrianglesIntersect(t1, t2) {

  /*
  Adapated from section "4.1 Separation of Triangles" of:

   - [Dynamic Collision Detection using Oriented Bounding Boxes](https://www.geometrictools.com/Documentation/DynamicCollisionDetection.pdf)
  */


  // Triangle 1:

  var A0 = t1.a;
  var A1 = t1.b;
  var A2 = t1.c;

  var E0 = A1.copy().sub(A0);
  var E1 = A2.copy().sub(A0);

  var E2 = E1.copy().sub(E0);

  var N = E0.copy().cross(E1);


  // Triangle 2:

  var B0 = t2.a;
  var B1 = t2.b;
  var B2 = t2.c;

  var F0 = B1.copy().sub(B0);
  var F1 = B2.copy().sub(B0);

  var F2 = F1.copy().sub(F0);

  var M = F0.copy().cross(F1);


  var D = B0.copy().sub(A0);


  function areProjectionsSeparated(p0, p1, p2, q0, q1, q2) {
    var min_p = Math.min(p0, p1, p2),
        max_p = Math.max(p0, p1, p2),
        min_q = Math.min(q0, q1, q2),
        max_q = Math.max(q0, q1, q2);

    return ((min_p > max_q) || (max_p < min_q));
  }


  // Only potential separating axes for non-parallel and non-coplanar triangles are tested.


  // Seperating axis: N

  {
    var p0 = 0,
        p1 = 0,
        p2 = 0,
        q0 = N.dot(D),
        q1 = q0 + N.dot(F0),
        q2 = q0 + N.dot(F1);

    if (areProjectionsSeparated(p0, p1, p2, q0, q1, q2))
      return false;
  }


  // Separating axis: M

  {
    var p0 = 0,
        p1 = M.dot(E0),
        p2 = M.dot(E1),
        q0 = M.dot(D),
        q1 = q0,
        q2 = q0;

    if (areProjectionsSeparated(p0, p1, p2, q0, q1, q2))
      return false;
  }


  // Seperating axis: E0 × F0

  {
    var p0 = 0,
        p1 = 0,
        p2 = -(N.dot(F0)),
        q0 = E0.copy().cross(F0).dot(D),
        q1 = q0,
        q2 = q0 + M.dot(E0);

    if (areProjectionsSeparated(p0, p1, p2, q0, q1, q2))
      return false;
  }


  // Seperating axis: E0 × F1

  {
    var p0 = 0,
        p1 = 0,
        p2 = -(N.dot(F1)),
        q0 = E0.copy().cross(F1).dot(D),
        q1 = q0 - M.dot(E0),
        q2 = q0;

    if (areProjectionsSeparated(p0, p1, p2, q0, q1, q2))
      return false;
  }


  // Seperating axis: E0 × F2

  {
    var p0 = 0,
        p1 = 0,
        p2 = -(N.dot(F2)),
        q0 = E0.copy().cross(F2).dot(D),
        q1 = q0 - M.dot(E0),
        q2 = q1;

    if (areProjectionsSeparated(p0, p1, p2, q0, q1, q2))
      return false;
  }


  // Seperating axis: E1 × F0

  {
    var p0 = 0,
        p1 = N.dot(F0),
        p2 = 0,
        q0 = E1.copy().cross(F0).dot(D),
        q1 = q0,
        q2 = q0 + M.dot(E1);

    if (areProjectionsSeparated(p0, p1, p2, q0, q1, q2))
      return false;
  }


  // Seperating axis: E1 × F1

  {
    var p0 = 0,
        p1 = N.dot(F1),
        p2 = 0,
        q0 = E1.copy().cross(F1).dot(D),
        q1 = q0 - M.dot(E1),
        q2 = q0;

    if (areProjectionsSeparated(p0, p1, p2, q0, q1, q2))
      return false;
  }


  // Seperating axis: E1 × F2

  {
    var p0 = 0,
        p1 = N.dot(F2),
        p2 = 0,
        q0 = E1.copy().cross(F2).dot(D),
        q1 = q0 - M.dot(E1),
        q2 = q1;

    if (areProjectionsSeparated(p0, p1, p2, q0, q1, q2))
      return false;
  }


  // Seperating axis: E2 × F0

  {
    var p0 = 0,
        p1 = N.dot(F0),
        p2 = p1,
        q0 = E2.copy().cross(F0).dot(D),
        q1 = q0,
        q2 = q0 + M.dot(E2);

    if (areProjectionsSeparated(p0, p1, p2, q0, q1, q2))
      return false;
  }


  // Seperating axis: E2 × F1

  {
    var p0 = 0,
        p1 = N.dot(F1),
        p2 = p1,
        q0 = E2.copy().cross(F1).dot(D),
        q1 = q0 - M.dot(E2),
        q2 = q0;

    if (areProjectionsSeparated(p0, p1, p2, q0, q1, q2))
      return false;
  }


  // Seperating axis: E2 × F2

  {
    var p0 = 0,
        p1 = N.dot(F2),
        p2 = p1,
        q0 = E2.copy().cross(F2).dot(D),
        q1 = q0 - M.dot(E2),
        q2 = q1;

    if (areProjectionsSeparated(p0, p1, p2, q0, q1, q2))
      return false;
  }


  return true;
}