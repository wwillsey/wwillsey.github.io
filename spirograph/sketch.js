/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let S, gui;
function keyPressed() {
  switch (keyCode) {
    case ALT:
      // save('out','svg');
      // S.render()
      saveSvg('out')
      break;
    case SHIFT:
      noLoop();
      break;
    default:
      break;
  }
}

function setup() {
  createCanvas(displayWidth, displayHeight, SVG);
  // c = createGraphics(displayWidth, displayHeight)

  // svg = new SvgSavable(c);

  noFill();
  strokeWeight(1);
  stroke(0);

  gui = new GUI();
  gui.add('steps', 10, 0, 20000).onFinishChange(redraw);
  gui.add('v0_mult', 1, 0, 1000,1).onChange(redraw);
  gui.add('v0_radius', 100, 0, 1000).onChange(redraw);
  gui.add('v0_radiusMod', 0, -10, 10).onChange(redraw);
  gui.add('v0_radiusFreq', 0, 0, 100,1).onChange(redraw);

  gui.add('v1_mult', 1, 0, 1000,1).onChange(redraw);
  gui.add('v1_radius', 100, 0, 1000).onChange(redraw);
  gui.add('v1_radiusMod', 0, -100, 100).onChange(redraw);
  gui.add('v1_radiusFreq', 0, 0, 100,1).onChange(redraw);


  gui.add('v2_x', 0, -1000, 1000).onChange(redraw);
  gui.add('v2_y', 0, -1000, 1000).onChange(redraw);
  gui.add('v3_noiseScale', .01, 0, 1, .001).onChange(redraw);
  gui.add('v3_noiseMult', 0, 0, 10).onChange(redraw);
  gui.add('f', 0, -1000, 1000, 1).onChange(redraw);
  gui.add('minD', 0, 0, 100, 1).onChange(redraw);
  gui.add('dPow', 0, 0, 10, .001).onChange(redraw);

  gui.add('ptsSimplify', 0, 0, 1).onChange(redraw);

  noLoop();
}


function draw() {
  noLoop();
  background(255);

  S = new Spirograph(
  [
    F.translate(width/2, height/2),
    F.translateOverTime(gui.v2_x, gui.v2_y),
    F.circle(gui.v0_radius, gui.v0_mult),
    F.circle(gui.v0_radius, gui.v0_mult, (i) => cos(i * gui.v0_radiusFreq * PI) * gui.v0_radiusMod),
    F.circle(gui.v1_radius, gui.v1_mult, (i) => noise(cos(i * gui.v1_radiusFreq * PI) * gui.v3_noiseScale) * gui.v3_noiseMult),
    // F.translate(gui.v1_radius, 0),
    // F.heart(gui.v1_radius, gui.v1_mult, (i) => sin(i * gui.v1_radiusFreq * PI) * gui.v1_radiusMod),
  ],
  [
    {
      x: width/2 + 100,
      y: height/2,
      f: gui.f,
    }
  ]
  );

  S.render(gui.steps);
  // image(c, 0, 0);
}


class Spirograph {
  constructor(fns, magnetPts) {
    this.fns = fns;
    this.magnetPts = magnetPts;
  }

  applyMagnetPts(pts) {
    pts.forEach((pt) => {
      this.magnetPts.forEach((magnet) => {
        const dy = magnet.y - pt.y;
        const dx = magnet.x - pt.x;
        const ang = atan2(dy, dx);
        const d = dy ** 2 + dx ** 2;

        const force = createVector(magnet.f / pow(max(d, gui.minD), gui.dPow), 0).rotate(ang);
        pt.x += force.x;
        pt.y += force.y;
      })
    })
  }

  getPts(steps) {
    const pts = Array.from({length: steps + 1}, (v, i) => {
      const cursor = createVector(0,0);
      this.fns.forEach(({fn, input}) => {
        // const ptBefore = cursor.copy();
        const inp = input(i / steps);
        cursor.add(fn(inp));
        // line(ptBefore.x, ptBefore.y, cursor.x, cursor.y);
      });

      return {x: cursor.x, y: cursor.y};
    });
    if (gui.ptsSimplify > 0) {
      const simplified = simplify(pts, gui.ptsSimplify, false);
      print(`reduced ${pts.length} pts to ${simplified.length} with threshold ${gui.ptsSimplify}`);
      return simplified;
    }

    this.applyMagnetPts(pts);
    return pts;
  }

  render(steps) {
    beginShape();
    this.getPts(steps).forEach(pt => {
      vertex(pt.x, pt.y);
    })
    endShape();
  }

}


const F = {
  translate: (x,y) => ({
    fn: () => createVector(x, y),
    input: () => {},
  }),
  circle: (radius, times = 1, radiusModify = () => 1) => ({ // draw circle
    fn: ({radius, rotate}) => createVector(radius, 0).rotate(rotate),
    input: (i) => ({
      rotate: times * i * TWO_PI,
      radius: radiusModify(i) * radius,
    })
  }),
  translateOverTime: (x,y) => ({
    fn: (inp) => createVector(x * inp.val, y * inp.val),
    input: (inp) => ({
      val: inp
    }),
  }),
  heart: (radius, times = 1, radiusModify = () => 0) => ({ // draw circle
    fn: ({radius, rotate}) => createVector(
      16 * (sin(rotate) ** 3),
      13 * cos(rotate) - 5 * cos(2 * rotate) - 2 * cos(3 * rotate) - cos(4 * rotate)
    ).mult(radius),
    input: (i) => ({
      rotate: times * i * TWO_PI,
      radius: radius + radiusModify(i),
    })
  }),
}




class SvgSavable {
  constructor(c) {
    this.c = c;
    this.fns = ['line','stroke', 'strokeWeight', 'background', 'fill', 'noFill']
    print(c);

    this.svgCanvas = createGraphics(c.width,c.height, SVG);
    print(this.svgCanvas)

    this.actions = [];
    this.fns.forEach(k => {
      print(k)
      const obj = p5.Renderer2D.prototype.hasOwnProperty(k) ? p5.Renderer2D.prototype : p5.prototype;
      const fn = obj[k].bind(this.svgCanvas);
      obj[k] = (...args) => {
        print(`${k} called !`, ...args);
        return fn(...args)
      }
      print(fn)
      // try {
      //   this.c[k] = () => {
      //     this.actions.push(() => {
      //       try {
      //         this.svgCanvas[k].apply(arguments)
      //       } catch (e) {
      //         print(e);
      //       }
      //     })
      //     return fn.apply(arguments);
      //   }
      // } catch (e) {
      //   print(e)
      // }

    })
  }

  save(name) {
    this.actions.forEach(f => f());
    this.svgCanvas.save(name, 'svg');
  }
}