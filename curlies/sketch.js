/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let gui;

function setup() {
  createCanvas(displayWidth, displayHeight, SVG);
  // smooth(3);
  noSmooth();
  // pixelDensity(3)
  gui = new GUI();
  // gui.add('dirModifier', .14, 0, .5);
  // gui.add('lenModifier', .885, .5, 1);
  gui.add('slideDown', .1235, 0, 1);
  gui.add('size', 300, 0, 5000);
  gui.add('nSides', 3, 3, 20);
  gui.add('iters', 1, 0, 100);
}

function keyPressed() {
  switch (keyCode) {
    case ENTER:
      save();
      break;
    default:
      break;
  }
}

function draw() {
  blendMode(REPLACE)
  background(0,0)
  // blendMode(ADD)
  // const offset = createVector(gui.size, -gui.size).mult(.5);
  // drawCurlie(createVector(width/2, height/2).add(offset), PI/2, gui.size, PI/2);
  // drawCurlie(createVector(width/2, height/2 + gui.size).add(offset), PI, gui.size, PI/2);
  // drawCurlie(createVector(width/2 - gui.size, height/2 + gui.size).add(offset), -PI/2, gui.size, PI/2);
  // drawCurlie(createVector(width/2 - gui.size, height/2).add(offset), 0, gui.size, PI/2);
  makeCurlieNGon(createVector(width/2, height/2), int(gui.nSides));
  // noLoop();
}


function makeCurlieNGon(center, n) {
  for (let i = 0; i < n; i++) {
    const dir = (i) * TWO_PI/n;
    const pt = createVector(gui.size,0).rotate(dir);


    const len = gui.size * sin(PI/n) * 2;

    drawCurlie(pt.add(center),  (i+ .5) * TWO_PI / n + PI/2 , len, PI - TWO_PI / n);
  }
}

function drawCurlie(p, dir, len, th) {
  // print(p, dir, len, th)
  // stroke(0);
  // strokeWeight(.5);
  noStroke()
  // blendMode()

  let iters = 0;
  const pts = [];
  while(iters < gui.iters) {
    iters++
    const end = createVector(len,0).rotate(dir).add(p);

    pts.push(p.copy());
    pts.push(end.copy());

    // line(p.x, p.y, end.x, end.y);
    let A = len * gui.slideDown;
    let B = len - A;
    let C = sqrt(A*A + B*B - 2 * A * B * cos(th));

    let a = asin(sin(th) * A / C);

    dir += a;

    len = C;
    p.add(end.sub(p).mult(gui.slideDown))
  }


  const colors = [
    // color('white'),
    // color('black'),
    // color('white')
    // color('cyan'),
    color('red'),
    color('orange'),
    color('yellow'),
    color('green'),
    color('blue'),
    color('cyan'),
    color('indigo'),
    color('violet')
  ]

  const getColor = v => lerpColors(colors, pow(v, .3));

  for(let i = 1; i < pts.length-2; i+=2) {
    fill(getColor(i / pts.length))
    beginShape();
    vertex(pts[i].x, pts[i].y);
    // fill(getColor((i+1) / pts.length))
    vertex(pts[i+1].x, pts[i+1].y);
    // fill(getColor((i+2) / pts.length))
    vertex(pts[i+2].x, pts[i+2].y);
    endShape(CLOSE);
  }
}



