/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let gui, img;

p5.disableFriendlyErrors = true;


// function preload() {
//   img = loadImage('../media/IMG_5119.JPG');
// }


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

  createCanvas(3840, 2160);

  gui = new GUI();
  gui.add('pts', 1000, 0, 1000000, 1).onChange(redraw);
  gui.add('attempts', 5, 0, 50, 1).onChange(redraw);
  gui.add('minDist', 1000, 0, 10000, .01).onChange(redraw);
  gui.add('noiseScale', .01, 0, 1, .000000001).onChange(redraw);
  gui.add('noiseZ', 0, 0, 1000).onChange(redraw);
  gui.add('nEdges', 5, 0, 1000).onChange(redraw);
  gui.add('scale', 1, 0, 20).onChange(redraw);
  gui.add('vPow', 1, 0, 10, .0000001).onChange(redraw);
  gui.add('vMult', 1, 0, 100, .0000001).onChange(redraw);
  gui.add('vOffset', 1, -100, 100, .0000001).onChange(redraw);
  gui.add('maxEdgeDist', 1000000, 0, 1000000, 1).onChange(redraw);
  gui.add('minEdges', 0, 0, 100, 1).onChange(redraw);
  gui.add('strokeWeight', 1, 0, 100, .001).onChange(redraw);
  gui.add('alpha', 255, 0, 255, 1).onChange(redraw);
  gui.add('freq', .01, 0, 1, .000001).onChange(redraw);
  // img.loadPixels();
  noLoop();
}


function draw() {
  background(255);
  randomSeed(0)
  strokeWeight(gui.strokeWeight);


  // stroke(0,255,255, gui.alpha);
  // makeAndDraw('c');
  
  // stroke(255,0,255, gui.alpha);
  makeAndDraw();
  
  // stroke(255,255,0, gui.alpha);
  // makeAndDraw('y');
  
  
  // stroke(0, gui.alpha);
  // makeAndDraw('k');
}


function makeAndDraw(colorType) {
  const N = new Network({
      dimensions: ['x','y'],
      width: img ? img.width : width,
      height: img ? img.height : height,

      v: (x,y) => {
        
        const distFromCenter = sqrt((x - width/2) ** 2 + (y - height/2) ** 2);
        let v = gui.vOffset;
        v *= gui.vMult 
        v *= (noise(x * gui.noiseScale, y * gui.noiseScale, gui.noiseZ) ** gui.vPow)
        v *= cos((distFromCenter + frameCount * 10) * gui.freq);
        return abs(v + .00001);
      }
      // v: (x,y) => {
      //   const i = (floor(x) + floor(y) * img.width) * 4;

      //   const r = img.pixels[i];
      //   const g = img.pixels[i+1];
      //   const b = img.pixels[i+2];

      //   const cmyk = rgb2cmyk(r, g, b, true);
      //   const v = cmyk[colorType];
        
      //   return pow(v, gui.vPow) * gui.vMult;
      // }
    });

    print(N.points)
    N.initVertices(gui.pts, gui.attempts);
    N.render();
}



class Network {
  constructor(opts) {
    this.opts = opts;
    const distance = function(a, b) {
      return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
    }
    this.distance = this.opts.distance || distance;
    this.points = this.opts.points || [];
    this.dimensions = this.opts.dimensions || ['x','y'];
    this.tree = new kdTree(this.points, this.distance, this.dimensions);
    this.edges = [];
    this.pointID = -1;
  }

  getRandomPt() {
    const pt = {
        x: random(0, this.opts.width),
        y: random(0, this.opts.height),
        id: this.pointID++,
      };

    pt.v = this.opts.v(pt.x, pt.y)
    return pt;
  }

  addPt(pt) {
    this.points.push(pt);
    this.tree.insert(pt);
  }

  rebalanceTree() {
    const start = this.tree.balanceFactor();
    const startTime = Date.now();
    this.tree = new kdTree(this.points, this.distance, this.dimensions);
    const end = this.tree.balanceFactor();

    print(`rebalanced tree from ${start} to ${end} in ${Date.now() - startTime}ms`);
  }

  initVertices(n, attempts) {
    const startTime = Date.now();

    if (this.points.length == 0) this.addPt(this.getRandomPt());

    while(n-- > 0) {
      const maxD = {d: -1, pt: null};
      for(let i = 0; i < attempts; i++) {
        const test = this.getRandomPt();
        const nearest = this.tree.nearest(test, 1, [max(gui.minDist * (1-test.v), 1)])[0];
        if (!nearest) {
          maxD.pt = test;
          i += attempts;

        } else {
          const [nearestPt, nearistDist] = nearest;
          if (maxD.d == -1 || (nearistDist > maxD.d)) {
            maxD.d = nearistDist;
            maxD.pt = test;
          }
        }
      }
      this.addPt(maxD.pt);
    }
    this.rebalanceTree();
    print('init took ', Date.now() - startTime);
  }

  getNearest(pt) {
    return (this.tree.nearest(pt, ceil(gui.nEdges * pt.v + .001), [gui.maxEdgeDist]) || [])
      .filter(([p,d]) => d != 0)
      .map(([p, d]) => {
        return p
      });
  }

  getGraph() {
    this.points.forEach(pt => {
      if(pt.nbors == undefined) {
        pt.nbors = {}
      }
      this.getNearest(pt).forEach(nbor => {
        pt.nbors[nbor.id] = nbor
        if(nbor.nbors) {
          nbor.nbors[pt.id] = null
        }
      });
    })
    this.points.forEach(pt => {
      pt.nbors = Object.values(pt.nbors).filter(v => v)
    });
  }

  render() {
  
    this.getGraph();

    print(this.points);

    this.points.forEach(pt => {
      // print(pt)


      const edges = pt.nbors;
      if(edges.length > gui.minEdges) {
        edges.forEach(edge => line(pt.x * gui.scale, pt.y * gui.scale, edge.x * gui.scale, edge.y * gui.scale));
      }

      // if (edges.length > 0) {
      //   strokeWeight(3);
      //   point(pt.x * gui.scale, pt.y * gui.scale);
      // }
    })
  }
}

var rgb2cmyk = function(r, g, b, normalized){
  var c = 1 - (r / 255);
  var m = 1 - (g / 255);
  var y = 1 - (b / 255);
  var k = Math.min(c, Math.min(m, y));

  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);

  if(!normalized){
      c = Math.round(c * 10000) / 100;
      m = Math.round(m * 10000) / 100;
      y = Math.round(y * 10000) / 100;
      k = Math.round(k * 10000) / 100;
  }

  c = isNaN(c) ? 0 : c;
  m = isNaN(m) ? 0 : m;
  y = isNaN(y) ? 0 : y;
  k = isNaN(k) ? 0 : k;

  return {
      c: c,
      m: m,
      y: y,
      k: k
  }
}