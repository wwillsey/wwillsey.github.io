/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

const scale = .005;


function setup() {
  createCanvas(displayWidth / 4, displayHeight / 4, SVG);
  noFill();
  // stroke('#ED225D');
  stroke(0);
  strokeWeight(1);

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
  if (frameCount > 0) {
    noLoop();
  }

  const pts = [];

  for(let i = 0; i < 100; i ++ ) {
    const pt = createVector(random(width * .1, width * .9), random(height * .1, height * .9));
    const v = noise(pt.x * scale, pt.y * scale);
    // print(v, pt);
    if (v > .5 && v < .55) {
      pts.push({pt,v});
    }
  }

  pts.sort((a, b) => a.pt.x - b.pt.x)
  // ellipse(pts[0].pt.x, pts[0].pt.y, 20,20);

  for (let i = 1; i < pts.length; i++) {
    line(pts[i-1].pt.x, pts[i-1].pt.y, pts[i].pt.x, pts[i].pt.y);

    // if(pts[i].v - .5 < .02) {
      // ellipse(pts[i].pt.x, pts[i].pt.y, 20,20);

    // }
  }

}