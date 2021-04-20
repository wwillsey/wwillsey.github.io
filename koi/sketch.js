/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let gui, E

let time = 0;
p5.disableFriendlyErrors = true


function keyPressed() {
  switch (keyCode) {
    case ALT:
      saveSvg('out');
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(displayWidth, displayHeight);

  gui = new GUI();
  E = new p5.Ease();

  gui.add('seed', 1, 0, 1000,1).onChange(redraw);
  gui.add('n', 1, 0, 1000,1).onChange(redraw);
  gui.add('nSteps', 50, 0, 1000,1).onChange(redraw);
  gui.add('step', 10, 0, 100).onChange(redraw);
  gui.add('thickMult', 200, 0, 1000).onChange(redraw);
  gui.add('randomDir', .00001, 0, 10).onChange(redraw);
  gui.add('simplify', .1, 0, 1).onChange(redraw);
  gui.add('noiseScale', .01, 0, 1).onChange(redraw);
  gui.add('noiseOffset', .1, 0, 1).onChange(redraw);
  gui.add('noiseMult', 0, 0, 100).onChange(redraw);
  gui.add('timeSpeed', 0, 0, 1000).onChange(redraw);

}


function draw() {
  time += gui.timeSpeed
  // print(time)
  // randomSeed(gui.seed)
  randomSeed(gui.seed)
  noiseJs.seed(gui.seed);
  background("blue")

  for(let i = 0; i < gui.n; i++) {
    const pos = createVector(random(width), random(height));
    // print(pos)
    const thicknessPts = Array.from({length: gui.nSteps}, (a,idx) => {
      const v = idx / gui.nSteps;

      let thick = E["iterativeSquareRoot"](v) - E["linear"](v);
      // print(thick)
      return thick;
    })

    const rotateFn = (step, spine) => {
      spine.sub(time * gui.noiseScale, 0);
      const n = (noiseJs.perlin3(spine.x * gui.noiseScale, spine.y * gui.noiseScale, 0) - noiseJs.perlin3(spine.x * gui.noiseScale, spine.y * gui.noiseScale, gui.noiseOffset)) * gui.noiseMult
      return n;
    }


    // print(thicknessPts)
    const fish = new Fish(pos, (i) => thicknessPts[i], rotateFn)

    fill(lerpColor(color('blue'), color('white'), map(E['exponentialOut'](i / gui.n), 0, 1, .2, 1)))

    fish.render();
  }
  // noLoop();

}


class Fish {
  constructor (pos, thicknessFn, rotateFn) {
    this.pos = pos;
    this.thicknessFn = thicknessFn;
    this.rotateFn = rotateFn;
  }

  getPts(n, step) {
    let dir = createVector(step, 0);
    // let spine = [this.pos.copy()];
    let spine = this.pos.copy();
    let top = []
    let bottom = [];
    for(let i = 0; i < n; i++) {
      dir.rotate(this.rotateFn(i, spine.copy()))
      // spine.push(this.spine[i].copy.add(dir));
      spine.add(dir);
      // point(spine.x, spine.y)
      // dir.rotate(-PI/2);
      const thick = this.thicknessFn(i) * gui.thickMult;
      const thickV = dir.copy().rotate(-PI/2).setMag(thick/2);
      top.push(spine.copy().add(thickV));
      thickV.rotate(PI);
      bottom.push(spine.copy().add(thickV))

      // line(top[i].x, top[i].y, spine.x, spine.y)
      // line(bottom[i].x, bottom[i].y, spine.x, spine.y)
    }
    // top.sort((a,b) => a.x - b.x)
    // bottom.sort((a,b) => a.x - b.x)
    return {top, bottom}
  }

  render() {
    const {top, bottom} = this.getPts(gui.nSteps, gui.step);
    // print(top, bottom)
    beginShape();
    const pts = simplify(top.concat(reverse(bottom)), gui.simplify);

    pts.forEach(pt => {
      vertex(pt.x, pt.y );
    })
    endShape();
  }


}