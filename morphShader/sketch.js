// in this sketch we're going to create a feedback effect by repeatedly sending the same image back to the shader and performing a slight modification
// click the mouse to get things started

// the shader variable
let morphShader;
let physics;
let balls;

// the camera variable
let cam;

// we will need at least two layers for this effect
let shaderLayer;
let copyLayer;

function preload(){
  // load the shader
  img = loadImage('http://localhost:3000/geneticLanguage/images/desert.jpeg');
  morphShader = loadShader('effect.vert', 'effect.frag');
}

function setup() {
  // shaders require WEBGL mode to work
  createCanvas(windowWidth, windowHeight);
  noStroke();
  physics = new Physics(0, 0);

  balls = Array.from({length: 10}, () => new Ball({
    pos: createVector(random() * width, random() * height),
  }));
  physics.toggle();
  // this layer will use webgl with our shader
  shaderLayer = createGraphics(windowWidth, windowHeight, WEBGL);
  shaderLayer.noStroke();
  shaderLayer.image(img, -width/2,-height/2,width, height);

  physics.onUpdate(() => {
    balls.forEach(ball => ball.keepInBounds());
  })
}

function draw() {

  const ballPos = [];
  balls.forEach(ball => {
    ballPos.push(ball.particle.position.x / width);
    ballPos.push(ball.particle.position.y / height);
  });

  // shader() sets the active shader with our shader
  shaderLayer.shader(morphShader);
  morphShader.setUniform('tex1', shaderLayer);

  morphShader.setUniform('mouseDown', int(mouseIsPressed));
  morphShader.setUniform('resolution', [width, height]);

  morphShader.setUniform('time', frameCount * 0.01);
  morphShader.setUniform('balls', ballPos);
  // rect gives us some geometry on the screen
  shaderLayer.rect(0,0,width, height);

  // draw the shaderlayer into the copy layer
  // copyLayer.image(shaderLayer, 0,0,width, height);

  // render the shaderlayer to the screen

  image(shaderLayer, 0,0,width, height);

  // textSize(24);
  // text("Click to bring in new frames", 50,50);
  // balls.forEach(ball => {
  //   ballPos.push(ball.particle.position.x);
  //   ballPos.push(ball.particle.position.y);
  //   ball.keepInBounds();
  //   fill(0);
  //   circle(ball.particle.position.x, ball.particle.position.y, 10)
  // });
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}



class Ball {
  constructor(opts) {
    this.particle = physics.makeParticle(1, opts.pos.x, opts.pos.y);
    this.particle.velocity.x = random() * 4;
    this.particle.velocity.y = random() * 4;
  }

  keepInBounds() {
    if (this.particle.position.x > width) {
      this.particle.velocity.x = - abs(this.particle.velocity.x)
    }
    if (this.particle.position.x < 0) {
      this.particle.velocity.x = abs(this.particle.velocity.x)
    }
    if (this.particle.position.y > height) {
      this.particle.velocity.y = - abs(this.particle.velocity.y)
    }
    if (this.particle.position.y < 0) {
      this.particle.velocity.y = abs(this.particle.velocity.y)
    }
  }
}