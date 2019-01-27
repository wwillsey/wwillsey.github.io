let balls;
let e;
let img;


function preload() {
  img = loadImage('http://localhost:3000/noiseWalk/face.jpg');
}

function setup() {
	createCanvas(800,600);
	img.resize(0,600);
	frameRate(20);
	background(220);
	e = new p5.Ease(); // easing function object
	balls = Array.from({length: 100}).map(() =>
		new Particle(
			createVector(
				randomGaussian(width/2, 10),
				randomGaussian(height/2, 10)),
			 color(0),
			 10));
}

function draw() {
	// background(220,220,220,100);
	balls.forEach(ball => ball.drawIt());

	// if(mouseIsPressed)
	// 	updateBalls();
}

function mousePressed() {
	updateBalls();
}

function mouseDragged() {
	updateBalls();
}

function updateBalls() {
	balls.forEach(ball =>
		ball.moveTo(createVector(
			randomGaussian(mouseX, 100),
			randomGaussian(mouseY, 100)), 1, e.normalizedErf));
}


class Particle {
	constructor(pos, col, size) {
		this.pos = pos;
		this.col = col;
		this.size = size;
	}

	drawIt() {
		noStroke();
		const x = img.width * (this.pos.x / width);
		const y = img.height * (this.pos.y / height);
			fill(img.get(x,y));

		// if (x >= this.size/2 && x < width - this.size/2 && y >= this.size/2 && y < height - this.size/2)
		// 	image(img.get(x - this.size/2, y - this.size/2, this.size, this.size), x-this.size/2, y-this.size/2);

		ellipse(this.pos.x, this.pos.y, this.size * 2, this.size * 2);
	}

	moveTo(toPos, time, movementFn) {
		let iters = 300;
		let i = 0;
		const startPos = this.pos.copy();

		const myLerp = (a,b, amt) => {
			return (b - a) * amt + a;
		}

		const getPos = i => {
			const val = movementFn(i);
			const xp = myLerp(startPos.x, toPos.x, val);
			const yp = myLerp(startPos.y, toPos.y, val);

			return createVector(xp,yp);
		}

		clearInterval(this.interval);
		this.interval = setInterval(() => {
			this.pos = getPos(i);
			i += 1.0 / iters;
			if (i >= 1)

				clearInterval(this.interval);
		}, time / iters);
	}
}