/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let containers;

let rows = 4;
let cols = 4;
const operators = ['+', '-', 'sin'];
const symbols = ['x', 'y'];

function keyPressed(){
  switch (keyCode) {
    case ENTER:
      cull();
      // redraw();
  }
}

function mouseClicked() {
  const col = floor(mouseX / width * cols);
  const row = floor(mouseY / height * rows);

  if (col < cols && row < rows) {
    containers[row][col].toggleSelection();
  }
}


function setup() {
  createCanvas(800, 800);
  containers = Array.from({length: rows}, (v, row) => Array.from({length: cols}, (vv, col) => new Container(100, 100, row, col)));
  noLoop();
  noSmooth()
}

function draw() {
  containers.forEach(row => row.forEach(container => container.render()));
}

function getRandomFrom(l, notThis) {
  let choice;
  do {
    choice = random(l);
  } while (notThis != undefined && choice === notThis)
  return choice;
}

function genExp(depth) {
  const val = random();
  if (depth === 0 || val < .1)
    return getRandomFrom(symbols)
  if (val < .2)
    return random(-1, 1);
  else
    return {
      op: getRandomFrom(operators),
      children: Array.from({length: 2}, () => genExp(depth-1))
    }
}

function render(exp, canvas) {
  canvas.background(0);
  canvas.strokeWeight(0);
  for(let y = 0; y < canvas.height; y++) {
    for(let x = 0; x < canvas.width; x++) {
      const env = {
        x, y,
      };
      const result = abs(evalExp(exp, env) * 255);
      const resultColor = color(constrain(result, 0, 255));
      // const resultColor = color((x + y) * 10);
      canvas.stroke(resultColor);
      canvas.point(x,y);
    }
  }
}


function evalExp(exp, env) {
  switch (typeof(exp)) {
    case 'number':
      return exp;
    case 'string':
      return env[exp]
    case 'object':
      const op = exp.op;
      const childrenVals = exp.children.map(child => evalExp(child, env));
      switch (op) {
        case '+':
          return childrenVals.reduce((x,y) => x + y, 0)
        case '-':
          return childrenVals.reduce((x,y) => x - y, 0)
        case 'sin':
          return sin(childrenVals[0])
      }
  }
}

function expToString(exp) {
  switch (typeof(exp)) {
    case 'number':
    case 'string':
      return exp
    case 'object':
      const op = exp.op;
      const childrenVals = exp.children.map(child => expToString(child)).join(' ');
      return `(${op} ${childrenVals})`;
    }
}

function cull() {
  const toKill = []
  const survivors = []
  containers.forEach(row => row.forEach(container => {
    const toAddTo = container.selected ? toKill : survivors;
    toAddTo.push(container);
  }));

  toKill.forEach(container => {
    container.exp = _.clone(random(survivors).exp);
    container.mutate();
    container.toggleSelection();
  })
}

function mutateExp(exp) {
  switch (typeof(exp)) {
    case 'number':
      return random(-1, 1);
    case 'string':
      return getRandomFrom(symbols, exp);
    case 'object':
      if (random() < .9) {
        const idx = random(0, exp.children.length);
        exp.children[idx] = mutateExp(exp.children[idx]);
      } else {
        exp.op = random(operators);
      }
      return exp;
  }
}

class Container {
  constructor(w,h, row, col) {
    this.canvas = createGraphics(w, h);
    this.selected = false;
    this.expDepth = 5;
    this.exp = genExp(this.expDepth);
    this.row = row;
    this.col = col;
  }

  render() {
    const x = this.col * width / cols;
    const y = this.row * height / rows;
    render(this.exp, this.canvas);
    image(this.canvas, x, y, width / cols, height / cols);
  }

  mutate() {
    this.exp = mutateExp(this.exp);
  }

  toggleSelection() {
    const x = this.col * width / cols;
    const y = this.row * height / rows;
    this.selected = !this.selected;
    if (this.selected) {
      fill(169, 32, 54, 50);
      noStroke();
      rect(x, y, width / cols, height / cols);
    } else {
      this.render();
    }
  }
}