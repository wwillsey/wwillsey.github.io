/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
const MAX_DEPTH = 6;
const SCALE = 1;
const N_RAYS = 100;

const noPrint = true;
const renderMode = false;

let E;
let world;

let gui;

const mouse = {
  active: true,
  last_gui_interaction: 0
};

let rendered = false;

function keyPressed(){
  switch (key) {
    case ' ':
    noLoop(); break;
    case ENTER:
      reset();
  }
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

function touchMoved() {
  return false;
}

function mouseClicked() {
  if (constrain(mouseX, 0, width) == mouseX && constrain(mouseY, 0, height) == mouseY && Date.now() - mouse.last_gui_interaction > 2000) {
    mouse.active = !mouse.active;
    rendered = !mouse.active;
  }
}

function setup() {
  createCanvas(displayWidth, displayHeight, SVG);
  // createCanvas(2880, 1800);
  E = new p5.Ease();
  gui = new Ray_GUI();

  if (noPrint) {
    print = () => {};
  }
  const mirrors = [
    // new MirrorObject([
    //   [
    //     createVector(width/2, 10),
    //     createVector(width/2, height - 10)
    //   ]
    // ], {}),
    // new MirrorObject([
    //   [
    //     createVector(width/3, 10),
    //     createVector(width/3, height / 3)
    //   ]
    // ], {}),
    // new MirrorObject([
    //   [
    //     createVector(2 * width/3, 10),
    //     createVector(2 *width/3, height / 3)
    //   ]
    // ], {}),
    // makeMirrorCircle(createVector(width * .5, height / 2), 200, 1000, TWO_PI * .25, TWO_PI * .75),
    // makeMirrorCircle(createVector(width * .55, height / 2), 200, 1000, 0, TWO_PI * .3),
    // makeMirrorCircle(createVector(width/2, height/2), height/2, 1400, x => .2 + noise(sin(x * PI), cos(x* PI))),
    new CircularWorldObject(createVector(width / 2, height / 2), height * .2),
    // new CircularWorldObject(createVector(width / 3, height / 2), 100),
  ]

  world = new World(mirrors, {});
  // frameRate(10)
  // pixelDensity(3)
  // noSmooth()
}

let aveRenderSpeed = 0;

function draw() {
  if (rendered) {
    return;
  }
  blendMode(DARKEST);
  background(color(6, 5, 4,255));
  blendMode(ADD);

  scale(SCALE)

  if (mouse.active) {
    // mouse.pt = createVector(mouseX, mouseY).mult(1/SCALE);
    mouse.pt = createVector(width/2, height * gui.ptY).mult(1/SCALE);
  }

  // const mouse = createVector(width * .4, height * .36).mult(1/SCALE);
  const rays = createRayCone(mouse.pt.copy(), 0, TWO_PI, gui.nRays);
  rays.push(...createRayCone(mouse.pt.copy().add(0, height/2 - mouse.pt.y - (mouse.pt.y - height/2)), 0, TWO_PI, gui.nRays))
  // const rays = [new Ray(createVector(0, 500), 0, {depth: 0})]

  stroke(200)
  strokeWeight(1)
  world.render();
  // stroke(color(241, 235, 232, 1))
  stroke(color(...gui.color))
  strokeWeight(gui.stroke_weight)
  // const startTime = Date.now();
  rays.forEach(ray => ray.render())
  // aveRenderSpeed += Date.now() - startTime;

  if (mouseIsPressed) {
    print(mouseX, mouseY);
  }
  if (renderMode)
  noLoop();

  rendered = !mouse.active;
}


class WorldObject {
  constructor(segments, opts) {
    this.segments = segments;
    this.opts = opts;
  }

  render() {
    this.segments.forEach(segment => {
      line(segment[0].x, segment[0].y, segment[1].x, segment[1].y);
    });
  }

  cast(ray) {
    let minIntersectionSegment = undefined;
    let minIntersection = undefined;
    let minDist = width * height * 10000;
    this.segments.forEach(([p1, p2]) => {
      const outPt = ray.getOutOfWorldPt()
      const i = intersect(p1.x, p1.y, p2.x, p2.y, ray.origin.x, ray.origin.y, outPt.x, outPt.y);
      if (i) {
        const ptI = createVector(i.x, i.y);
        const d = ray.origin.dist(ptI);
        if (d > .01 && d < minDist) {
          minDist = d;
          minIntersection = ptI;
          minIntersectionSegment = [p1, p2];
        }
      }
    });

    if (minIntersection) {
      return this.getNewRayFromIntersection(ray, minIntersection, minIntersectionSegment);
      // return {
      //   intersectionPt: minIntersection, intersectionSegment: minIntersectionSegment, object: this
      // };
    }
    return undefined;
  }
}

class CircularWorldObject {
  constructor(center, radius, opts) {
    this.center = center;
    this.radius = radius;
    this.opts = opts;
  }

  render() {
    fill(0, 0);
    ellipse(this.center.x, this.center.y, this.radius * 2, this.radius * 2, 100, 100);
  }

  cast(ray) {
    const m = abs(abs(ray.dir) - PI / 2) < .0001 ? 9999  : tan(ray.dir);
    const k = ray.origin.y - m * ray.origin.x;

    const a = m * m + 1;
    const b = 2 * m * k - 2 * this.center.x - 2 * this.center.y * m;
    const c =  - this.radius * this.radius + this.center.x * this.center.x + this.center.y * this.center.y + k * k - 2 * this.center.y * k;

    const d = b * b - 4 * a * c;
    print({ray,m,k,a,b,c,d})
    if (d >= 0) {
      const x0 = (-b + sqrt(d)) / (2 * a);
      const y0 = m * x0 + k;

      const x1 = (-b - sqrt(d)) / (2 * a);
      const y1 = m * x1 + k;

      const angBetween = (v1, v2) => {
        const ang = abs(acos(p5.Vector.dot(v1,v2) / v1.mag() / v2.mag()))
        return min(TWO_PI - ang, ang);
      }

      const minPt =  minBy([
        createVector(x0, y0),
        createVector(x1, y1)
      ].filter(pt => abs(pt.copy().sub(ray.origin).angleBetween(createVector(1,0).rotate(ray.dir))) < .001 && pt.dist(ray.origin) > .01 ), pt => ray.origin.dist(pt));

      print('minpt',minPt)
      print('pt0', x0, y0, createVector(x0, y0).copy().sub(ray.origin));
      print('pt1', x1, y1, createVector(x1, y1).copy().sub(ray.origin));
      // circle(x0, y0, 20);
      // circle(x1, y1, 20);
      return minPt ? this.getNewRayFromIntersection(ray, minPt) : undefined;
      // return undefined
    }
    return undefined;
  }

  getNewRayFromIntersection(ray, intersection) {
    // print('found intersection', ray, intersection);
    const centerAngle = this.center.copy().sub(intersection).heading();

    const theta = centerAngle - (ray.dir - PI);

    const newDir = ((ray.dir - PI) + 2 * theta) % TWO_PI;
    const newOpts = Object.assign({}, ray.opts);
    newOpts.depth = ray.opts.depth + 1;
    return new Ray(intersection.copy(), newDir, newOpts)
  }
}


class MirrorObject extends WorldObject {
  constructor(segments, opts) {
    super(segments, opts);
  }

  getNewRayFromIntersection(ray, intersectionPt, intersectionSegment) {
    const rayVec = intersectionPt.copy().sub(ray.origin).add(intersectionPt);

    let normalY = intersectionSegment[1].x - intersectionSegment[0].x;
    let normalX = intersectionSegment[0].y - intersectionSegment[1].y;
    let normalLength = sqrt(normalX * normalX + normalY * normalY)
    normalX = normalX / normalLength
    normalY = normalY / normalLength
    let rayX = rayVec.x - intersectionPt.x
    let rayY = rayVec.y - intersectionPt.y
    const dotProduct = (rayX * normalX) + (rayY * normalY);
    const dotNormalX = dotProduct * normalX
    const dotNormalY = dotProduct * normalY;
    const reflectedRayTipX = rayVec.x - (dotNormalX * 2)
    const reflectedRayTipY = rayVec.y - (dotNormalY * 2)

    const newVec = createVector(reflectedRayTipX, reflectedRayTipY).sub(intersectionPt)

    const newAng = newVec.heading();
    const newOpts = Object.assign({}, ray.opts);
    newOpts.depth = ray.opts.depth + 1;
    return new Ray(intersectionPt.copy(), newAng, newOpts);
  }
}


class World {
  constructor(objects, opts) {
    this.objects = objects;
    this.opts = opts;
  }

  cast(ray, segments = []) {
    print('calling world cast', frameCount)
    const intersection = minBy(this.objects
      .map(object => object.cast(ray))
      .filter(result => result), result => ray.origin.dist(result.origin));


    // print('intersection' ,intersection)
    // const intersection = intersectionRes ?
    // intersectionRes.object.getNewRayFromIntersection(ray, intersectionRes.intersectionPt, intersectionRes.intersectionSegment) :
    // undefined;

    const endPt = intersection ? intersection.origin : ray.getOutOfWorldPt();
    segments.push([ray.origin, endPt])
    if (intersection && intersection.opts.depth < gui.max_depth) {
      this.cast(intersection, segments);
      // circle(intersection.origin.x, intersection.origin.y, 3);
    }
  }

  render() {
    this.objects.forEach(object => object.render());
  }
}

class Ray {
  constructor(origin, dir, opts) {
    this.opts = opts;
    this.origin = origin;
    this.dir = dir;
  }

  cast() {
    const segments = [];
    world.cast(this, segments);
    // print('done with cast', segments)
    return segments;
  }

  getOutOfWorldPt() {
    if (!this.outOfWorldPt)
      this.outOfWorldPt = createVector(width + height, 0).rotate(this.dir).add(this.origin);
    return this.outOfWorldPt;
  }

  render() {
    // stroke(random([
    //   color(255,0,0,1),
    //   color(0,255,0,1),
    //   color(0,0,255,1),
    // ]));
    this.cast().forEach(segment => {
      line(segment[0].x, segment[0].y, segment[1].x, segment[1].y);
    })
  }
}


function createRayCone(pt, dir, ang, nRays) {
  let res = [];
  for(let a = dir - ang /2; a < dir + ang/2; a += ang / nRays) {
    res.push(new Ray(
      pt.copy(),
      a,
      {depth: 0}
    ));
  }
  return res;
}


function makeMirrorCircle(center, rad, n, fn = x=>1, start = 0, stop = TWO_PI) {
  const segments = [];
  // const fn = E.iterativeSquareRoot;

  for(let i = 0; i < n; i++) {
    const offset1 = fn(i / n);
    const offset2 = fn((i+1) / n);
    const pt1 = createVector(rad * offset1, 0).rotate(i * TWO_PI / n).add(center);
    const pt2 = createVector(rad * offset2, 0).rotate((i + 1) * TWO_PI / n).add(center);

    if ((i + .5) * TWO_PI / n > start && (i + .5) * TWO_PI / n < stop)
      segments.push([pt1, pt2]);
  }
  return new MirrorObject(segments, {});
}


function preserveMouse() {
  mouse.last_gui_interaction = Date.now();
  rendered = false;
}

class Ray_GUI {
  constructor() {
    this.gui = new dat.GUI();

    this.ptY = .5;
    this.gui.add(this, 'ptY', 0, 1, .001).onChange(preserveMouse)
    this.nRays = N_RAYS;
    this.gui.add(this, 'nRays', 1, 1000).onChange(preserveMouse)
    this.max_depth = MAX_DEPTH;
    this.gui.add(this, 'max_depth', 1, 20).onChange(preserveMouse)
    this.stroke_weight = 1;
    this.gui.add(this, 'stroke_weight', 0, 10).onChange(preserveMouse)
    this.color = [255,255,255,50]
    this.gui.addColor(this, 'color').onChange(preserveMouse)
  }
}