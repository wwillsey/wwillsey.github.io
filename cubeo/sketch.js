let cube;
let fn;
let E;

function setup() {
  createCanvas(400, 400, WEBGL);
  cam = createEasyCam();
  E = new p5.Ease();
  cube = new Cubeo(7, 50, createVector(0,0,0));

  run();
}

function draw() {
  background(50);
  cube.render(fn);
}

function keyTyped() {
  switch(key) {
    case ' ':
      print('calling run')
      run();
  }
}


function runFn(intervalMs, times, fn) {
  return new Promise((res, rej) => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count === times) {
        clearInterval(interval);
        res();
      }
      fn();
    }, intervalMs);
  })
}

function run() {
  fn = (v, x) => {
    // print(v,x)
    return 200 * constrain(sin((x + v * 2) * PI + PI), 0.001, 1)
  }

  const times = 300;


  runFn(3, times, () => {
    cube.v += 1 / times;
  })
  .then(() => { cube.v = 0})
  // .then(() => runFn(3, times, () => {
  //   cube.v -= 1 / times;
  // }));
}

class Cubeo {
  constructor (n, s, center) {
    this.n = n;
    this.s = s;
    this.center = center;
    this.v = 0;
  }


  renderCube(pt, offsetVec) {
    push();
    translate(pt.x, pt.y, pt.z);
    const col = color(offsetVec.x, offsetVec.y, offsetVec.z);
    // fill();
    // pointLight(col, pt);
    ambientMaterial(col)
    strokeWeight(.75)
    box(this.s);
    pop();
  }

  getTransformValue(fn = () => 0, val) {
    return fn(this.v, val);
  }


  render(fn) {
    // print(this.v);
    for(let z = 0; z < this.n; z++) {
      const offset = this.getTransformValue(fn, (z+1) / this.n);
      for(let y = 0; y < this.n; y++) {
        for(let x = 0; x < this.n; x++) {
          const shift = this.n % 2 ? floor(this.n/2) : floor(this.n/2) - .5;
          const pt = createVector(x,y,z).sub(shift,shift,shift).mult(this.s);
          const offsetVec = pt.copy().setMag(offset);
          pt.add(this.center).add(offsetVec);
          this.renderCube(pt, offsetVec);
        }
      }
    }
  }
}


Dw.EasyCam.prototype.apply = function(n) {
  var o = this.cam;
  n = n || o.renderer,
  n && (this.camEYE = this.getPosition(this.camEYE), this.camLAT = this.getCenter(this.camLAT), this.camRUP = this.getUpVector(this.camRUP), n._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2], this.camLAT[0], this.camLAT[1], this.camLAT[2], this.camRUP[0], this.camRUP[1], this.camRUP[2]))
};