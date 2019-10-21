/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */

let filled;


function setup() {
  createCanvas(displayWidth, displayHeight);


  noStroke();
}

function draw() {
  const data = createNoiseData(60, 60)

  filled = new FloodFill(data);
  const startTime = Date.now();
  filled.getLevels();
  print('took: ', Date.now() - startTime);
  filled.renderData(mouseIsPressed)
}


function createNoiseData(rows, cols) {
  const scale = .2;
  return Array.from({length: rows}, (v,row) => Array.from({length: cols}, (v2, col) => {
    const mult = row <= 1 || row >= rows - 2 || col <= 1 || col >= cols - 2 ? 0 :
      dist(row, col, rows /2, cols / 2) / (sqrt(pow(rows, 2) + pow(cols, 2)))
    return {
      value: noise(row * scale, col * scale, frameCount * .1) * mult,
      row,
      col
    };
  }));
}

class FloodFill {
  constructor(data, opts) {
    this.data = data;
    this.opts = opts;
    this.w = data[0].length;
    this.h = data.length;
  }

  getLevels() {
    const visited = new Set();
    const addToPq = []

    const activate = (row, col) => {
      this.data[row][col].level = this.data[row][col].value;
      this.data[row][col].row = row;
      this.data[row][col].col = col;
      addToPq.push(this.data[row][col]);
    }

    for (let col = 0; col < this.w; col++) {
      activate(0,col);
      activate(this.h - 1, col);
    }
    for (let row = 0; row < this.h; row++) {
      activate(row, 0);
      activate(row, this.w - 1);
    }

    const pq = new TinyQueue(addToPq, (a,b) => {
      a.level - b.level;
    });

    while(pq.length) {
      const p = pq.pop();
      const id = p.row * this.w + p.col;
      if (true || !visited.has(id)) {
        // visited.add(id);
        const rowUpper = min(this.h - 1 , p.row + 1);
        const colUpper = min(this.w - 1 , p.col + 1);
        for (let row = max(0, p.row - 1); row <= rowUpper;  row++) {
          for (let col = max(0, p.col - 1); col <= colUpper;  col++) {
            if ((row != p.row || col != p.col)) {
              const q = this.data[row][col];
              const newLevel = max(q.value, min(q.level === undefined ? 99999999 : q.level, p.level));
              if (newLevel != q.level) {
                q.level = newLevel;
                pq.push(q);
              }
            }
          }
        }
      }
    }
  }



  renderData(useLevel = false) {
    const blockWidth = width / this.w;
    const blockHeight = height / this.h;

    this.data.forEach((rowArray) => rowArray.forEach((pt) => {
      if (pt.value === pt.level) {
        fill(map(pt.value, 0, 1, 0, 255));
      } else {
        const blueness = 255 - (pt.level - pt.value) * 2550;
        fill(color(0, 0, blueness));
      }

      rect(pt.row * blockHeight, pt.col * blockWidth, (pt.row+1) * blockHeight, (pt.col + 1) * blockWidth);
    }));
  }
}