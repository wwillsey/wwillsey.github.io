let blobs;
let backgroundColor;
let img;

function keyPressed() {
  switch(keyCode) {
    case ENTER:
      remove();
  }
}


function setup() {
  createCanvas(400, 400);
  backgroundColor = color(242, 238, 220);
  background(backgroundColor);
  frameRate(30);

  blobs = Array.from({length: 50}).map(() => {
    const pos = createVector(randomGaussian(width/2, 10), randomGaussian(height/2, 30));
    const genome = Array.from({length:3}).map(() => randomGaussian(255/2, 50));
    genome.push(100);
    return new Blob(pos, genome, randomGaussian(5,2));
  });
}

function draw() {
  background(backgroundColor);
  fill(0)
  textSize(12);
  text(blobs.length, 10, 10)
  blobs.forEach(b => {
    b.move();
    b.drawIt();
  });

  for(let i = 0; i < blobs.length; i++) {
    for(let j = i+1; j < blobs.length; j++) {
      if (i != j) {
        Blob.collide(blobs[i], blobs[j]);
      }
    }
  }
}


class Blob {
  constructor(pos, genome, size) {
    this.pos = pos;
    this.genome = genome;
    this.size = size;
    this.dir = random(0, 2 * PI);
    this.age = 0;
    this.lastTimeReproduced = 0;
    this.lifeSpan = 1000;
  }

  getColor() {
    return color(...this.genome);
  }

  drawIt() {
    const col = this.getColor();
    noStroke();
    fill(col);
    ellipse(this.pos.x, this.pos.y, this.size * 2, this.size * 2);
  }

  move() {
    this.age += 1;
    this.dir += randomGaussian(0, .3);
    this.pos.add(createVector(abs(randomGaussian(0,.05)), 0).rotate(this.dir));
    if (this.pos.x > width + this.size || this.pos.x < -this.size) {
      this.pos.x = -this.pos.x + width;
      this.pos.y = height - this.pos.y
    }
    if (this.pos.y > height + this.size || this.pos.y < -this.size) {
      this.pos.y = -this.pos.y + height;
      this.pos.x = width - this.pos.x;
    }
  }

  kill() {
    blobs.remove(this);
  }

  getFitness() {

  }

  naturalSelection() {
    if (this.age >= this.lifeSpan)
      this.kill();

  }

  static attemptBreed(a, b) {
    const reproductionAge = 180;
    const reproductionRefreshTime = 50;
    if (a.age < reproductionAge
     || b.age < reproductionAge
     || a.age - a.lastTimeReproduced < reproductionRefreshTime
     || b.age - b.lastTimeReproduced < reproductionRefreshTime)
      return;
    const genome = Array.from({length: a.genome.length},
      (v,i) => (a.genome[i] + b.genome[i]) / 2);
    const size = (a.size + b.size) / 2;
    const pos = a.pos.copy().add(b.pos).div(2);
    a.lastTimeReproduced = a.age;
    b.lastTimeReproduced = b.age;
    return new Blob(pos, genome, size);
  }

  static collide(a, b) {
    if (p5.Vector.dist(a.pos, b.pos) < a.size + b.size) {
      const baby = Blob.attemptBreed(a,b);
      if (baby) {
        blobs.push(baby);
      }
      return true;
    } return false;
  }
}