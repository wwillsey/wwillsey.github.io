/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let gui;
let camera;

let obj;

let s;
let noisePos = 0;

p5.disableFriendlyErrors = true;


// function preload() {
//   noPrint(this)
//   // obj = loadModel("../media/20mm_cube.stl", true);
// }

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
  createCanvas(displayWidth, displayHeight,SVG);
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

  gui.add('detailX', 3, 2, 1000).onChange(redraw);
  gui.add('detailY', 3, 2, 1000).onChange(redraw);

  gui.add('ang', 0, 0, TWO_PI).onChange(redraw);
  gui.add('slices', 10, 0, 100).onChange(redraw);
  gui.add('detail', 20, 0, 1000).onChange(redraw);
  gui.add('noiseScale', .1, 0, 10).onChange(redraw);
  gui.add('noiseMult', 0, 0, 10000).onChange(redraw);
  gui.add('noiseOffset', 0, -1, 1, 0.0001).onChange(redraw);
  gui.add('noiseVel', 0, -100, 100, .00001).onChange(redraw);
  gui.add('noisePow', 1, 0, 10, .0001).onChange(redraw);
  gui.add('ptsSimplify', 0, 0, 1).onChange(redraw);
  gui.add('n', 1000, 0, 10000).onChange(redraw);
  gui.add('roundTo', 1, 0, 10).onChange(redraw);
  gui.add('fn', 0, 0, 10, 1).onChange(redraw);
  gui.add('trianglePrecision', .5, 0, 10, .000001).onChange(redraw);
  gui.add('backfaceCull', false, false).onChange(redraw);

  stroke(0);
}


let noiseZ = 0;

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
    noiseSphere(pos, gui.s),
    trefoil(pos, gui.s),
    noisePlane(pos, gui.s, gui.s)
  ][gui.fn];


  // rotateX(gui.rotateX);
  // applyMatrix(1, 0, 0, 1, 40 + gui.rotateX * 100, 50);


  noiseZ = 0;
  noiseZ += gui.noiseVel;
  // stroke(255,0,0);
  // new ParametricGeometry(fn, gui.detailX, gui.detailY).render();
  // noiseZ += gui.noiseVel;
  // stroke(0,255,0, 255/3);
  // new ParametricGeometry(fn, gui.detailX, gui.detailY).render();
  // noiseZ += gui.noiseVel;
  stroke(0,0,255, 255/3);
  new ParametricGeometry(fn, gui.detailX, gui.detailY).render();

  // if (obj) {
  //   s.faces = obj.faces
  //   s.vertices = obj.vertices;
  // }

  noLoop();
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
    this.faces = this.faces.filter((f, i) => {
      const n = this.faceNormals[i];
      return this.vertices[f[0]].copy().sub(camera.x, camera.y, camera.z).dot(n) < 0
    })
  }


  getVertices2D() {
    return this.vertices.map((v) => transformTo2D(v));
  }

  getLinesFromFaces(twoD = true) {
    const verticesList = twoD ? this.getVertices2D() : this.vertices;
    noPrint(verticesList)
    const graph = {};

    this.faces = (this.faces.sort((a,b) => {
      const va = mean(a.map(f => this.vertices[f].z));
      const vb = mean(b.map(f => this.vertices[f].z));

      const n = va - vb;
      if (abs(n) < .0001) {
        const n1 = this.vertices[a[0]].copy().sub(camera.x, camera.y, camera.z).dot(n);
        const n2 = this.vertices[b[0]].copy().sub(camera.x, camera.y, camera.z).dot(n);
        return n1 - n2;
      }
      return n;
    }));

    // noPrint(this.faces, this.faces.map(f => f.map(i => this.vertices[i])))

    this.faces.forEach((face, face_idx) => {
      const [a,b,c] = face.slice().sort();
      [a,b,c].forEach(x => {
        if (graph[x] == undefined) {
          graph[x] = {}
        }
      });

      graph[a][b] = face_idx;
      graph[a][c] = face_idx;
      graph[b][c] = face_idx;
    });


    /**
     * generate lines to be drawn by getting only distinct lines
     */
    const eq = (x1, y1, x2, y2) => (x1 - x2) ** 2 + (y1 - y2) ** 2 < .1;

    const endPts = [];
    const faces = {}
    let longestLineSqDist = .001;
    let lineId = 0;
    Object.keys(graph).forEach(a => Object.keys(graph[a]).forEach(b => {
      const p1 = verticesList[a];
      const p2 = verticesList[b];

      if(eq(p1.x, p1.y, p2.x, p2.y)) return;

      const faceIdx = graph[a][b];
      const faceVerts = this.faces[faceIdx].map(f => this.vertices[f]);
      // noPrint(faceVerts)
      const n = this.faceNormals[faceIdx];
      const norm = faceVerts[0].copy().sub(camera.x, camera.y, camera.z).dot(n) * .0000001;
      const zOrder = mean(faceVerts.map(v => v.z)) - norm;

      // noPrint(zOrder, norm)
      const line = {
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        // faceVerts,
        // faceIdx,
        id: lineId++,
        zOrder,
      }
      longestLineSqDist = Math.max(longestLineSqDist, (p1.x-p2.x)**2 + (p1.y-p2.y)**2);
      // endPts.push({
      //   x: p1.x,
      //   y: p1.y,
      //   line,
      // })
      // endPts.push({
      //   x: p2.x,
      //   y: p2.y,
      //   line,
      // })

      if(faces[faceIdx] == undefined) {
        faces[faceIdx] = [line];
      } else {
        faces[faceIdx].push(line);
      }
    }));

    const distFn = (l1, l2) => (l1.x - l2.x) ** 2 + (l1.y - l2.y) ** 2;
    const tree = new kdTree([], distFn, ["x","y"]);
    const treeList = [];

    const longestLineDist = sqrt(longestLineSqDist);
    const lineBinSize = longestLineDist * sqrt(2);
    const lineBins = {};
    // noPrint('longestLineSqDist', longestLineSqDist)

    /*
      for each line, attempt to insert, split if neccessary
    */

    const splitLine = (line, splitter) => {
      if (eq(line.x1, line.y1, splitter.x1, splitter.y1)) return [line];
      if (eq(line.x1, line.y1, splitter.x2, splitter.y2)) return [line];
      if (eq(line.x2, line.y2, splitter.x1, splitter.y1)) return [line];
      if (eq(line.x2, line.y2, splitter.x2, splitter.y2)) return [line];

      const intersection = segment_intersection(line.x1, line.y1, line.x2, line.y2, splitter.x1, splitter.y1, splitter.x2, splitter.y2);
      if (intersection) {
        const pts = [[line.x1, line.y1], [line.x2, line.y2], [splitter.x1, splitter.y1], [splitter.x2, splitter.y2]];
        for(let i = 0; i < pts.length; i++) {
          const l = pts[i]
          const [x,y] = l;
          if (eq(intersection.x, intersection.y, x, y)) {
            return [line];
          }
        }
        const l1 = {
          x1: line.x1,
          y1: line.y1,
          x2: intersection.x,
          y2: intersection.y,
          id: lineId++,
        }
        const l2 = {
          x2: line.x2,
          y2: line.y2,
          x1: intersection.x,
          y1: intersection.y,
          id: lineId++,
        }
        return [l1, l2];
      }
      return [line]
    }

    const addToTree = (tree, l) => {
      const p1 = {
        x:l.x1,
        y:l.y1,
        line: l
      };
      const p2 = {
        x:l.x2,
        y:l.y2,
        line: l
      };
      // tree.insert(p1);
      // tree.insert(p2);

      // treeList.push(p1);
      // treeList.push(p2);

      // if (treeList.length % 100 == 0)
      //   rebalanceTree(tree, treeList, distFn)

      const b1 = {
        x: floor(p1.x / lineBinSize),
        y: floor(p1.y / lineBinSize),
      };

      const b2 = {
        x: floor(p2.x / lineBinSize),
        y: floor(p2.y / lineBinSize),
      };
      if(lineBins[b1.x] == undefined) {
        lineBins[b1.x] = {};
        lineBins[b1.x][b1.y] = [[p1]];
      }
      else if(lineBins[b1.x][b1.y] == undefined) lineBins[b1.x][b1.y] = [[p1]];
      else {
        lineBins[b1.x][b1.y].push([p1]);
      }

      if(lineBins[b2.x] == undefined) {
        lineBins[b2.x] = {};
        lineBins[b2.x][b2.y] = [[p2]];
      }
      else if(lineBins[b2.x][b2.y] == undefined) lineBins[b2.x][b2.y] = [[p2]];
      else {
        lineBins[b2.x][b2.y].push([p2]);
      }
    }

    const ptInTriangle = (p, p0, p1, p2) => {
      var A = .5 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
      var sign = A < 0 ? -1 : 1;
      var s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
      var t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;

      noPrint({p, p0, p1, p2, A, sign, s, t})
      const pre = gui.trianglePrecision;
      return s > pre && t > pre && (s + t) < 2 * A * sign && abs((s + t) - 2 * A * sign) > pre;
      // if (inSide) {

      // }
    }

    const faceOverlap = (pt) => {
      const b1 = {
        x: floor(pt.x / lineBinSize),
        y: floor(pt.y / lineBinSize),
      };
      const facesToLook1 = (addedFaces[b1.x] == undefined ? new Set() : addedFaces[b1.x][b1.y] || new Set())
      const b2 = {
        x: floor(pt.x / lineBinSize),
        y: floor(pt.y / lineBinSize),
      };
      const facesToLook2 = (addedFaces[b2.x] == undefined ? new Set() : addedFaces[b2.x][b2.y] || new Set())

      const facesToLook = union(facesToLook1, facesToLook2)

      const facesIterator = facesToLook.values();
      for(let i = 0; i < facesToLook.size; i++) {
        const faceIdx = int(facesIterator.next().value);
        const face = this.faces[faceIdx].map(idx => verticesList[idx]);
        if (ptInTriangle(pt, ...face)) {
          return face;
        }
      }
      return false;
    }

    const finalLines = [];
    const addedFaces = {};

    let calls = 0;
    const attemptToAddLine = (lines) => {


      let anyAdded = false;
      while(lines.length > 0) {
        const line = lines.splice(-1)[0];
        // const p1Lines = tree.nearest({x: line.x1, y: line.y1}, this.faces.length * 3, [longestLineSqDist]) || [];
        // const p2Lines = tree.nearest({x: line.x2, y: line.y2}, this.faces.length * 3, [longestLineSqDist]) || [];

        const b1 = {
          x: floor(line.x1 / lineBinSize),
          y: floor(line.y1 / lineBinSize),
        };

        const b2 = {
          x: floor(line.x2 / lineBinSize),
          y: floor(line.y2 / lineBinSize),
        };

        const p1Lines = lineBins[b1.x] == undefined ? [] :
          lineBins[b1.x][b1.y] == undefined ? [] : lineBins[b1.x][b1.y]

        const p2Lines = lineBins[b2.x] == undefined ? [] :
          lineBins[b2.x][b2.y] == undefined ? [] : lineBins[b2.x][b2.y]
        // const p1Lines = treeList;
        // const p2Lines = [];

        // const linesToConsiderMap = {};
        // p1Lines.forEach(r => linesToConsiderMap[r[0].line.id] = r[0].line);
        // p2Lines.forEach(r => linesToConsiderMap[r[0].line.id] = r[0].line);

        const linesToConsiderSet = new Set(p1Lines.concat(p2Lines).map(r => r[0].line));
        const linesToConsider = linesToConsiderSet.values();
        // const linesToConsider = Object.values(linesToConsiderMap);

        // noPrint(linesToConsider.length)
        noPrint({linesToConsider})
        let lineSplit = false;
        for (let i = 0; i < linesToConsiderSet.size; i++) {
          const splitter = linesToConsider.next().value;
          const split = splitLine(line, splitter);

          if (split.length == 2) {
            noPrint('split found', split)
            // attemptToAddLine(split[0]);
            // attemptToAddLine(split[1]);
            lines.push(...split);
            lineSplit = true;
            // return
            break;
          }
        }
        if (!lineSplit) {
          // if it made it here, then no intersection,
          const midPt = {
            x: (line.x1 + line.x2) / 2,
            y: (line.y1 + line.y2) / 2
          };

          const faceO = faceOverlap(midPt);
          if(faceO == false) {
            addToTree(tree, line);
            finalLines.push(line);
            noPrint('successfully added line', line);
            anyAdded = true;
          } else {
            noPrint('line not added due to face collision', line, faceO)
          }
        }
      }
      return anyAdded
    };


    const addFace = (faceLineList, face_idx) => {
      const added = faceLineList.filter(line => {
        return attemptToAddLine([line])
      });

      if (added.length > 0) {
        faceLineList.forEach((faceLine) => {
          const b1 = {
            x: floor(faceLine.x1 / lineBinSize),
            y: floor(faceLine.y1 / lineBinSize),
          };
          const b2 = {
            x: floor(faceLine.x2 / lineBinSize),
            y: floor(faceLine.y2 / lineBinSize),
          };

          if(addedFaces[b1.x] == undefined) {
            addedFaces[b1.x] = {};
            addedFaces[b1.x][b1.y] = new Set([face_idx])
          }
          else if(addedFaces[b1.x][b1.y] == undefined) addedFaces[b1.x][b1.y] = new Set([face_idx]);
          else {
            addedFaces[b1.x][b1.y].add(face_idx)
          }

          if(addedFaces[b2.x] == undefined) {
            addedFaces[b2.x] = {};
            addedFaces[b2.x][b2.y] = new Set([face_idx])
          }
          else if(addedFaces[b2.x][b2.y] == undefined) addedFaces[b2.x][b2.y] = new Set([face_idx]);
          else {
            addedFaces[b2.x][b2.y].add(face_idx)
          }


        });
      }
    };


    noPrint("starting", {
      longestLineSqDist,
      faces
    })

    const zOrderSort = (a,b) => {
      // noPrint(a,b)
      return b[1][0].zOrder - a[1][0].zOrder;
    }

    const facesZOrdered = Object.entries(faces).slice()
      .sort(zOrderSort);

    noPrint('z ordered', facesZOrdered);
    facesZOrdered.forEach(([faceIdx, lineList]) => {
      lineList.sort((a,b) => {
        // noPrint(a,b)
        return b.zOrder - a.zOrder;
      });
      noPrint({faceIdx, lineList})
      addFace(lineList, faceIdx);
      noPrint('done adding face', faceIdx);
    });

    noPrint('calls', calls)
    noPrint(finalLines)
    return finalLines;
  }

  render() {
    this.mergeVertices();
    this.computeFaceNormals();
    gui.backfaceCull ? this.backfaceCull() : null;

    const lines2d = this.getLinesFromFaces();
    lines2d.forEach((l) => {
      line(l.x1, l.y1, l.x2, l.y2);
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

    // noPrint(theta, phi)
    const n = pow((noise(gui.noiseScale * sin(theta), gui.noiseScale * sin(phi), noiseZ) - gui.noiseOffset), gui.noisePow) * gui.noiseMult;
    const radius =  r + n;

    var x = radius * Math.cos(phi) * Math.sin(theta);
    var y = radius * Math.sin(phi);
    var z = radius * Math.cos(phi) * Math.cos(theta);
    // var z = radius + ((noise(pos.x + x / w * gui.noiseScale, pos.y + y / h * gui.noiseScale, noiseZ) -gui.noiseOffset) ** gui.noisePow) * gui.noiseMult;

    return rotateVector(new p5.Vector(x,y,z), gui.rotateX, gui.rotateY, gui.rotateZ).add(pos);
  };
}

function noisePlane(pos, w, h) {
  return (u,v) => {
      var x = 2 * w * u - w;
      var y = 2 * h * v - h;
      var z = -pow((noise(pos.x + x / w * gui.noiseScale, pos.y + y / h * gui.noiseScale, noiseZ) -gui.noiseOffset), gui.noisePow) * gui.noiseMult;
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

var eps = 0.0001;
function between(a, b, c) {
    return a-eps <= b && b <= c+eps;
}
function segment_intersection(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4)) /
            ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
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
    return {x: x, y: y};
}

function noPrint() {}


function mean(args) {
  // noPrint(args)
  // let s = 0;
  // args.forEach(v => s+=v)
  // return args.length ==0 ? 0 : s / args.length
  return Math.max(...args)
}


function rebalanceTree(tree, points, distanceFn) {
  const start = tree.balanceFactor();
  const startTime = Date.now();
  tree = new kdTree(points, distanceFn, ["x", "y"]);
  const end = tree.balanceFactor();

  noPrint(`rebalanced tree from ${start} to ${end} in ${Date.now() - startTime}ms`);
}



function union(a, b) {
  const result = new Set();

  a.forEach(value => {
    result.add(value);
  });

  b.forEach(value => {
    result.add(value);
  });


  return result;

}