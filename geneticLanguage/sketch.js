/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let containers;

let rows = 3;
let cols = 4;

let xResolution = 200;
let yResolution = 200;

const programLength = 150;
const mutateBy = 2;

const useMusic = true;
const useBackgroundImage = true;
const useCamera = true;
let backgroundImage;


let time = 0;


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
];
const symbols = [
  'x',
  'y',
  'distFromMiddle',
  'time',
  'musicAmplitude',
  'backgroundImageRed',
  'backgroundImageGreen',
  'backgroundImageBlue',
];

let geneticShader;
let music;

let amplitude, amplitudeVals, amplitudeSum;


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
  backgroundImage = useBackgroundImage ? loadImage('http://localhost:3000/curve/face3.jpg') : null;
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
      if (useMusic) music.isPlaying() ? music.pause() : music.play();
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
  noStroke();
  frameRate(60);

  containers = Array.from({length: rows}, (v, row) => Array.from({length: cols}, (v2, col) => new Container(row, col)));
  updateShader();

  amplitudeSum = 0;
  amplitudeVals = []
  amplitude = new p5.Amplitude();

  if(useCamera) {
    cam = createCapture(VIDEO);
    cam.size(windowWidth, windowHeight);

    // hide the html element that createCapture adds to the screen
    cam.hide();
  }
}

function updateShader() {
  const compiled = generateShader(containers);
  print(compiled)
  geneticShader = createShader(geneticVert, compiled);
}

function draw() {
  // shader() sets the active shader with our shader
  // fill(0)

  shader(geneticShader);

  // time += 0.01;


  const amp = amplitude.getLevel() || 0;

  amplitudeVals.push(amp);
  amplitudeSum += amp;
  if (amplitudeVals.length > 100) {
    amplitudeSum -= amplitudeVals.splice(0,1)[0];
  }
  const amplitudeMean = amplitudeSum / amplitudeVals.length
  const ampToAdd =  pow(max(amp - amplitudeMean, 0), 2);

  time += .01;

  geneticShader.setUniform('resolution', [width, height]);
  geneticShader.setUniform('time', time);
  geneticShader.setUniform('musicAmplitude', ampToAdd);
  geneticShader.setUniform('backgroundImage', useCamera ? cam : backgroundImage);

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

  void main() {
    float none = 0.0;
    float x;
    float y;
    float distFromMiddle;
    vec4 backgroundImageVal;
    float backgroundImageRed = 0.0;
    float backgroundImageGreen = 0.0;
    float backgroundImageBlue = 0.0;


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
    backgroundImageVal = texture2D(backgroundImage, vec2(x, y));
    backgroundImageRed = backgroundImageVal.r;
    backgroundImageGreen = backgroundImageVal.g;
    backgroundImageBlue = backgroundImageVal.b;


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
  let choice;
  do {
    choice = random(l);
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

function genExp(length) {
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
    this.exp = genExp(programLength);
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