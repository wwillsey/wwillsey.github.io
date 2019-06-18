/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let containers;
let music, amplitude;

let rows = 3;
let cols = 3;
const operators = [
  '+',
  '-',
  'sin',
  'cos',
  'atan',
  '*',
  '/',
  'dist',
  'dup',
  // 'drop',
  'rotate',
  // 'exp',
];
const symbols = [
  'x',
  'y',
  'distFromMiddle',
  'amp',
  // 'w',
  // 'h',
  't',
];
const programLength = 25;
const mutateBy = 2;

function preload() {
  music = loadSound('http://localhost:3000/geneticLanguage/sounds/static_snow.mp3');
}

function keyPressed(){
  switch (keyCode) {
    case ENTER:
      cull();
      // redraw();
      break;
    case BACKSPACE:
      remove();
  }
}

function selectAtMouse() {
  const col = floor(mouseX / width * cols);
  const row = floor(mouseY / height * rows);

  if (col < cols && row < rows) {
    return containers[row][col];
  }
}

function mousePressed() {
  selectAtMouse().toggleSelection();
}


function setup() {
  createCanvas(1400, 800);
  containers = Array.from({length: rows}, (v, row) => Array.from({length: cols}, (vv, col) => new Container(20, 20, row, col)));
  // noLoop();
  noSmooth()
  music.play();
  amplitude = new p5.Amplitude();
  frameRate(60)
  renderAll();
}

function draw() {
  renderAll()
  showExpHovered();
  fill(255);
  var level = amplitude.getLevel();
  var size = map(level, 0, 1, 0, 200);
  ellipse(width/2, height/2, size, size);
}

function showExpHovered() {
  fill(color(0))
  rect(0,0, width, 20);
  fill(color('white'));
  const container = selectAtMouse();
  if (container)
    text(container.exp.map(val => typeof(val) === 'number' ? val.toFixed(3) : val), 10, 10);
}

function renderAll() {
  containers.forEach(row => row.forEach(container => container.render()));
}

function getRandomFrom(l, notThis) {
  let choice;
  do {
    choice = random(l);
  } while (notThis != undefined && choice === notThis)
  return choice;
}

function genTerm() {
  const rand = random();
  if (rand < .1) {
    return random(-1,1)
  }
  if (rand < .3) {
    return getRandomFrom(symbols)
  }
  return getRandomFrom(operators)
}

function genExp(length) {
  return Array.from({length}, genTerm)
}

function render(exp, canvas) {
  canvas.background(0);
  canvas.strokeWeight(0);
  const amp = amplitude.getLevel();
  for(let y = 0; y < canvas.height; y++) {
    for(let x = 0; x < canvas.width; x++) {
      const t = (frameCount) / 3;
      const env = {
        x: map(x, 0, canvas.width, -1, 1, true),
        y: map(y, 0, canvas.height, -1, 1, true),
        distFromMiddle: map(dist(canvas.width / 2, canvas.height / 2, x, y), 0, dist(canvas.width / 2, canvas.height / 2,0,0), 0, 1),
        amp,
        // h: canvas.height,
        // w: canvas.width,
        t,//: t > 1 ? 2-t : t,
      };

      const res = evalExp(exp, env).map(val => {
        if (val > 1) {
          // print(val)
        }
        return constrain(abs(val) * 255, 0, 255)
      });
      // print(x,y,map(x, 0, canvas.width, -1, 1, true), map(y, 0, canvas.height, -1, 1, true), res);
      const resultColor = color(res);
      canvas.stroke(resultColor);
      canvas.point(x,y);
    }
  }
}

function safeDivide(a,b) {
  return b === 0 ? 0 : a / b;
}


function evalExp(exp, env) {
  const stack = [];
  const pop = () => {
    return stack.pop() || 0;
  }
  exp.forEach(val => {
    switch (val) {
      case '+': stack.push(pop() + pop()); break;
      case '-': stack.push(pop() - pop()); break;
      case 'sin': stack.push(sin(pop())); break;
      case 'cos': stack.push(cos(pop())); break;
      case 'atan': stack.push(atan2(pop(), pop())); break;
      case '/': stack.push(safeDivide(pop(), pop())); break;
      case '*': stack.push(pop() * pop()); break;
      case 'dist': stack.push(dist(pop(), pop(), pop(), pop())); break;
      case 'dup': const x = pop(); stack.push(x); stack.push(x); break;
      case 'drop': pop(); break;
      case 'rotate': stack.length > 0 && stack.push(stack.splice(0,1)[0]); break;
      case 'exp': stack.push(pow(stack.pop(), stack.pop())); break;
      case 'atan': stack.push(atan2(pop(), pop())); break;
      default:
        stack.push(env[val] != undefined ? env[val] : val);
    }
  });
  return [pop(), pop(), pop()];
}

function expToString(exp) {
  return exp.join(' ');
}

function mutateExp(exp) {
  const res = exp.slice();
  if (random() < .5) {
    let n = mutateBy;
    while (n--) {
      const idx = floor(random(0, res.length));
      res[idx] = genTerm();
    }
  } else {
    const idx = floor(random(0, res.length));
    res.push(...res.splice(idx, 4))
  }
  return res;
}

function mergeExps(expDest, expSrc) {
  const res = expDest.slice()
  const idx1 = floor(random(0, expDest.length))
  const idx2 = floor(random(0, expDest.length))
  // print(idx1, idx2)
  arrayCopy(expSrc, min(idx1, idx2), res, min(idx1, idx2), abs(idx1 - idx2));
  return res;
}

function cull() {
  const toKill = []
  const survivors = []
  containers.forEach(row => row.forEach(container => {
    const toAddTo = container.selected ? survivors : toKill;
    toAddTo.push(container);
  }));

  toKill.forEach(container => {
    const survivor = random(survivors);
    container.exp = random() < .5 ?
      mutateExp(survivor.exp) :
      mergeExps(random(survivors).exp, survivor.exp);
    // container.render();
  })
  survivors.forEach(container => container.toggleSelection())
  containers.forEach(row => row.forEach(container => container.render()));
}


class Container {
  constructor(w,h, row, col) {
    this.canvas = createGraphics(w, h);
    this.selected = false;
    this.exp = genExp(programLength);
    this.row = row;
    this.col = col;
  }

  render() {
    const x = this.col * width / cols;
    const y = this.row * height / rows;
    render(this.exp, this.canvas);
    image(this.canvas, x, y, width / cols, height / cols);

    if (this.selected) {
      fill(169, 32, 54, 100);
      noStroke();
      rect(x, y, width / cols, height / cols);
    }
  }

  toggleSelection() {
    const x = this.col * width / cols;
    const y = this.row * height / rows;
    this.selected = !this.selected;
    if (this.selected) {
      fill(169, 32, 54, 100);
      noStroke();
      rect(x, y, width / cols, height / cols);
    } else {
      this.render();
    }
  }
}