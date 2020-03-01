/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let S, gui,c;
function keyPressed() {
  switch (keyCode) {
    case ALT:
      // save('out','svg');
      // S.render()
      const svg = createGraphics(width, height, SVG);
      S.render(gui.steps, svg);
      svg.save('out', 'svg')
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
  c = createGraphics(displayWidth, displayHeight)

  // svg = new SvgSavable(c);

  noFill();
  strokeWeight(1);
  stroke(0);

  gui = new GUI();
  gui.add('steps', 10, 0, 20000).onFinishChange(redraw);
  gui.add('v0_mult', 1, 0, 1000).onChange(redraw);
  gui.add('v0_radius', 100, 0, 1000).onChange(redraw);
  gui.add('v0_radiusMod', 0, -1000, 1000).onChange(redraw);
  gui.add('v0_radiusFreq', 0, 0, 100).onChange(redraw);

  gui.add('v1_mult', 1, 0, 1000).onChange(redraw);
  gui.add('v1_radius', 100, 0, 1000).onChange(redraw);
  gui.add('v1_radiusMod', 0, -1000, 1000).onChange(redraw);
  gui.add('v1_radiusFreq', 0, 0, 100).onChange(redraw);


  gui.add('v2_x', 0, -1000, 1000).onChange(redraw);
  gui.add('v2_y', 0, -1000, 1000).onChange(redraw);
  gui.add('v3_noiseScale', .01, 0, .1).onChange(redraw);
  gui.add('v3_noiseMult', 10, 0, 100).onChange(redraw);

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
    F.circle(gui.v0_radius, gui.v0_mult, (i) => sin(i * gui.v0_radiusFreq * PI) * gui.v0_radiusMod),
    // F.translate(gui.v1_radius, 0),
    F.heart(gui.v1_radius, gui.v1_mult, (i) => sin(i * gui.v1_radiusFreq * PI) * gui.v1_radiusMod),
  ]);

  S.render(gui.steps, c);
  image(c, 0, 0);
}


class Spirograph {
  constructor(fns) {
    this.fns = fns;
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
    return pts;
  }

  render(steps, c) {
    c.background(255)
    c.beginShape();
    this.getPts(steps).forEach(pt => {
      c.vertex(pt.x, pt.y);
    })
    c.endShape();
  }

}


const F = {
  translate: (x,y) => ({
    fn: () => createVector(x, y),
    input: () => {},
  }),
  circle: (radius, times = 1, radiusModify = () => 0) => ({ // draw circle
    fn: ({radius, rotate}) => createVector(radius, 0).rotate(rotate),
    input: (i) => ({
      rotate: times * i * TWO_PI,
      radius: radius + radiusModify(i),
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