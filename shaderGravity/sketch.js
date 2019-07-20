/* eslint-disable no-use-before-define, class-methods-use-ball, no-undef */

let physics;
let field;

const forceScale = 1;

let balls = []
let img;

function preload() {
  img = loadImage('http://localhost:3000/geneticLanguage/images/desert.jpeg');
}

function setup() {
  createCanvas(400, 400);
  field = createGraphics(width, height);
  field.image(img, 0, 0, field.width, field.height);

  physics = new Physics(0, 0);


  physics.toggle();
  physics.onUpdate(createForces);
}

function draw() {
  createRandomBalls(20);
  background(255);
  field.loadPixels();
  // print(balls)
  image(field, 0, 0)
  drawBalls();
  filterBalls();
  print(balls.length)
}

function createRandomBalls(n) {
  while(n--) {
    balls.push(physics.makeParticle(1, random(width), random(height)));
  }
}

function drawBalls() {
  fill(0);
  noStroke();
  balls.forEach(ball => {
    circle(ball.position.x, ball.position.y, 1);
  });
}

function createForces() {
  balls.forEach(ball => {
    const fieldSample = field.get(ball.position.x, ball.position.y);

    const angle = (red(fieldSample) + red(fieldSample) + red(fieldSample)) / 3  / 255 * TWO_PI;
    const mag = alpha(fieldSample) / 255 * forceScale;
    const force = p5.Vector.fromAngle(angle).setMag(mag);
    ball.velocity.x = force.x;
    ball.velocity.y = force.y;
  });

}

function filterBalls() {
  balls = balls.filter(ball => (ball.position.x < width && ball.position.x > 0 && ball.position.y < height && ball.position.y > 0));
}