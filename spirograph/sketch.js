/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let S, gui;
let c;
let E;

let shouldSave = false;

function keyPressed() {
  switch (keyCode) {
    case ALT:
      // save('out','svg');
      // S.render()
      // shouldSave = true;
      saveSvg('out')
      redraw();
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

function setup() {
  setupCanvas(SVG);

  E = new p5.Ease();

  gui = new GUI();
  gui.add('steps', 10, 0, 20000).onChange(redraw);
  gui.add('scale_x', 1, -100, 100).onChange(redraw);
  gui.add('scale_y', 1, -100, 100).onChange(redraw);

  gui.add('ptsSimplify', 0, 0, 1).onChange(redraw);
  gui.add('roundTo', 0, 0, 1).onChange(redraw);
  gui.add('close', false).onChange(redraw);

  S = new Spirograph(
    [
      addTranslate(0, 0),
      addCircle(100),
      addCircle(),
      addCircle(),
      addCircle(),
    ],[]
  );
}


function setupCanvas(type) {
  c = createCanvas(displayWidth, displayHeight, type);
  noFill();
  strokeWeight(1);
  stroke(0);
}

function draw() {

  noLoop();
  clear();


  // S = new Spirograph(
  // [
  //   // F.translate(width/2, height/2),
  //   // // F.translateOverTime(gui.v2_x, gui.v2_y),
  //   // F.circle(gui.v0_radius, gui.v0_mult),
  //   // F.circle(gui.v0_radius, gui.v0_mult, (i) => cos(i * gui.v0_radiusFreq * PI) * gui.v0_radiusMod),
  //   // F.circle(gui.v1_radius, gui.v1_mult, (i) => noise(cos(i * gui.v1_radiusFreq * PI) * gui.v3_noiseScale) * gui.v3_noiseMult),
  //   // F.translate(gui.v1_radius, 0),
  //   // F.heart(gui.v1_radius, gui.v1_mult, (i) => sin(i * gui.v1_radiusFreq * PI) * gui.v1_radiusMod),
  // ],
  // [
  //   {
  //     x: width/2 + 100,
  //     y: height/2,
  //     f: gui.f,
  //   }
  // ]
  // );

  S.render(gui.steps);
  // image(c, 0, 0);
}


class Spirograph {
  constructor(fns, magnetPts) {
    this.fns = fns;
    this.magnetPts = magnetPts;
  }

  applyMagnetPts(pts) {
    this.magnetPts.forEach((magnet) => {
      pts.forEach((pt) => {
        const dy = magnet.y - pt.y;
        const dx = magnet.x - pt.x;
        const ang = atan2(dy, dx);
        const d = dy ** 2 + dx ** 2;

        const force = createVector(magnet.f / pow(max(d, gui.minD), gui.dPow), 0).rotate(ang);
        pt.x += force.x;
        pt.y += force.y;
      })
    })
  }

  getPts(steps) {

    let pts = Array.from({length: steps + 1}, (v, i) => {
      const cursor = createVector(0,0);
      let totalHeading = 0;
      this.fns.forEach((fn) => {
        const val = fn(i / steps).rotate(totalHeading)
        cursor.add(val)
        totalHeading += val.heading();
      });

      cursor.mult(gui.scale_x, gui.scale_y)
      cursor.add(width/2, height/2);
      return {x: cursor.x, y: cursor.y};
    });

    if (gui.ptsSimplify > 0) {
      const simplified = simplify(pts, gui.ptsSimplify, false);
      print(`reduced ${pts.length} pts to ${simplified.length} with threshold ${gui.ptsSimplify}`);
      pts = simplified;
    }

    if (gui.roundTo > 0) {
      pts = pts.map(p => roundPt(p, gui.roundTo))
    }

    this.applyMagnetPts(pts);
    return pts;
  }

  render(n) {
    // beginShape();
    // this.getPts(steps).forEach(pt => {
    //   vertex(pt.x, pt.y);
    // })
    // endShape(gui.close ? CLOSE : undefined);
    const steps = this.getPts(n);
    let last = steps[0];
    for(let i = 1; i < steps.length; i++) {
      const now = steps[i];
      line(last.x, last.y, now.x, now.y)
      last = now;
    }
  }

}


const F = {
  translate: (x,y) => ({
    fn: () => createVector(x, y),
    input: () => {},
  }),
  circle: (radius, times = 1, radiusModify = () => 1) => ({ // draw circle
    fn: ({radius, rotate}) => createVector(radius, 0).rotate(rotate),
    input: (i) => ({
      rotate: times * i * TWO_PI,
      radius: radiusModify(i) * radius,
    })
  }),
  translateOverTime: (x,y) => ({
    fn: (inp) => createVector(x * inp.val, y * inp.val),
    input: (inp) => ({
      val: inp
    }),
  }),
  heart: (radius, times = 1, radiusModify = () => 0) => ({ // draw circle
    fn: ({radius, rotate}) => createVector(
      16 * (sin(rotate) ** 3),
      13 * cos(rotate) - 5 * cos(2 * rotate) - 2 * cos(3 * rotate) - cos(4 * rotate)
    ).mult(radius),
    input: (i) => ({
      rotate: times * i * TWO_PI,
      radius: radius + radiusModify(i),
    })
  }),
}


let circleCount = 0;
function addCircle(defaultR = 0) {
  const circleId = `circle_${circleCount++}`;
  const f = gui.addFolder(circleId);
  f.add("radius", defaultR, 0, 1000).onChange(redraw)
  f.add("speed", 1, -1000, 1000).onChange(redraw)
  f.add("radiusFn", "").onChange(redraw);
  f.add("n", 3, 1, 1000,1).onChange(redraw);


  return (i) => {
    // return createVector(f.radius * (f.radiusFn != "" ? eval(f.radiusFn) : 1), 0).rotate(f.speed * i * TWO_PI);
    if (f.radius == 0) return createVector()
    const th = TWO_PI * i;
    const r = cos(PI/f.n) / cos(th - TWO_PI / f.n * floor((f.n * th + PI) / TWO_PI));
    return createVector(r * f.radius * (f.radiusFn != "" ? eval(f.radiusFn) : 1), 0).rotate(th * f.speed)
  }
}

let translateCount = 0;
function addTranslate(x,y) {
  const translateId = `translate_${translateCount++}`;
  const f = gui.addFolder(translateId);
  f.add("x", `${x ? x : '0'}`).onChange(redraw)
  f.add("y", `${y ? y : '0'}`).onChange(redraw)


  return (i) => {
    let x,y;
    try {
      x = eval(f.x);
      y = eval(f.y);
    } catch {
      x = 0;
      y = 0;
    }

    return createVector(x, y);
  }
}
