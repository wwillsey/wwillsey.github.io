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

Dw.EasyCam.prototype.apply = function(n) {
  var o = this.cam;
  n = n || o.renderer,
  n && (this.camEYE = this.getPosition(this.camEYE), this.camLAT = this.getCenter(this.camLAT), this.camRUP = this.getUpVector(this.camRUP), n._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2], this.camLAT[0], this.camLAT[1], this.camLAT[2], this.camRUP[0], this.camRUP[1], this.camRUP[2]))
};
