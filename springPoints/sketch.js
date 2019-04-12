/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let physics;

const nParticles = 10;
const nPairs = 100;

const springStrength = 0.001;
const springDrag = 0.005;
const springRestLength = 200;


let particles;
let pairs;

let recording = false;
let particleMode = true;

let startOffset = 0;
let endOffset = 0;
let recordDataStep = 1;

const recordData = {
  length: 0
};

function keyPressed() {
  if (keyCode === SHIFT) {
    recording = !recording;
  } if (keyCode === RETURN) {
    // physics.toggle();
    particleMode = false;
    loop();
  }
}

function setup() {
  createCanvas(displayWidth, displayHeight, WEBGL);
  cam = createEasyCam({
    distance: 2500,
    // center: [100,100,0]
    // rotation: [ 0, 0, 0.4871745, -0.8733046 ]
  });
  physics = new Physics(.5);

  particles = Array.from({ length: nParticles }, (v,i) => createParticle(i));
  pairs = connectPairsWithSprings();

  physics.onUpdate(redraw);
  physics.toggle();

  print((height/2.0) / tan(PI*30.0 / 180.0))
  // redraw();
  noLoop();
}

function draw() {
  handleKeys()
  if (recording)
    record();

  if (particleMode) {
    renderParticles();
  } else {
    renderTriangles(round(startOffset), round(recordData.length - endOffset), round(max(1, recordDataStep)));
  }
}

function handleKeys() {
  if (keyIsDown(LEFT_ARROW)) {
    const dir = keyIsDown(OPTION) ? -1: 1;
    endOffset += dir * .5;
  }

  if (keyIsDown(RIGHT_ARROW)) {
    const dir = keyIsDown(OPTION) ? -1: 1;
    startOffset += dir * .5;
  }

  if (keyIsDown(UP_ARROW)) {
    recordDataStep += .5;
  }

  if (keyIsDown(DOWN_ARROW)) {
    recordDataStep -= .5;
  }

  if (keyIsDown(ENTER)) {
  }
}

function randomColor() {
  return color(
    random(0, 255),
    random(0, 255),
    random(0, 255)
  )
}

function renderTriangles(startTime, endTime, step) {
  background(20);
  noStroke();
  let locX = mouseX - height / 2;
  let locY = mouseY - width / 2;

  ambientLight(60, 60, 60);
  pointLight(255, 255, 255, locX, locY, 100);

  for (let i = 1; i < particles.length; i++) {
    for (let time = startTime; time < endTime - step; time+=step) {
      const p1 = recordData[i - 1][time];
      const p2 = recordData[i][time];
      const p3 = recordData[i - 1][time + step];


      // ambientMaterial(250);
      // fill(200, 50)
      // normalMaterial();

      beginShape();
      specularMaterial(particles[i-1].color);
        vertex(p1.x, p1.y, p1.z);
        specularMaterial(particles[i].color);
        vertex(p2.x, p2.y, p2.z);
        vertex(p3.x, p3.y, p3.z);
      endShape(CLOSE);
    }
  }
}



function renderParticles() {
  background(200);

  fill(20);

  pairs.forEach(({ a, b }) => {
    push();
    translate(a.position.x, a.position.y, a.position.z);
    sphere(20);
    pop();
    push();
    translate(b.position.x, b.position.y, b.position.z);
    sphere(20);
    pop();
    // line(a.position.x, a.position.y, b.position.x, b.position.y);
  });
}

function record() {
  recordData.length++;
  particles.forEach((particle) => {
    recordData[particle.id].push({
      id: particle.id,
      x: particle.position.x,
      y: particle.position.y,
      z: particle.position.z,
    });
  });
}



function createParticle(id) {
  // Particle variables
  const mass = 2;
  const x = random(-width, width);
  const y = random(-height, height);
  const p = physics.makeParticle(mass, x, y);
  p.id = id;
  p.position.z = random(-400, 400);


  p.color = color( (id + .5)  / nParticles * 255);
  recordData[id] = [];
  return p;
}

function connectPairsWithSprings() {
  const pairs = Array.from({ length: nPairs }, () => {
    let a = random(particles);
    let b = random(particles);
    while (a === b) {
      a = random(particles);
      b = random(particles);
    }
    return { a, b };
  });


  const strength = randomGaussian(springStrength, 0.2 * springStrength);
  const drag = randomGaussian(springDrag, 0.2 * springDrag);
  const rest = randomGaussian(springRestLength, 0.5 * springRestLength);

  pairs.forEach((pair) => {
    physics.makeSpring(pair.a, pair.b, strength, drag, rest);
  });

  return pairs;
}
