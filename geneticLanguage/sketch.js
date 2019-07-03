/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let containers;
let fft;
let gui;

let rows = 3;
let cols = 4;

let xResolution = 100;
let yResolution = 100;

const programLength = 50;
const mutateBy = 2;

const useMusic = true;
const useBackgroundImage = true;
const useCamera = false;
let backgroundImage;

const fftEnergies = 10;

let time = 0;

let geneticShader;
let music;

let amplitude;


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
  // 'rotate',
  'pow',
  'getFromBackgroundRed',
  'getFromBackgroundGreen',
  'getFromBackgroundBlue',
  'mod',
  'getAudioEnergy',
];
const symbols = [
  'x',
  'y',
  'distFromMiddle',
  'time',
  'musicAmplitude',
  'musicCentroid',
  'backgroundImageRed',
  'backgroundImageGreen',
  'backgroundImageBlue',
  'backgroundImageDelta'
];


// DONT CHANGE THIS
const geneticVert = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;


function preload() {
  music = useMusic ? loadSound('http://localhost:3000/geneticLanguage/sounds/static_snow.mp3') : null;
  // backgroundImage = useBackgroundImage ? loadImage('http://localhost:3000/geneticLanguage/images/desert.jpeg') : null;
  // backgroundImage = useBackgroundImage ? loadImage('http://localhost:3000/curve/face3.jpg') : null;
  backgroundImage = useBackgroundImage ? loadImage('http://localhost:3000/colorWalk/done/colors (12).jpg') : null;

}



function keyPressed(){
  switch (keyCode) {
    case ENTER:
      cull();
      time = 0;
      // redraw();
  }
  switch (key) {
    case ' ':
      if (useMusic) music.isPlaying() ? music.pause() : music.play(); break;
    case 't': time = 0; break;
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
  // shaders require WEBGL mode to work
  // createCanvas(windowWidth, windowHeight, WEBGL);
  createCanvas(displayWidth, displayHeight, WEBGL);
  gui = new GUI(operators, symbols);
  noStroke();
  frameRate(60);
  // randomSeed(0);
  fft = new p5.FFT();
  fft.smooth();
  containers = Array.from({length: rows}, (v, row) => Array.from({length: cols}, (v2, col) => new Container(row, col)));
  updateShader();

  amplitudeSum = 0;
  amplitudeVals = []
  amplitude = new p5.Amplitude();
  amplitude.toggleNormalize();
  amplitude.smooth(.1)

  if(useCamera) {
    cam = createCapture(VIDEO);
    cam.size(windowWidth, windowHeight);

    // hide the html element that createCapture adds to the screen
    cam.hide();
  }

  backgroundImage.resize(width / cols, height / rows);
}

function updateContainerExps() {
  print('updating container exps!')
  containers.forEach(row => row.forEach(container => {
    container.exp = genExp(programLength, container.seed);
  }));
  updateShader();
}

function updateShader() {
  const compiled = generateShader(containers);
  print(compiled)
  geneticShader = createShader(geneticVert, compiled);
}

function draw() {
  // shader() sets the active shader with our shader
  // fill(0)
  let spectrum = fft.analyze();
  shader(geneticShader);

  // time += 0.01;

  const amp = amplitude.getLevel() || 0;
  time += .01;

  let nyquist = 22050;
  spectralCentroid = fft.getCentroid();
  let mean_freq_index = spectralCentroid/(nyquist/spectrum.length);


  geneticShader.setUniform('resolution', [width, height]);
  geneticShader.setUniform('time', time);
  geneticShader.setUniform('musicAmplitude', amp);
  geneticShader.setUniform('backgroundImage', useCamera ? cam : backgroundImage);
  geneticShader.setUniform('energies', fft.linAverages(fftEnergies));
  geneticShader.setUniform('stepSize', [1.0/width, 1.0/height]);
  geneticShader.setUniform('musicCentroid', map(log(mean_freq_index), 0, log(spectrum.length), 0, 1));

  rect(0,0,width, height);
}


function generateShader(containers) {
  const containerExpsCompiled = [];
  containers.forEach(row => row.forEach(container => containerExpsCompiled.push(container.compileExp())));

  const blockWidth = width / cols * 2;
  const blockHeight = height / rows * 2;
  return `
  precision highp float;
  varying vec2 vTexCoord;

  uniform float time;
  uniform float musicAmplitude;
  uniform sampler2D backgroundImage;
  uniform float energies[4];
  uniform float musicCentroid;


  const float dist = 1.0;
  const vec2 stepSize = 0.001 * vec2(${blockWidth / xResolution}, ${blockHeight / yResolution});
  const vec2 resolution = vec2(${width}.0, ${height}.0);

  vec3 rgb(float r, float g, float b){
    return vec3(r / 255.0, g / 255.0, b / 255.0);
  }

  // this is the function that draws our rect
  // it works just like rect in p5 except that it takes an additional color parameter at the end
  vec3 rect (float x, float y, float w, float h, vec3 color){
    vec2 coord = gl_FragCoord.xy;
    coord.y = resolution.y - coord.y;
    float width = 1.0 -mix(0.0, 1.0, step(x + w, coord.x));
    float xPos =  1.0 -mix(0.0, 1.0, step(x, coord.x));
    float height = 1.0 - mix(0.0, 1.0, step(y + h, coord.y));
    float yPos = 1.0 - mix(0.0, 1.0, step(y, coord.y));
    vec3 col = rgb(color.r, color.g, color.b);
    return  col * ((height - yPos) * (width - xPos));
  }

  float getEnergy(int i) {
    for (int k = 0; k < 4; ++k) {
      if (i == k) {
        return energies[k];
      }
    }
  }


  void make_kernel(inout vec4 n[9], sampler2D tex, vec2 coord)
    {
      float w = stepSize.x;
      float h = stepSize.y;

      n[0] = texture2D(tex, coord + vec2( -w, -h));
      n[1] = texture2D(tex, coord + vec2(0.0, -h));
      n[2] = texture2D(tex, coord + vec2(  w, -h));
      n[3] = texture2D(tex, coord + vec2( -w, 0.0));
      n[4] = texture2D(tex, coord);
      n[5] = texture2D(tex, coord + vec2(  w, 0.0));
      n[6] = texture2D(tex, coord + vec2( -w, h));
      n[7] = texture2D(tex, coord + vec2(0.0, h));
      n[8] = texture2D(tex, coord + vec2(  w, h));
    }




  void main() {
    float none = 0.0;
    float x;
    float y;
    float distFromMiddle;
    vec4 backgroundImageVal;
    float backgroundImageRed = 0.0;
    float backgroundImageGreen = 0.0;
    float backgroundImageBlue = 0.0;
    float backgroundImageDelta = 0.0;


    x = gl_FragCoord.x;
    y = gl_FragCoord.y;

    x = mod(x, ${(blockWidth).toFixed(10)});
    y = mod(y, ${(blockHeight).toFixed(10)});

    x = x - mod(x, ${(blockWidth / xResolution).toFixed(10)});
    y = y - mod(y, ${(blockHeight / yResolution).toFixed(10)});
    x /= ${(blockWidth).toFixed(10)};
    y /= ${(blockHeight).toFixed(10)};
    y = 1.0 - y;
    distFromMiddle = pow(x - 0.5, 2.0) + pow(y - 0.5, 2.0);

    ${gui['backgroundImageRed'] || gui['backgroundImageGreen'] || gui['backgroundImageBlue'] ?
      `backgroundImageVal = texture2D(backgroundImage, vec2(mod(x, 1.0), mod(y, 1.0)));` : ''}
    ${gui['backgroundImageRed'] ? `backgroundImageRed = backgroundImageVal.r;` : ''}
    ${gui['backgroundImageGreen'] ? `backgroundImageGreen = backgroundImageVal.g;` : ''}
    ${gui['backgroundImageBlue'] ? `backgroundImageBlue = backgroundImageVal.b;` : ''}

    ${gui['backgroundImageDelta'] ? `
      vec4 n[9];
      make_kernel(n, backgroundImage, vec2(x,y));
      vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
      vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
      vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
      backgroundImageDelta = length(sobel.rgb);
      ` : ''}


    float width = resolution.x / ${cols}.0;
    float height = resolution.y / ${rows}.0;

    vec3 col;
    vec3 r;
    vec3 scene = vec3(0.0, 0.0, 0.0);

    ${containerExpsCompiled.join('\n')}

    gl_FragColor = vec4(scene, 1.0);
  }`;
}

function showExpHovered() {
  fill(color(0))
  rect(0,0, width, 20);
  fill(color('white'));
  const container = selectAtMouse();
  if (container)
    text(container.exp.map(val => typeof(val) === 'number' ? val.toFixed(3) : val), 10, 10);
}


function getRandomFrom(l, notThis) {
  const enabled = l.filter(item => gui[item]);
  print(enabled)
  let choice;
  do {
    choice = random(enabled);
  } while (notThis != undefined && choice === notThis)
  return choice;
}

function genTerm() {
  const rand = random();
  if (rand < .1) {
    // return `vec3(${random()}, ${random()}, ${random()})`;
    return `${random()}`;

  }
  if (rand < .4) {
    return getRandomFrom(symbols)
  }
  return getRandomFrom(operators)
}

function genExp(length, seed) {
  randomSeed(seed);
  return Array.from({length}, genTerm)
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
  print('cull called');
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
  updateShader();
}


let containerNum = 0;
class Container {
  constructor(row, col) {
    this.selected = false;
    this.seed = random(Date.now());
    this.exp = genExp(programLength, this.seed);
    this.row = row;
    this.col = col;
    this.id = containerNum++;
  }

  toggleSelection() {
    this.selected = !this.selected;
  }


  compileExp() {
    let result = ''
    let i = 0;
    let maxi = 0;
    const push = (val) => {
      result += `    x_${this.id}_${i} = ${val};\n`;
      i++;
      maxi = max(maxi, i);
    }
    const pop = () => {
      if (i == 0) {
        return 'none'
      } else {
        i--;
        return `x_${this.id}_${i}`
      }
    }

    this.exp.forEach(val => {
      switch (val) {
        case '+': push(`${pop()} + ${pop()}`); break;
        case '-': push(`${pop()} - ${pop()}`); break;
        case 'sin': push(`sin(${pop()})`); break;
        case 'cos': push(`cos(${pop()})`); break;
        case '/': push(`${pop()} / ${pop()}`); break;
        case '*': push(`${pop()} * ${pop()}`); break;
        case 'dist': const [a,b,c,d] = [pop(), pop(), pop(), pop()]; push(`pow(${a} - ${c}, 2.0) + pow(${b} - ${d}, 2.0)`); break;
        case 'dup': const x = pop(); push(x); push(x); break;
        // case 'drop': pop(); break;
        // case 'rotate': length > 0 && push(splice(0,1)[0]); break;
        case 'pow': push(`pow(${pop()}, ${pop()})`); break;
        case 'atan': push(`atan(${pop()}, ${pop()})`); break;
        case 'getFromBackgroundRed': push(`texture2D(backgroundImage, vec2(x,y) + ${pop()} * vec2(${pop()}, ${pop()})).r`); break;
        case 'getFromBackgroundBlue': push(`texture2D(backgroundImage, vec2(x,y) + ${pop()} * vec2(${pop()}, ${pop()})).g`); break;
        case 'getFromBackgroundGreen': push(`texture2D(backgroundImage, vec2(x,y) + ${pop()} * vec2(${pop()}, ${pop()})).b`); break;
        case 'getAudioEnergy': push(`getEnergy(int(clamp(${pop()}, 0.0, 0.999999)))`); break;
        case 'mod': push(`mod(${pop()}, ${pop()})`); break;
        default:
          // push(env[val] != undefined ? env[val] : val);
          push(val)
      }
    });


    return `
    ${Array.from({length: maxi}, (v, i) => `float x_${this.id}_${i}`).join(';\n')};
    ${result}

    col = vec3(${pop()} * 255.0, ${pop()} * 255.0, ${pop()} * 255.0);
    // col = vec3(x, y, 0.0);
    r = rect(${(this.col * width / cols*2).toFixed(10)}, ${(this.row * height / rows * 2 - height).toFixed(10)}, ${(width / cols * 2).toFixed(10)}, ${(height / rows * 2).toFixed(10)}, col);
    scene = mix(scene, r, r);
    `;
  }
}


class GUI {
  constructor(operators, symbols) {
    this.gui = new dat.GUI({width: 500});

    const operatorFolder = this.gui.addFolder('Operators');
    const symbolFolder = this.gui.addFolder('Symbols');

    operators.forEach(op => {
      this[op] = true;
      const controller = operatorFolder.add(this, op);
      controller.onFinishChange(updateContainerExps);
    });

    symbols.forEach(symbol => {
      this[symbol] = true;
      const controller = symbolFolder.add(this, symbol);
      controller.onFinishChange(updateContainerExps);
    });
  }
}