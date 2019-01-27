let img;
let d;

let lineImage;
let lineGraphic;
let blankImage;
let maskImage;


function preload() {
  // img = loadImage('http://loxcalhost:3000/lineImage/flower.png');
  img = loadImage('http://localhost:3000/lineImage/mountain.jpeg')
}



function setup() {
  createCanvas(800, 600);
  pixelDensity(1)
  d = pixelDensity();

  img.resize(100, 0);

  // img.filter(GRAY);
  // img.filter(THRESHOLD)
  // img.filter(POSTERIZE, 2)
  // img.filter(OPAQUE)
  // img.filter(POSTERIZE, 3);
  // img.mask(segmentImage(img))
  img.filter(POSTERIZE, 8)
  img.loadPixels();
  img.get = getFromPixels;
  segmentImage(img);
  // segments.forEach(segment => {
  //   image(segment, img.width, 0);
  // })
  image(img, 0,0);
}

// function setup() {
//   createCanvas(400,400);
//   const g = createGraphics(100,100);
//   g.background(0,0,0,0);
//   g.stroke(100);
//   g.line(0,0,50,0);
//   print(g.get(25,0))
//   image(g, 0,0)
// }

// function draw() {
//   background(200)
//   translate(width/2, height / 2);

//   rotate(frameCount / 100);
//   for(let i = -height; i < height; i += 3) {
//     line(-width, i, width, i)
//   }
// }



// let seg = 0;
// function draw() {
//   background(255);
//   image(img, 0, 0);
//   image(segments[seg], img.width, 0);
//   seg++;
//   seg %= segments.length;
// }



function createLinesForSegment(img, segment) {
  const getPos = idx => ({
    x: idx % img.width,
    y: floor(idx / img.width)
  });

  const nodes = segment.map(pt => {
    const node = getPos(pt);
    return ({
      ...node,
      col: img.get(node.x, node.y)
    })
  });

  nodes.sort((aNode,bNode) => {
    const a = aNode.col
    const b = bNode.col
    const aDist = red(a) + blue(a) + green(a) + alpha(a);
    const bDist = red(b) + blue(b) + green(b) + alpha(b);
    return aDist - bDist;
  });

  const middle = subset(nodes, nodes.length / 2 - 2, nodes.length / 2 + 2);
  const lineCol = [0,0,0,0];
  middle.forEach(node => {
    lineCol[0] += red(node.col) / middle.length;
    lineCol[1] += green(node.col) / middle.length;
    lineCol[2] += blue(node.col) / middle.length;
    lineCol[3] += alpha(node.col) / middle.length;
  });

  lineGraphic.background(color(0,0,0,0));
  // lineGraphic.loadPixels()
  // lineGraphic.fill(lineCol[0], lineCol[1], lineCol[2], 0);
  const c = color(lineCol[0], lineCol[1], lineCol[2], 20);

  lineGraphic.stroke(c)
  print('linecol', c)
  lineGraphic.strokeWeight(1);

  const dir = .2//random(PI);
  lineGraphic.push();
  lineGraphic.translate(lineGraphic.width/2, lineGraphic.height / 2);
  lineGraphic.rotate(dir);
  for(let i = -lineGraphic.height; i < lineGraphic.height; i += 5) {
    lineGraphic.line(-lineGraphic.width, i, lineGraphic.width, i)
  }
  // lineGraphic.loadPixels();
  lineGraphic.pop();
  // lineGraphic.loadPixels()

  // for(let x = 0; x < lineGraphic.width; x++) {
  //   for(let y = 0; y < lineGraphic.height; y++) {
  //     lineImage.set(x,y, lineGraphic.get(x,y));
  //   }
  // }
  // lineImage.pixels = lineGraphic.pixels;
  // lineImage.updatePixels();
  // lineImage.loadPixels()
}

function drawSegment(img, segment) {
  const getPos = idx => {
    const x = idx % img.width;
    const y = floor(idx / img.width);
    const a = alpha(img.get(x, y));
    const c = lineGraphic.get(x, y);

    return  {
      x,y,a,c
    }
}

  createLinesForSegment(img, segment);
  // lineGraphic.updatePixels()
  // print(lineGraphic.pixels)

  for(let i = 0; i < segment.length; i++) {
    const node = getPos(segment[i]);
    print('node', node)
    lineGraphic.stroke(color(node.c[0], node.c[1], node.c[2], node.a));
    if (node.c[0] != 0) {
      print('not zero', node)
    }
    lineGraphic.strokeWeight(1)
    lineGraphic.point(node.x, node.y);
  }

  image(lineGraphic, img.width, 0)
  // redraw()

  // maskImage.updatePixels();
  // print(lineImage)
  // // lineImage.mask(maskImage);
  // image(lineImage, img.width, 0);
  // lineImage.mask(blankImage);
  // maskImage.mask(blankImage);
}

function segmentImage(img) {
  // lineImage = createImage(img.width, img.height);
  // lineImage.loadPixels;
  // lineImage.get = getFromPixels
  // blankImage = createImage(img.width, img.height);
  // blankImage.loadPixels;
  // maskImage = createImage(img.width, img.height);
  // maskImage.loadPixels;
  // maskImage.get = getFromPixels

  lineGraphic = createGraphics(img.width, img.height);
  lineGraphic.pixelDensity(pixelDensity())
  // lineGraphic.loadPixels()


  const getIndx = (x,y) => img.width * y + x;
  const getPos = idx => ({
    x: idx % img.width,
    y: floor(idx / img.width)
  });


  const areSameSegment = (col, nodeCol) => {
    // const nodeCol = img.get(node.x, node.y);
    const dist = abs(red(col) - red(nodeCol)) + abs(green(col) - green(nodeCol)) + abs(blue(col) - blue(nodeCol)) + abs(alpha(col) - alpha(nodeCol));
    // print('areSameSegment', col, nodeCol, dist < 20);
    return dist < 10;
  }

  const segments = {};
  const frontier = [0];
  let currentSegment = 0;

  let numVisited = 0;
  const visited = Array.from({length: img.width * img.height}, () => false);
  let lowestUnvisited = 0;

  while(numVisited < img.width * img.height) {
    // print('frontier: ', frontier);
    if (frontier.length === 0) {
      // print(`done with segment ${currentSegment}`,
        segments[currentSegment].map(i => {
          const p = getPos(i);
          return {
            ...p,
            col: img.get(p.x, p.y)
          }
        });
      currentSegment++;

      while (visited[lowestUnvisited]) {
        lowestUnvisited++
      };

      frontier.push(lowestUnvisited);
    }
    const idx = frontier.pop();
    const node = getPos(idx);

    visited[idx] = true;
    numVisited++;
    if (!segments[currentSegment]) {
      segments[currentSegment] = [idx];
    }
    else {
      segments[currentSegment].push(idx);
    }

    const nodeCol = img.get(node.x, node.y);
    for (let dx = node.x - 1; dx <= node.x + 1; dx++) {
      for (let dy = node.y - 1; dy <= node.y + 1; dy++) {
        const newIdx = getIndx(dx, dy);
        if ((dx !== node.x || dy !== node.y) &&
          dx >= 0 && dx < img.width &&
          dy >= 0 && dy < img.height &&
          !visited[newIdx] &&
          areSameSegment(nodeCol, img.get(dx, dy)) &&
          frontier.indexOf(newIdx) === -1) {
            frontier.push(newIdx);
          }
      }
    }
  }

  print(segments);
  return [Object.keys(segments)[2]]
    .filter(key => segments[key].length > 20)
    .forEach(segment => drawSegment(img, segments[segment]));
}


function getFromPixels(x, y) {
  var off = (y * this.width + x) * d * 4;
  var components = [ this.pixels[off], this.pixels[off + 1], this.pixels[off + 2], this.pixels[off + 3] ];
  // print(this.pixels.length, x,y, off, components);
  return color(...components);
}