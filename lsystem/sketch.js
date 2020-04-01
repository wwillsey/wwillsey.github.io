/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let gui, state, drawing;

let linesToRender;

let newDrawing = true;
let LC;


const drawings = [
  {
    axiom: 'F',
    productions: {
      'F': 'F[+FF][-FF]F[-F][+F]F',
    },
    gui: {
      rotateBy: 35
    }
  },
]


function keyPressed() {
  switch (keyCode) {
    case ALT:
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
  const c = createCanvas(displayWidth, displayHeight, SVG);
  // print(c)
  // matrix = new Matrix(c.drawingContext);
  stroke(0);
  noFill();

  gui = new GUI();
  gui.add('iterations', 1, 1, 10, 1).onChange(redraw);
  gui.add('stepSize', 10, 0, 100).onChange(redraw);
  gui.add('rotateBy', 60, 0, 360).onChange(redraw);
  gui.add('lineLengthScaleFactor', .9, 0, 2).onChange(redraw);
  gui.add('offsetX', 0, -width, width).onChange(redraw);
  gui.add('offsetY', 0, -height, height).onChange(redraw);
  gui.add('renderSpeed', 1000, 1, 10000).onChange(redraw);
  gui.add('drawing', 0, 0, drawings.length - 1, 1).onChange(() => {
    newDrawing = true;
    redraw();
  });

}


function draw() {
  noLoop();
  background(255);
  // LC =new LinesCollection();
  if(newDrawing) {
    drawing = drawings[round(gui.drawing)];
    gui.stepSize = drawing.gui.stepSize || gui.stepSize;
    gui.rotateBy = drawing.gui.rotateBy || gui.rotateBy;
    newDrawing = false;
  }

  linesToRender = new LineReducer({
    modBy: .00000001,
    nFixed: 8,
  });

  const stateStack = [];
  state = {
    stepSize: gui.stepSize,
    rotateBy: gui.rotateBy,
    cursorPosition: createVector(0,0),
    cursorRotation: 0,
  }


  // matrix.reset();
  myTranslate(width/2 + gui.offsetX, height/2 + gui.offsetY, state.cursorRotation)
  var system = new LSystem({
    axiom: drawing.axiom,
    productions: drawing.productions,
    finals: {
      '+': () => { myRotate((Math.PI/180) * state.rotateBy) },
      '-': () => { myRotate((Math.PI/180) * -state.rotateBy) },
      'F': () => { // draw line + move
        const p1 = state.cursorPosition.copy();
        const p2 = createVector(0, -state.stepSize).rotate(state.cursorRotation).add(p1);
        myLine(p1.x, p1.y, p2.x, p2.y);

        // if(abs(p1.x - p2.x) < .1) {
        //   LC.add('v', p1.x, [p1.y, p2.y].sort());
        // }
        // if(abs(p1.y - p2.y) < .1) {
        //   LC.add('h', p1.y, [p1.x, p2.x].sort());
        // }
        // lineToDraw.push({x: p1.x, y: p1.y});
        // lineToDraw.push({x: p2.x, y: p2.y});
        // vertex(p1.x, p1.y);
        // vertex(p2.x, p2.y);

        myTranslate(0, -state.stepSize, state.cursorRotation);
        // print(matrix)
      },
      '[': () => { pushState(state, stateStack) },
      ']': () => {
        state = popState(stateStack)
        // simplifyAndDraw(lineToDraw)
        lineToDraw = [];
      },
      '>': () => { state.stepSize *= gui.lineLengthScaleFactor}
     }
  })

  system.iterate(round(gui.iterations));

  // beginShape();
  let lineToDraw = [];
  system.final()
  // simplifyAndDraw(lineToDraw)
  // LC.render();



  // print(`n lines: ${linesToRender.length}`)
  // linesToRender = reduceLines(linesToRender);
  // print(`n lines: ${linesToRender.length}`)

  // linesToRender.forEach((...args) => {
  //   // print(...args[0])
  //   line(...args[0]);
  // })
  let i = 0;
  const startRenderTime = Date.now();
  linesToRender.reduce();
  linesToRender.render();
  // const interval = setInterval(() => {
  //   for(let idx = 0; idx < gui.renderSpeed; idx++) {
  //     if (i == linesToRender.length) {
  //       clearInterval(interval);
  //       print(`done rendering in ${Date.now() - startRenderTime} ms`);
  //       // setTimeout(() => {
  //       //   redraw();
  //       // }, 50);
  //       return;
  //     }
  //     line(...linesToRender[i]);
  //     i++;
  //   }
  // }, 5);
}


function simplifyAndDraw(pts) {

  const newPts = simplify(pts, .1, false);
  // print(pts.length, newPts.length)
  beginShape();
  for(let i = 0; i < newPts.length; i++) {
    vertex(newPts[i].x, newPts[i].y);
  }
  endShape();
}

function pushState(state, stateStack) {
  // print('pushing state', state, stateStack);
  // myPush();
  const oldState = {
    ...state,
    cursorPosition: state.cursorPosition.copy(),
  }
  stateStack.push(oldState);
}

function popState(stateStack) {
  // print('popping state', stateStack);

  // myPop();
  return stateStack.pop();
}

function myRotate(amt) {
  // matrix.rotate(amt);
  state.cursorRotation += amt;
}

function myTranslate(x,y, ang) {
  // state.translation.add(x,y);
  // matrix.translate(x,y)
  const v = createVector(x,y).rotate(ang);
  state.cursorPosition.add(v.x, v.y);
}

function myLine(...args) {
  // const p1 = matrix.applyToPoint(x1, y1);
  // const p2 = matrix.applyToPoint(x2, y2);

  // linesToRender.push(args);
  linesToRender.add(...args);
}


function reduceLines(lines) {
  const endPoints = {
  }

  lines.forEach(([x1,y1, x2,y2]) => {
    x1 = floor(x1);
    y1 = floor(y1);
    x2 = floor(x2);
    y2 = floor(y2);

    const startPt = y1*width + x1;
    const endPt = y2*width + x2;

    if (endPoints[startPt]) {
      endPoints[startPt].push(endPt);
    } else {
      endPoints[startPt] = [endPt];
    }
    if (endPoints[endPt]) {
      endPoints[endPt].push(startPt);
    } else {
      endPoints[endPt] = [startPt]
    }
  });

  lines.forEach(([x1,y1, x2,y2]) => {
    x1 = floor(x1);
    y1 = floor(y1);
    x2 = floor(x2);
    y2 = floor(y2);
    const startPt = y1*width + x1;
    const endPt = y2*width + x2;
    const endPts = endPoints[startPt];
    // print({x1,y1,x2,y2, startPt, endPt, endPoints: JSON.stringify(endPoints)});


    const endDist = (x2 - x1) ** 2 + (y2 - y1) ** 2;

    if(endPts && endPts.length) {
      for(let i = 0; i < endPts.length; i++) {
        const testEndPtVal = endPts[i];

        const x3 = testEndPtVal % width;
        const y3 = floor(testEndPtVal / width); // maybe this
        // print(x3,y3, testEndPtVal);

        if (collinear(x3, y3, x1, y1, x2, y2)) {
          const testDist = (x3 - x1) ** 2 + (y3 - y1) ** 2;
          const endsDist = (x2 - x3) ** 2 + (y2 - y3) ** 2;
          // print('not Adding', endPts.length, endDist, testDist, endsDist )



          if (endsDist > testDist && endsDist > endDist) {
            // print('case 1')
            endPoints[endPt] = (endPoints[endPt] || []).filter((p) => p != startPt);
            endPoints[testEndPtVal] = (endPoints[testEndPtVal] || []).filter((p) => p != startPt);
          } else if (endDist > testDist && endDist > endsDist) {
            // print('case 2')
            endPoints[startPt] = (endPoints[startPt] || []).filter((p) => p != testEndPtVal);
            endPoints[endPt] = (endPoints[endPt] || []).filter((p) => p != testEndPtVal);
          } else if (testDist > endDist && testDist > endsDist) {
            // print('case 3')
            endPoints[startPt] = (endPoints[startPt] || []).filter((p) => p != endPt);
            endPoints[testEndPtVal] = (endPoints[testEndPtVal] || []).filter((p) => p != endPt);
          }
          return
        } else {
          // print('not colinear')
        }
      }
    }})
  const newLines = [];
  Object.keys(endPoints).forEach(ptVal => {
    const x1 = ptVal % width;
    const y1 = floor(ptVal / width); // maybe this

    endPoints[ptVal].forEach(endPt => {
      const x2 = endPt % width;
      const y2 = floor(endPt / width); // maybe this
      newLines.push([x1,y1, x2,y2]);
    })
  })
  print('new lines', newLines)
  return newLines;

}

function collinear(x1, y1, x2, y2, x3, y3) {

/* Calculation the area of
triangle. We have skipped
multiplication with 0.5
to avoid floating point
computations */

  let a = x1 * (y2 - y3) +
  x2 * (y3 - y1) +
  x3 * (y1 - y2);
  // print('colinear check', x1, y1, x2, y2, x3, y3, a);
 return abs(a) < .0001;
}


// function reduceLines(lines) {
//   const lookup = {};

//   lines = lines.map(([x1,x2,y1,y2]) => {
//     if (x1 <= x2) {
//       return [x1,x2,y1,y2];
//     } else {
//       return [x2,x1,y2,y1];
//     }
//   })

//   lines.forEach(([x1,x2,y1,y2]) => {
//     const slope = (y2-y1)/(x2-x1);
//     if (abs(slope) == Infinity) slope = Infinity;

//     const y = y1 -
//   })
// }

class LinesCollection {
  constructor() {
    this.lines = {
      h: {},
      v: {},
    };
  }

  add(dir, main, [l1, l2]) {
    // print('adding ', dir, main, [l1, l2])
    if (!this.lines[dir][main]) this.lines[dir][main] = [];

    let added = false;
    this.lines[dir][main].forEach(([p1,p2], i) => {
      if (l1 <= p1) {
        if (l2 >= p1) {
          this.lines[dir][main][i] = [l1, max(l2, p2)];
          added = true;
        }
      } else {
        if (l1 <= p2) {
          this.lines[dir][main][i] = [p1, max(l2, p2)];
          added = true;
        }
      }

    });
    if (!added) {
      this.lines[dir][main].push([l1,l2]);
    }
  }


  render() {
    let cnt = 0;
    Object.keys(this.lines.v).forEach(k => {
      this.lines.v[k].forEach(([l1,l2]) => {
        line(k, l1, k, l2);
        cnt++;
      });
    });

    Object.keys(this.lines.h).forEach(k => {
      this.lines.h[k].forEach(([l1,l2]) => {
        line(l1, k, l2, k);
        cnt++
      });
    });

    print('rendered lines', cnt)
  }
}