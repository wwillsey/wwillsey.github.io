/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */


const ripples = [];

function setup() {
  createCanvas(displayWidth, displayHeight);

  noFill()
}


function mouseClicked() {
  ripples.push({
    center: createVector(mouseX, mouseY),
    fn: (t) => {
      return sin((t - frameCount * .2) * .5)
    },
    time: 0,
    speed: 10,
    maxTime: 100,
  });
}


function draw() {

  if(mouseIsPressed) {
    mouseClicked();
  }

  background(255)
  ripples.forEach(drawRipple);
  ripples.forEach(updateRipple)
}



function drawRipple({center, fn, time, speed, maxTime}) {
  for(let i = max(0, time - maxTime); i < min(time, maxTime); i+= 1) {
    const val = fn(i);
    stroke((val + 1) * 255 / 2, 100);
    strokeWeight(3)
    // print(val)
    circle(center.x, center.y, i * speed)
  }
}

function updateRipple(r) {
  r.time += 1;
}
