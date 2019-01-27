var easycam;
let boxes;
const BOX_SIZE = 10;
let heightMapColors;
let E;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  setAttributes('antialias', true);

  easycam = createEasyCam({
    distance: 1000,
    // center: [100,100,0]
    rotation: [PI / 5, -PI/4,0,0]
  });
  document.oncontextmenu = function() { return false; }
  document.onmousedown   = function() { return false; }
  boxes = new Boxes(100, 300, 'NOISE')
  E = new p5.Ease();
  heightMapColors = [
    color(29, 52, 198),
    color(61, 153, 41),
    color(170, 142, 82),
    color(70, 73, 91),
    color(255)
  ];
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  easycam.setViewport([0,0,windowWidth, windowHeight]);
}


function draw(){

  // projection
  // perspective(60 * PI/180, width/height, 1, 100);

  // BG
  if (frameCount === 3) {
    background(32);
    strokeWeight(0.5);
    stroke(0);

    boxes.render();
  }

}

function createArray(w, h, type) {
  let fn;
  switch (type) {
    case 'UNIFORM_RANDOM':
      fn = () => random(0,100);
      break;
    case 'NOISE':
      const scale = .1;
      fn = (x,y) => pow(noise(x * scale, y * scale), 3);
      break;
    default:
      fn = (x,y) => x + y;
  }

  return Array.from({length:h}, (v, y) => Array.from({length:w}, (v, x) => fn(x,y)));
}

class Boxes {
  constructor(w, h, type) {
    this.array = createArray(w, h, type);
    this.width = w;
    this.height = h;
    this.size = BOX_SIZE;
  }

  get(x,y) {
    return this.array[y][x];
  }

  render() { // easing function object
    print(this)
    push();
    translate(- this.width * this.size / 2, -  this.height * this.size / 2)
    for(let y = 0; y < this.height; y++) {
      translate(0, this.size);
      push();
      for(let x = 0; x < this.width; x++) {
        translate(this.size, 0);
        print(x,y)
        const v = this.get(x,y);
        fill(lerpColors(heightMapColors, E.quarticIn(v)));
        box(this.size, this.size, v * 300);
      }
      pop()
    }
    pop();
  }
}







Dw.EasyCam.prototype.apply = function(n) {
  var o = this.cam;
  n = n || o.renderer,
  n && (this.camEYE = this.getPosition(this.camEYE), this.camLAT = this.getCenter(this.camLAT), this.camRUP = this.getUpVector(this.camRUP), n._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2], this.camLAT[0], this.camLAT[1], this.camLAT[2], this.camRUP[0], this.camRUP[1], this.camRUP[2]))
};