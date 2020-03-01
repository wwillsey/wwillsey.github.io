function createGradientDirImg(gx, gy) {
  let g = createImage(gx.width, gx.height);
  g.loadPixels()
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const dx = red(gx.get(x,y));
      const dy = red(gy.get(x,y));
      const ang = atan2(dy, dx) + PI;
      const val = lerp(0, 255, ang / (PI * 2));

      g.set(x,y, color(val));
    }
  }
  g.updatePixels();
  return g;
}

function createGradientMagImg(gx, gy) {
  let g = createImage(gx.width, gx.height);
  g.loadPixels()
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const dx = red(gx.get(x,y)) - 255 / 2;
      const dy = red(gy.get(x,y)) - 255 / 2;
      const val = dist(0,0,dx,dy);
      g.set(x,y, color(val));
    }
  }
  g.updatePixels();
  return g;
}
function convolveImage(img, matrix) {
  let newImage = createImage(img.width, img.height);
  newImage.loadPixels();

  for (let x = 0; x < img.width; x++) {
    for (let y = 0; y < img.height; y++) {
      let c = convolution(x, y, matrix, img, 1);
      const sign = c < 0 ? -1 : 1;
      c = pow(c, 2) * sign;
      c += 255 / 2;
      newImage.set(x, y, color(c));
    }
  }
  newImage.updatePixels();
  return newImage;
}


function convolution(x, y, matrix, img, offset, channels = 1) {
  let vTotal = channels === 1 ? 0 : Array.from({
    length: channels
  }).map(() => 0);
  const mlenX = matrix[0].length;
  const mlenY = matrix.length;
  for (let i = 0; i < mlenX; i++) {
    for (let j = 0; j < mlenY; j++) {
      // What pixel are we testing
      let xloc = constrain(x + i - round(mlenX / 2), 0, img.width - 1);
      let yloc = constrain(y + j - round(mlenY / 2), 0, img.height - 1);

      let val = img.get(xloc,yloc);
      const vals = [
        red(val),
        green(val),
        blue(val),
      ]
      if (channels === 1) {
        vTotal += vals[0] * matrix[j][i];
      } else {
        vals.forEach((v, idx) => {
          vTotal[idx] += v * matrix[j][i]
        });
      }
    }
  }
  // Return the resulting val
  return vTotal;
}


function CreateSobelKernel(n) {

  let Kx = Array.from({
    length: n
  }).map(() => Array.from({
    length: n
  }));
  let Ky = Array.from({
    length: n
  }).map(() => Array.from({
    length: n
  }));

  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      let i = x - floor(n / 2);
      let j = y - floor(n / 2);
      if (i !== 0 || j !== 0) {
        Ky[y][x] = i / (i * i + j * j);
        Kx[y][x] = j / (i * i + j * j);
      } else {
        Kx[y][x] = 0;
        Ky[y][x] = 0;
      }
    }
  }

  return {
    Kx: Ky,
    Ky: Kx,
  };
}

function lerpColors(colors, v) {
  v = constrain(v, 0, .99999999);
  const indx = v * (colors.length - 1);
  const col1 = colors[floor(indx)];
  const col2 = colors[floor(indx) + 1];
  return lerpColor(col1, col2, indx - floor(indx));
}

// Dw.EasyCam.prototype.apply = function(n) {
//   var o = this.cam;
//   n = n || o.renderer,
//   n && (this.camEYE = this.getPosition(this.camEYE), this.camLAT = this.getCenter(this.camLAT), this.camRUP = this.getUpVector(this.camRUP), n._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2], this.camLAT[0], this.camLAT[1], this.camLAT[2], this.camRUP[0], this.camRUP[1], this.camRUP[2]))
// };


class TinyQueue {
  constructor(data = [], compare = defaultCompare) {
      this.data = data;
      this.length = this.data.length;
      this.compare = compare;

      if (this.length > 0) {
          for (let i = (this.length >> 1) - 1; i >= 0; i--) this._down(i);
      }
  }

  push(item) {
      this.data.push(item);
      this.length++;
      this._up(this.length - 1);
  }

  pop() {
      if (this.length === 0) return undefined;

      const top = this.data[0];
      const bottom = this.data.pop();
      this.length--;

      if (this.length > 0) {
          this.data[0] = bottom;
          this._down(0);
      }

      return top;
  }

  peek() {
      return this.data[0];
  }

  _up(pos) {
      const {data, compare} = this;
      const item = data[pos];

      while (pos > 0) {
          const parent = (pos - 1) >> 1;
          const current = data[parent];
          if (compare(item, current) >= 0) break;
          data[pos] = current;
          pos = parent;
      }

      data[pos] = item;
  }

  _down(pos) {
      const {data, compare} = this;
      const halfLength = this.length >> 1;
      const item = data[pos];

      while (pos < halfLength) {
          let left = (pos << 1) + 1;
          let best = data[left];
          const right = left + 1;

          if (right < this.length && compare(data[right], best) < 0) {
              left = right;
              best = data[right];
          }
          if (compare(best, item) >= 0) break;

          data[pos] = best;
          pos = left;
      }

      data[pos] = item;
  }
}

function defaultCompare(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}


function minBy(l, key) {
  if (!l || !l.length) {
    return undefined;
  }
  let mini = l[0];
  let miniVal = key(l[0]);
  for (let i = 1; i < l.length; i++) {
    const newVal = key(l[i]);
    if (newVal < miniVal) {
      mini = l[i];
      miniVal = newVal;
    }
  }
  return mini;
}

function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {

  // Check if none of the lines are of length 0
	if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
		return false
	}

	denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

  // Lines are parallel
	if (denominator === 0) {
		return false
	}

	let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
	let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

  // is the intersection along the segments
	if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
		return false
	}

  // Return a object with the x and y coordinates of the intersection
	let x = x1 + ua * (x2 - x1)
	let y = y1 + ua * (y2 - y1)

	return {x, y}
}


class GUI {
  constructor() {
    this.gui = new dat.GUI();
  }

  add(name, defaultVal, ...args) {
    print(name, defaultVal, ...args);
    this[name] = defaultVal;
    return this.gui.add(this, name, ...args);
  }

  addColor(name, defaultVal, ...args) {
    print(name, defaultVal, ...args);
    this[name] = defaultVal;
    this.gui.addColor(this, name);
  }
}

function imageCopy(img) {
  const res = createImage(img.width, img.height);
  res.loadPixels();
  res.copy(img, 0,0,img.width, img.height, 0,0,img.width,img.height);
  return res;
}


class LineReducer {
  constructor(opts) {
    this.opts = opts;
    this.lines = {};
    this.rawSize = 0;
    this.reducedSize = 0;
    this.linesBefore = [];
  }

  getKey(x1,y1,x2,y2) {
    const {m,x,y} = Line.ptsToMB({x: x1, y: y1}, {x:x2, y:y2});
    return `${m.toFixed(this.opts.nFixed)}:${x.toFixed(this.opts.nFixed)}:${y.toFixed(this.opts.nFixed)}`;
  }



  add(a,b,c,d) {
    this.rawSize++;
    let x1,x2,y1,y2;
    if(c == undefined && d == undefined) {
      x1 = a.x;
      y1 = a.y;
      x2 = b.x;
      y2 = b.y;
    } else {
      x1 = a;
      y1 = b;
      x2 = c;
      y2 = d;
    }

    x1 = x1 - x1 % this.opts.modBy;
    x2 = x2 - x2 % this.opts.modBy;
    y2 = y2 - y2 % this.opts.modBy;
    y1 = y1 - y1 % this.opts.modBy;

    if(x1 > x2) {
      const tx = x1;
      x1 = x2;
      x2 = tx;
      const ty = y1;
      y1 = y2;
      y2 = ty;
    } else if (x1 == x2 && y1 > y2) {
      const ty = y1;
      y1 = y2;
      y2 = ty;
    }
    this.linesBefore.push([x1,y1,x2,y2]);

  }

  reduceOne(x1, y1, x2, y2) {
    // print('reduce one', x1, y1, x2, y2)
    const key = this.getKey(x1, y1, x2, y2);

    if (this.lines[key] === undefined) {
      this.lines[key] = [];
    }
    let added = false;
    this.lines[key].forEach(({p1, p2}) => {
      // print('considering ', {p1,p2})
      if (p1.x == p2.x) {
        if (y1 >= p1.y && y1 <= p2.y) {
          p2.y = max(y2, p2.y);
          added = true;
        } else if (y2 >= p1.y && y2 <= p2.y) {
          p1.y = min(y1, p1.y);
          added = true;
        }
      } else {
        if (x1 >= p1.x && x1 <= p2.x) {
          p2.x = max(x2, p2.x);
          added = true;
        } else if (x2 >= p1.x && x2 <= p2.x) {
          p1.x = min(x1, p1.x);
          added = true;
        }
      }
    })
    if (!added) {
      this.lines[key].push({p1:{x: x1, y: y1}, p2: {x: x2, y:y2}});
      this.reducedSize++;
    }
  }

  reduce() {
    this.linesBefore.sort()
    // print(this.linesBefore)
    this.linesBefore.forEach(([x1, y1, x2, y2]) => this.reduceOne(x1, y1, x2, y2));
    print(this.lines)

  }

  render() {
    Object.keys(this.lines).forEach(k => this.lines[k].forEach(({p1, p2}) => {
      stroke(0)
      line(p1.x, p1.y, p2.x, p2.y)
      stroke(color(255,0,0,100))
      ellipse(p1.x,p1.y,3,3)
      stroke(color(0,0,255,100))

      ellipse(p2.x,p2.y,3,3)

      // print(p1.x, p1.y, p2.x, p2.y)
    }
    ));
    print(`rendered ${this.reducedSize} lines instead of ${this.rawSize}`);
  }
}

function normalVal(v) {
  if (abs(v) == v || abs(v) == Infinity) {
    return abs(v);
  }
  return v;
}
class Line {
  static ptsToMB(p1, p2) {
    let m = (p2.y - p1.y) / (p2.x - p1.x);
    m = abs(m) == m || abs(m) == Infinity ? abs(m) : m;
    const y = p1.y - m * p1.x;
    const x = m == Infinity ? p1.x : -y / m;

    return {m, y: normalVal(y), x: normalVal(x)}
  }
}