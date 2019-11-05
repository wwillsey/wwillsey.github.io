/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */


function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(255);
  const nLines = map(mouseX, 0, width, 1,100);
  strokeWeight(map(mouseY, 0, height, 0,10))
  drawLineCircle({x: width/2, y: height/2}, 100, nLines);
}


function drawLineCircle(c, r, nLines) {
  const w = 100;
  for(let i = 0; i <= nLines; i++) {
    const y = i / nLines * r * 2 - r;
    const x = sqrt(r*r - y*y);
    print(i, x, y)

    line(c.x - x - w/2, c.y + y, c.x + x + w/2, c.y + y)
  }
}