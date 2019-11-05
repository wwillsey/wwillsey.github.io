/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */


function setup() {
  createCanvas(400, 400);

  const c = new CircularWorldObject(
    createVector(width/2, height/2),
    100, {}
  );
  noFill();
  const line1 = getCircleIntersectionPts(c, new Ray(createVector(0, height/2 - 50), 0));
  const line2 = getCircleIntersectionPts(c, new Ray(createVector(0, height/2 + 1), 0));

  drawSegment(c, line1, line2)

  // drawSegment(c, line1, line2);
  // circle(width/2, height/2, 200)

}

function draw() {
}


// function drawSegment(c, topLinePts, bottomLinePts) {
//   for (let ang = 0; ang < TWO_PI; ang += TWO_PI / 101) {
//     const circlePt = createVector(c.radius, 0).rotate(ang).add(c.center);
//     let pt = circlePt;

//     const bottom = bottomLinePts ? bottomLinePts[0].y : c.center.y + c.radius;
//     const top = topLinePts ? topLinePts[0].y : c.center.y - c.radius;
//     circlePt.y = constrain(circlePt.y, top, bottom);
//     print(bottom,top)

//     circle(pt.x, pt.y, 5);
//   }
// }

function drawSegment(c, topLinePts, bottomLinePts) {
  beginShape()
  for(let ang = 0; ang < TWO_PI; ang += TWO_PI / 101) {

    const top = topLinePts ?
      createVector((topLinePts[0].x + topLinePts[1].x) / 2, topLinePts[0].y) :
      createVector(c.center.x, c.center.y - c.radius);

    const bottom = bottomLinePts ?
      createVector((bottomLinePts[0].x + bottomLinePts[1].x) / 2, bottomLinePts[0].y) :
      createVector(c.center.x, c.center.y + c.radius);

    print(top, bottom)

    const centerPt = top.copy().add(bottom).mult(.5);
    circle(centerPt.x, centerPt.y, 5);

    const ray = new Ray(centerPt, ang);

    const circlePt = minBy(getCircleIntersectionPts(c, ray), pt => {
      let h = pt.copy().sub(centerPt).heading();
      h = h < 0 ? h + TWO_PI : h;
      return abs(h - ang)
    });

    // circle(circlePt.x, circlePt.y, 2)
    // const possiblePts = [
    //   circlePt
    // ];

    let ptI;

    if (ang < PI) {
      if(bottomLinePts) {
        const i = intersect(centerPt.x, centerPt.y, circlePt.x, circlePt.y, bottomLinePts[0].x, bottomLinePts[0].y, bottomLinePts[1].x, bottomLinePts[1].y);
        if (i)
          ptI = createVector(i.x, i.y);
      }
    } else {
      if(topLinePts) {
        const i = intersect(centerPt.x, centerPt.y, circlePt.x, circlePt.y, topLinePts[0].x, topLinePts[0].y, topLinePts[1].x, topLinePts[1].y);
        if (i)
          ptI = createVector(i.x, i.y);
      }
    }



    // if(ptI)
    // possiblePts.push(ptI)
    // print(possiblePts)
    // const pt = minBy(possiblePts, pt => pt.dist(c.center));
    const pt = ptI || circlePt;
    vertex(pt.x, pt.y)
    // circle(pt.x, pt.y, 4)
  }
  endShape();
}

function getCircleIntersectionPts(c, ray) {
  return c.cast(ray);
}

class CircularWorldObject {
  constructor(center, radius, opts) {
    this.center = center;
    this.radius = radius;
    this.opts = opts;
  }

  render() {
    fill(0, 0);
    circle(this.center.x, this.center.y, this.radius * 2, this.radius * 2, 100, 100);
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

      return [
        createVector(x0, y0),
        createVector(x1, y1)
      ]
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