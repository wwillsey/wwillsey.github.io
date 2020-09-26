/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let music, fft, A;

function preload() {
  // music = loadSound('http://localhost:3000/geneticLanguage/sounds/static_snow.mp3');
}


function setup() {
  const c = createCanvas(400, 400);

  c.mousePressed(() => {
    getAudioContext().resume()
    fft = new p5.FFT();
    fft.smooth();
    music = new p5.AudioIn();
    music.start();

    A = new AudioCircle({
      pos: createVector(width / 2, height / 2),
      radius: 100,
      nPts: 40,
      nAudioBands: 100,
    })
  })

}

let source = 0;
function keyPressed(){
  switch (key) {
    case ' ':
    toggleMusic(); break;
    case ENTER:
      reset();
  }
}

function toggleMusic() {
  music.isPlaying() ? music.pause() : music.play();
}

function draw() {
  background(250);
  if (!A) return

  A.render();
}



class AudioCircle {
  constructor(opts) {
    this.opts = opts;
    this.fft = new p5.FFT();
    this.fft.setInput(music)
    this.fft.smooth();
  }

  updateAudioFFT() {
    let spectrum = this.fft.analyze();
    this.audioBands = this.fft.linAverages(this.opts.nAudioBands || 16).map(v => v / 255);

    this.audioBands.splice(this.audioBands.length * .3 + 1);
    const m = min(this.audioBands);
    // print(this.audioBands)
    this.audioBands = this.audioBands.map(v => {
      return v-m;
    }
    );
    // this.audioBands = ["bass", "lowMid", "mid", "highMid", "treble"].map(v => this.fft.getEnergy(v));
    // print(this.audioBands);
  }

  getAudioVal(ang) {
    // return noise(sin(ang / 2), frameCount / 100);
    const l = this.audioBands.length;
    const idx = round(map(l / 2 + sin(ang * 2) * l/2, 0, l, 0, l-1));
    // print(ang, idx)
    return this.audioBands[idx];
  }

  getCirclePoints() {
    const n = this.opts.nPts || 100;
    const pts = [];
    for(let ang = 0; ang < TWO_PI; ang += TWO_PI / n) {
      const audioVal = pow(this.getAudioVal(ang), 1)
      // print(audioVal);
      const pt = createVector(this.opts.radius - audioVal * this.opts.radius, 0).rotate(ang).add(this.opts.pos);

      pts.push(pt);
    }
    // pts.push(pts[0])
    return pts;
  }

  render() {
    // noStroke();
    // fill('blue')
    // circle(this.opts.pos.x, this.opts.pos.y, this.opts.radius * 2);
    this.updateAudioFFT();
    // fill(0);
    noFill();
    beginShape();
    this.getCirclePoints().forEach((pt) => {
      curveVertex(pt.x, pt.y);
    });
    endShape(CLOSE);
  }
}