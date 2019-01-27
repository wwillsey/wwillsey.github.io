
let canvas;

function setup() {
  createCanvas(400, 400);
  canvas = createGraphics(width, height);
}



function draw() {
  if (keyIsPressed) {
    repeater(0,0,width,height, 1);
  } else {
    background(0);
  }
}


function drawOnCanvas() {
  // canvas.background(0);
  canvas.fill(color(0,0,0,0));
  canvas.stroke(color((31, 124, 84)));
  canvas.strokeWeight(10);
  canvas.ellipse(canvas.width,canvas.height,canvas.width, canvas.height);
}

function repeater(x,y,w,h,n) {
  if (n === 0) {
    drawOnCanvas();
  } else {
    push();
    repeater(x,y, w/2, h/2, n-1);
    image(canvas, x,y, w/2, h/2);
    pop();

    push()
    repeater(x + w/2,y, w/2, h/2, n-1);
    rotate(PI/2, createVector(x + w * .75, y))
    image(canvas, x + w/2,y, w/2, h/2);
    pop();

    push()
    repeater(x, y + h/2, w/2, h/2, n-1);
    image(canvas, x,y + h/2, w/2, h/2);
    pop()

    push()
    repeater(x + w/2, y + h/2, w/2, h/2, n-1);
    image(canvas, x + w/2,y + h/2, w/2, h/2);
    pop();
  }
}