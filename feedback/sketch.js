// in this sketch we're going to create a feedback effect by repeatedly sending the same image back to the shader and performing a slight modification
// click the mouse to get things started

// the shader variable
let camShader;

// the camera variable
let cam;

// we will need at least two layers for this effect
let shaderLayer;
let copyLayer;

function preload(){
  // load the shader
  img = loadImage('http://localhost:3000/geneticLanguage/images/desert.jpeg');
  camShader = loadShader('effect.vert', 'effect.frag');
}

function setup() {
  // shaders require WEBGL mode to work
  createCanvas(windowWidth, windowHeight);
  noStroke();

  // this layer will use webgl with our shader
  shaderLayer = createGraphics(windowWidth, windowHeight, WEBGL);

  // this layer will just be a copy of what we just did with the shader
  copyLayer = createGraphics(windowWidth, windowHeight);
  copyLayer.image(img, 0,0,width, height);
}

function draw() {
  // shader() sets the active shader with our shader
  shaderLayer.shader(camShader);

  // lets just send the cam to our shader as a uniform
  // camShader.setUniform('tex0', img);

  // also send the copy layer to the shader as a uniform
  camShader.setUniform('tex1', copyLayer);

  // send mouseIsPressed to the shader as a int (either 0 or 1)
  camShader.setUniform('mouseDown', int(mouseIsPressed));
  camShader.setUniform('resolution', [width, height]);

  camShader.setUniform('time', frameCount * 0.01);

  // rect gives us some geometry on the screen
  shaderLayer.rect(0,0,width, height);

  // draw the shaderlayer into the copy layer
  copyLayer.image(shaderLayer, 0,0,width, height);

  // render the shaderlayer to the screen
  image(shaderLayer, 0,0,width, height);

  textSize(24);
  text("Click to bring in new frames", 50,50);
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}