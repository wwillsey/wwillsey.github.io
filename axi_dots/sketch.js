/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

const accel = .1;
const scale = .0005;
const turn = .5;
const MAXVEL = 1;
const NLINES = 50;
const accelScale = .01;

function setup() {
  createCanvas(displayWidth, displayHeight, SVG);
  noFill();
  // stroke('#ED225D');
  stroke(0);
  strokeWeight(2);
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
  if (frameCount > NLINES) {
    // save();

    noLoop();
    // return;
  }

  let space = 1000;
  drawLine(
    createVector(width/2 - space/2 + frameCount * space / NLINES , height * .2),
    createVector(0,MAXVEL),
    600,
    (pos, vel) => {
      const t1 = pos.copy().add(vel);
      const t2 = pos.copy().add(vel.copy().rotate(turn));
      const t3 = pos.copy().add(vel.copy().rotate(-turn));

      const n = [t1,t2,t3].map(v => abs(.5 - noise(v.x * scale, v.y * scale)));

      const m = min(n);
      if (n[0] == m) {
        return t1.copy().sub(pos);
      }
      if (n[1] == m) {
        return t2.copy().sub(pos);
      }
      if (n[2] == m) {
        return t3.copy().sub(pos);
      }
    }
  )
}


function drawLine(pos, vel, n, fn) {
  let pts = Array.from({length: n}, (v, i) => {
    const pt = pos.copy();

    const force = fn(pos, vel);
    vel.add(force.mult(accelScale));
    vel.limit(MAXVEL)
    pos.add(vel);
    return pt;
  })


  beginShape();
  vertex(pts[0].x, pts[0].y);
  pts.forEach((pt, i) => {
    vertex(pt.x, pt.y);
  });
  vertex(pts[pts.length-1].x, pts[pts.length-1].y);
  endShape();

  // pts.forEach((pt, i) => {
  //   if(i > 0) {
  //     // pt.x <= width/2 ? stroke(0) : stroke(255)
  //     line(pts[i-1].x, pts[i-1].y, pt.x, pt.y);
  //   }
  // });
}


// function setup() {
//   createCanvas(600, 200, SVG); // Create SVG Canvas
//   strokeWeight(2);
// }

// function draw() {
//   var x = frameCount / 100;
//   var y = sin(x * PI * 2);
//   line(x * width, height * 0.5,
//        x * width, y * height / 2 + height * 0.5);
//   if (frameCount > 100) {
//       noLoop();
//       save();
//   }
// }