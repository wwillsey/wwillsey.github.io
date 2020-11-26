/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let containers;
let fft;
let gui, S;

let rows = 3;
let cols = 3;

let xResolution;
let yResolution;

const programLength = 70;
const mutateBy = 10;

const useMusic = false;
const useMic = false;
const useBackgroundImage = false;
const useBackgroundVideo = false;
const useCamera = false;
let backgroundImage;
let backgroundVideo;
let cam;


let recorder;

const fftEnergies = 10;

let time = 0;

let geneticShader;
let music;
let amplitude;
let mousePos = {x: 0, y: 0};
let animationPos = {x: 0, y: 0};
let maximizeState = {};
let isMaximized = false;
let audioSetup = false;

let operators = [
  '+',
  '-',
  'sin',
  'cos',
  'atan',
  '*',
  '/',
  'dist',
  'dup',
  'drop',
  'rotate',
  'pow',
  'getFromBackgroundRed',
  'getFromBackgroundGreen',
  'getFromBackgroundBlue',
  'mod',
  'getAudioEnergy',
  'max',
  'min',
  'exp',
  'log'
];
let symbols = [
  'x',
  'y',
  'mouseX',
  'mouseY',
  'animationPosX',
  'animationPosY',
  'distFromMiddle',
  'time',
  'musicAmplitude',
  'musicCentroid',
  'backgroundImageRed',
  'backgroundImageGreen',
  'backgroundImageBlue',
  'backgroundImageDelta',
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

let musicLevelList = ["bass", "lowMid", "mid", "highMid", "treble"];


function preload() {
  // music = useMusic ? loadSound('http://localhost:3000/geneticLanguage/sounds/static_snow.mp3') : null;
  // backgroundImage = useBackgroundImage ? loadImage('http://localhost:3000/geneticLanguage/images/desert.jpeg') : null;
  // backgroundImage = useBackgroundImage ? loadImage("../media/7525_22.jpg") : null;
  backgroundImage = useBackgroundImage ? loadImage('../media/flower.jpg') : null;

}



function keyPressed(){
  print('key pressed', keyCode, key)
  switch (keyCode) {
    case ENTER:
      cull();
      break;
    case SHIFT:
      gui.toggleMaximize();
      // time = 0;
      // redraw();
      break;
    case ALT:
      recorder.toggle();
      break;
    case 93:
      saveScreen()
      break;
  }
  switch (key) {
    case ' ':
      toggleMusic(); break;
    case 't': time = 0; animationPos = {x:0, y:0}; break;
    case 'z': S = new ScrollScale(); break

  }
}

function saveScreen() {
  if (gui.renderScale == 1) saveCanvas();
  else render(updateShaderLayer, gui.renderScale, S)
}

function toggleMusic() {
  if (useMusic && !useMic) music.isPlaying() ? music.pause() : music.play();
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
  let c = createCanvas(displayWidth, displayHeight, WEBGL);
  S = new ScrollScale()

  print(displayWidth, displayHeight, pixelDensity())
  recorder = new ScreenRecorder({
    framerate: 48,
  });
  xResolution = width / cols;
  yResolution = height / rows;
  shaderLayer = createGraphics(width, height, WEBGL);
  if (useBackgroundVideo) {
    backgroundVideo = createVideo('./videos/breath_ctrl (loop).mp4', () => {
      backgroundVideo.loop();
      // backgroundVideo.hide();
      backgroundVideo.elt.muted = false
      backgroundVideo.size(width,height);
      music = backgroundVideo;
      setTimeout(() => {
        backgroundVideo.play()
        backgroundVideo.isReady = true;
      }, 1000);
    })

  }

  if (useMic) {
    music = new p5.AudioIn();
    music.start();
  }

  c.mousePressed(() => {
    if (useMusic) {
      if (audioSetup) return;
      getAudioContext().resume()
      audioSetup = true;
      music = new p5.AudioIn();
      music.start();
      fft = new p5.FFT();
      fft.setInput(music)
      fft.smooth();
    }

  });

  if(!(useBackgroundImage || useBackgroundVideo || useCamera)) {
    symbols = symbols.filter(k => !k.includes("Image"));
    operators = operators.filter(k => !k.includes("Background"));
  }


  gui = new geneticGUI(operators, symbols);
  noStroke();
  // frameRate(60);
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

  // backgroundImage.resize(width / cols, height / rows);
}

function updateContainerExps() {
  print('updating container exps!')
  containers.forEach(row => row.forEach(container => {
    container.exp = genExp(programLength, container.seed);
  }));
  updateShader();
}

function updateShader() {
  const containersForGen = isMaximized ? [[maximizeState.container]] : containers;
  const compiled = generateShader(containersForGen);
  print(compiled.split('\n').map((v,i) => `${i+1}:  ${v}`).join('\n'))
  geneticShader = shaderLayer.createShader(geneticVert, compiled);
}


function updatePos() {
  if (keyIsDown(87))  animationPos.y -= gui.speed * .01;
  if (keyIsDown(65)) animationPos.x -= gui.speed * .01;
  if (keyIsDown(83)) animationPos.y += gui.speed * .01;
  if (keyIsDown(68)) animationPos.x += gui.speed * .01;
}

function draw() {
  background(0)
  // orbitControl();
  // shader() sets the active shader with our shader
  // fill(0)

  shaderLayer = updateShaderLayer(S)
  push();
  translate(-width/2, -height/2);
  // shaderLayer.loadPixels();
  image(shaderLayer, 0, 0);
  // texture(shaderLayer)
  // sphere(300)
  // fill(255);
  // textSize(25)
  // text(frameRate(), 10, 10);

  getSelectedContainers().forEach(c => c.renderSelectionHighlighting());
  pop();
  recorder.takeFrame();
}


function updateShaderLayer(zoomScale) {
  let spectrum = fft.analyze();
  shaderLayer.shader(geneticShader);

  if(isMaximized) {
    mousePos.x += movedX;
    mousePos.y += movedY;
  } else {
    mousePos.x = mouseX;
    mousePos.y = mouseY;
  }

  updatePos();
  // time += 0.01;

  const amp = amplitude.getLevel() || 0;
  // print(amp)
  time += gui.timeSpeed * .01;

  let nyquist = 22050;
  spectralCentroid = fft.getCentroid();
  let mean_freq_index = spectralCentroid/(nyquist/spectrum.length);


  geneticShader.setUniform('resolution', [width, height]);
  geneticShader.setUniform('time', time);
  geneticShader.setUniform('musicAmplitude', amp);
  geneticShader.setUniform('mouseX', mousePos.x / width)
  geneticShader.setUniform('mouseY', mousePos.y / height)
  geneticShader.setUniform('animationPosX', animationPos.x)
  geneticShader.setUniform('animationPosY', animationPos.y)
  geneticShader.setUniform('scalePos', [zoomScale.pos.x, zoomScale.pos.y]);
  geneticShader.setUniform("scale", zoomScale.scale)

  if (backgroundVideo && backgroundVideo.isReady)
    geneticShader.setUniform('backgroundImage', backgroundVideo);
  else if (cam)
    geneticShader.setUniform('backgroundImage', cam);
  else if (backgroundImage)
    geneticShader.setUniform('backgroundImage', backgroundImage);

  geneticShader.setUniform('energies', musicLevelList.map(s => gui[s] ? fft.getEnergy(s) : 0));
  geneticShader.setUniform('stepSize', [1.0/width, 1.0/height]);
  geneticShader.setUniform('musicCentroid', map(log(mean_freq_index), 0, log(spectrum.length), 0, 1));

  shaderLayer.rect(0,0,width, height);
  return shaderLayer;
}

function gotSources(deviceList) {
  if (deviceList.length > 0) {
    //set the source to the first item in the deviceList array
    audioIn.setSource(0);

    let currentSource = deviceList[audioIn.currentSource];
    print(deviceList)
    print('set source to: ' + currentSource.deviceId, 5, 20, width);
  }
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
  uniform float energies[5];
  uniform float musicCentroid;
  uniform float mouseX;
  uniform float mouseY;
  uniform float animationPosX;
  uniform float animationPosY;
  uniform vec2 scalePos;
  uniform float scale;


  const float dist = 1.0;
  const vec2 stepSize = 0.0005 * vec2(${blockWidth / xResolution}, ${blockHeight / yResolution});
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
    for (int k = 0; k < 5; ++k) {
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

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
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


    x = (x - .5) * scale + scalePos.x;
    y = (y - .5) * scale + scalePos.y;


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
  // print(enabled)
  let choice;
  do {
    choice = random(enabled);
  } while (notThis != undefined && choice === notThis)
  return choice;
}

function genTerm() {
  const rand = random();
  if (rand < gui.randValChance) {
    // return `vec3(${random()}, ${random()}, ${random()})`;
    return `${random()}`;

  }
  if (rand < gui.randSymbolChance) {
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
  if (random() < 1) {
    let n = gui.mutateBy;
    while (n-- > 0) {
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
  let n = gui.mergeNtimes;

  const res = expDest.slice()
  while (n-- > 0) {
    const idx1 = floor(random(0, expDest.length))
    const idx2 = floor(random(0, expDest.length))
    // print(idx1, idx2)
    arrayCopy(expSrc, min(idx1, idx2), res, min(idx1, idx2), abs(idx1 - idx2));
  }
  return res;
}


function getSelectedContainers() {
  const selected = [];

  containers.forEach(row => row.forEach(container => {
    if(container.selected)
      selected.push(container);
  }));
  return selected;
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
    container.exp = random() < gui.mutateChance ?
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
    if(this.selected) {
      print(this.exp)
    }
  }

  renderSelectionHighlighting() {
    push();
    fill(0,60);
    strokeWeight(5);
    stroke(color('white'));
    rect(this.col * width / cols, this.row * height / rows, width / cols, height / rows);
    pop();
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
        case 'drop': pop(); break;
        case 'rotate': length > 0 && push(splice(0,1)[0]); break;
        case 'pow': push(`pow(${pop()}, ${pop()})`); break;
        case 'atan': push(`atan(${pop()}, ${pop()})`); break;
        case 'getFromBackgroundRed': push(`texture2D(backgroundImage, vec2(x,y) + ${pop()} * vec2(${pop()}, ${pop()})).r`); break;
        case 'getFromBackgroundBlue': push(`texture2D(backgroundImage, vec2(x,y) + ${pop()} * vec2(${pop()}, ${pop()})).g`); break;
        case 'getFromBackgroundGreen': push(`texture2D(backgroundImage, vec2(x,y) + ${pop()} * vec2(${pop()}, ${pop()})).b`); break;
        case 'getAudioEnergy': push(`getEnergy(int(clamp(${pop()}, 0.0, 0.999999)))`); break;
        case 'mod': push(`mod(${pop()}, ${pop()})`); break;
        case 'max': push(`max(${pop()}, ${pop()})`); break;
        case 'min': push(`min(${pop()}, ${pop()})`); break;
        case 'exp': push(`exp(${pop()})`); break;
        case 'log': push(`log(${pop()})`); break;
        default:
          // push(env[val] != undefined ? env[val] : val);
          push(val)
      }
    });


    return `
    r = rect(${(this.col * width / cols*2).toFixed(10)}, ${(this.row * height / rows * 2 - height).toFixed(10)}, ${(width / cols * 2).toFixed(10)}, ${(height / rows * 2).toFixed(10)}, vec3(1.0, 1.0, 1.0));
    if(r != vec3(0.0, 0.0, 0.0)) {
      ${Array.from({length: maxi}, (v, i) => `float x_${this.id}_${i}`).join(';\n')};
      ${result}

      ${shuffle([`float R = ${pop()};`, `float G = ${pop()};`, `float B = ${pop()};`]).join("\n")}
      col = r * vec3(R * 255.0, G * 255.0, B * 255.0);

      scene = mix(scene, col, col);
    }
    `;
  }
}



class geneticGUI {
  constructor(operators, symbols) {
    this.gui = new dat.GUI({width: 200});

    const operatorFolder = this.gui.addFolder('Operators');
    const symbolFolder = this.gui.addFolder('Symbols');

    const addRadio = (op, folder) => {
      this[op] = true;
      const controller = folder.add(this, op);
      controller.onFinishChange(updateContainerExps);
      controller.domElement.parentNode.children[0].setAttribute("style", "float:left; width:90%")
      controller.domElement.setAttribute("style", "float:right; width:10%")
    }

    const addButton = (name) => {
      this.gui.add(this, name).domElement.parentNode.children[0].setAttribute("style", "width:100%")
    }

    operators.forEach(op => addRadio(op, operatorFolder));
    symbols.forEach(op => addRadio(op, symbolFolder));

    addButton('resetTime')
    addButton('cull');
    addButton('toggleMusic');
    addButton('toggleMaximize');

    this.addValue('mutateBy', mutateBy, 0, 100, 1);
    this.addValue('mutateChance', .7, 0, 1);
    this.addValue('mergeNtimes', 2, 0, 10, 1);
    this.addValue('xResolutionScale', cols, 0, 10);
    this.addValue('yResolutionScale', rows, 0, 10);
    this.addValue('timeSpeed', 1, 0, 100, .00001);
    this.addValue('speed', 1, 0, 100, .00001);

    this.addValue("moveSpeed", 1, -100, 100);
    this.addValue('scrollSpeed', .0003, -1, 1);
    this.addValue('maxScrollSpeed', .5, -1, 1);
    this.addValue('randValChance', .1, 0, 1);
    this.addValue('randSymbolChance', .4, 0, 1);
    this.addValue('renderScale', 1, 0, 100, 1);

    let musicFolder = this.gui.addFolder("music");
    musicLevelList.forEach(l => addRadio(l, musicFolder))
  }

  addValue(name, defaultVal, start, end, incr) {
    this[name] = defaultVal;
    this.gui.add(this, name, start, end, incr);
  }

  resetTime() {
    time = 0;
  }

  cull() {
    cull();
  }

  toggleMusic() {
    toggleMusic();
  }

  toggleMaximize() {
    const selected = getSelectedContainers();

    let needUpdate = false;
    if (!isMaximized && selected.length === 1) {
      maximizeState.container = selected[0];
      // print('maximizing ', maximizeState.container);
      maximizeState.rows = rows;
      maximizeState.cols = cols;
      maximizeState.row = maximizeState.container.row;
      maximizeState.col = maximizeState.container.col;
      maximizeState.container.row = 0;
      maximizeState.container.col = 0;
      rows = 1;
      cols = 1;
      needUpdate = true;
      requestPointerLock();
    } else if (isMaximized) {
      maximizeState.container.row = maximizeState.row;
      maximizeState.container.col = maximizeState.col;
      rows = maximizeState.rows;
      cols = maximizeState.cols;
      needUpdate = true;
      exitPointerLock();
    }

    // print(maximizeState);

    selected.forEach(container => container.toggleSelection());
    if (needUpdate) {
      if (isMaximized) {
        xResolution /= this.xResolutionScale
        yResolution /= this.yResolutionScale
        cursor();
      } else {
        xResolution *= this.xResolutionScale
        yResolution *= this.yResolutionScale
        noCursor();
      }
      isMaximized = ! isMaximized;
      updateShader();
    }
  }
}


function mouseWheel(event) {
  S.handleScrollEvent(event)
  return false;
}
class ScrollScale {
  constructor() {
    this.pos = createVector();
    this.scale = 1;

  }

  handleScrollEvent(event) {
    const delta = createVector(event.deltaX / width, event.deltaY / height).mult(-gui.moveSpeed);

    const s = event.wheelDelta < 0 ? -1 : 1;

    const scaleMove = min(gui.maxScrollSpeed, abs(event.wheelDelta) * gui.scrollSpeed);
    if (!event.ctrlKey) {
      this.pos.sub(delta.mult(this.scale));
    } else {
      const mousePos = createVector((event.x / width) % (1.0 / cols), (event.y / height) % (1 / rows));
      const scaledMouse = this.scalePt(mousePos);
      const mouseDiff = this.pos.copy().sub(scaledMouse);
      this.pos.add(mouseDiff.mult(gui.scrollSpeed * 10 * s))
      this.scale *= (1 - s * scaleMove);
    }
    // print({mousePos, delta, pos: this.pos, scale: this.scale})
  }

  render() {
    stroke(0);
    rectMode(CENTER);

    rect(this.pos.x * width, this.pos.y * height, this.scale * width * .1, this.scale * height * .1)
  }

  scalePt(pt) {
    // return pt.copy().mult(this.scale).add(this.pos);
    return pt.copy().sub(.5,.5).mult(this.scale).add(this.pos)
  }
}