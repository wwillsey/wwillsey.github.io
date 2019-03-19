let hillArgs;


function setup() {
  createCanvas(2200, 700);
  strokeJoin(ROUND);

  hillArgs = {
    numHills: 30,
    cols: [color(29, 50, 140), color(124, 129, 141)],
    separation: 5,
    nSamples: 500,
    noiseScale: .005,
    noiseAmp: 200,
    noiseChange: 25,
    strokeCol: 230,
  };


}

function draw() {
  background(249, 136, 16);
  new HorizonHills(hillArgs).render()
}





class HorizonHills {
  constructor(args) {
    this.numHills = args.numHills;
    this.cols = args.cols;
    this.horizonBase = args.horizonBase || height * .6
    this.separation = args.separation;
    this.nSamples = args.nSamples;
    this.noiseScale = args.noiseScale;
    this.noiseAmp = args.noiseAmp;
    this.strokeCol = args.strokeCol || 255;
    this.noiseChange = args.noiseChange;
  }

  sampleNoise(a, b) {
    return noise(a * this.noiseScale + frameCount / 50, b * this.noiseScale + + frameCount / 1000) * this.noiseAmp;
  }

  renderHill(c, baseHeight, noiseSeed = random(0, 100000)) {

    fill(c);
    stroke(this.strokeCol);
    strokeWeight(4)
    beginShape();
    vertex(-width, height);
    for (let x = 0; x <= width; x += width / this.nSamples) {
      const y = this.sampleNoise(x, noiseSeed) + baseHeight;
      vertex(x,y);
    }
    vertex(width * 2, height);
    endShape(CLOSE);
  }
  render() {
    for(let i = this.numHills - 1; i >= 0; i--) {
      const c = lerpColors(this.cols, i / (this.numHills - 1));
      const base = this.horizonBase - this.separation * i;
      print(base)
      this.renderHill(c, base, i * this.noiseChange);
    }
  }
}

function lerpColors(colors, v) {
  v = constrain(v, 0, .99999999);
  const indx = v * (colors.length - 1);
  const col1 = colors[floor(indx)];
  const col2 = colors[floor(indx) + 1];
  return lerpColor(col1, col2, indx - floor(indx));
}

Dw.EasyCam.prototype.apply = function(n) {
  var o = this.cam;
  n = n || o.renderer,
  n && (this.camEYE = this.getPosition(this.camEYE), this.camLAT = this.getCenter(this.camLAT), this.camRUP = this.getUpVector(this.camRUP), n._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2], this.camLAT[0], this.camLAT[1], this.camLAT[2], this.camRUP[0], this.camRUP[1], this.camRUP[2]))
};