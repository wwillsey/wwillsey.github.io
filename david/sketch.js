/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let head;
function preload() {
  head = loadModel("../media/smk55-kas2232-head-of-david.stl")
}

function setup() {
  createCanvas(displayHeight, displayWidth, WEBGL);
}

function draw() {
  background(200);
  scale(0.1); // Scaled to make model fit into canvas
  rotateX(frameCount * 0.01);
  rotateY(frameCount * 0.01);
  normalMaterial(); // For effect
  model(head);

}
