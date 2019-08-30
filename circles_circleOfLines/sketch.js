/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let img;
let dataLayer;
let c;

function preload() {
  img = loadImage('http://localhost:3000/curve/face2.jpg');
}

function setup() {
  createCanvas(400, 400);
  dataLayer = createGraphics(width, height);
  dataLayer.image(img, 0,0, dataLayer.width, dataLayer.height);
  // let c = {
  //   center: {x: 200, y: 200},
  //   radius: 100,
  // }
  // let l = {
  //   p1: {x: 0, y: 150},
  //   p2: {x: width, y: 150}
  // }

  // fill(0);
  // line(l.p1.x, l.p1.y, l.p2.x, l.p2.y);
  // circle(200,200,200);
  // fill(color('red'));
  // const i = interceptCircleLineSeg(c, l);
  // print(i)
  strokeWeight(.005)

  c = new Circle(dataLayer, {
    radius: 200,
    pos: createVector(width / 2, height / 2)
  });
}

function draw() {
  // background(255, 1)
  c.render(200)
  // image(dataLayer,0 ,0);
}






class Circle {
  constructor(data, opts) {
    this.opts = opts;
    this.data = data; // canvas
  }

  getRandomPtInCircle() {
    return createVector(random(this.opts.radius), 0).rotate(random(TWO_PI)).add(this.opts.pos);
  }


  getRandomDataPt() {
    const pt = this.getRandomPtInCircle();
    return {
      pt,
      data: this.data.get(pt.x / width * this.data.width, pt.y / height * this.data.height),
    };

  }

  getIntersections(pt) {
    let ang = random(TWO_PI)//randomGaussian(frameCount * .01, .5);
    // ang = ang - ang % .3;
    const p1 = createVector(100000, 0).rotate(ang).add(pt);
    const p2 = createVector(-100000, 0).rotate(ang).add(pt);

    const c = {
      center: this.opts.pos,
      radius: this.opts.radius,
    }
    const l = {
      p1, p2
    };

    return interceptCircleLineSeg(c, l);
  }

  generateConnections(n) {
    const graph = [];

    while(n) {
      const {pt, data} = this.getRandomDataPt();
      const val = (red(data) + green(data) + blue(data)) / (255 * 3);

      stroke(data);
      if (randomGaussian(val, .05) > .9 || randomGaussian(val, .05) < .1) {
        graph.push(this.getIntersections(pt))
        n--;
      }
    }
    return graph;
  }

  render(n) {
    // fill(0);
    // circle(this.opts.pos.x, this.opts.pos.y, this.opts.radius * 2);
    // const i = this.getIntersections(createVector(mouseX, mouseY));
    // print(i)
    // fill(color('red'));
    // if(i.length === 2) {
    //   circle(i[0].x, i[0].y, 5)
    //   circle(i[1].x, i[1].y, 5)

    // }

    this.generateConnections(n).forEach(([p1, p2]) => {
      line(p1.x, p1.y, p2.x, p2.y);
    })
  }
}

function interceptCircleLineSeg(circle, line){
  let a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
  v1 = {};
  v2 = {};
  v1.x = line.p2.x - line.p1.x;
  v1.y = line.p2.y - line.p1.y;
  v2.x = line.p1.x - circle.center.x;
  v2.y = line.p1.y - circle.center.y;
  b = (v1.x * v2.x + v1.y * v2.y);
  c = 2 * (v1.x * v1.x + v1.y * v1.y);
  b *= -2;
  d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
  if(isNaN(d)){ // no intercept
      return [];
  }
  u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
  u2 = (b + d) / c;
  retP1 = {};   // return points
  retP2 = {}
  ret = []; // return array
  if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
      retP1.x = line.p1.x + v1.x * u1;
      retP1.y = line.p1.y + v1.y * u1;
      ret[0] = retP1;
  }
  if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
      retP2.x = line.p1.x + v1.x * u2;
      retP2.y = line.p1.y + v1.y * u2;
      ret[ret.length] = retP2;
  }
  return ret;
}