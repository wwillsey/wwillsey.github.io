var cnv, soundFile, fft, peakDetect;
var ellipseWidth = 10;

function preload() {
  soundFile = loadSound('../geneticLanguage/sounds/static_snow.mp3');
}

function setup() {
  background(0);
  noStroke();
  fill(255);
  textAlign(CENTER);

  // p5.PeakDetect requires a p5.FFT
  fft = new p5.FFT();
  peakDetect = new p5.PeakDetect();
}

function draw() {
  background(0);
  text('click to play/pause', width/2, height/2);

  // peakDetect accepts an fft post-analysis
  fft.analyze();
  peakDetect.update(fft);

  if ( peakDetect.isDetected ) {
    ellipseWidth = 50;
  } else {
    ellipseWidth = 0.95;
  }

  ellipse(width/2, height/2, ellipseWidth, ellipseWidth);
}

// toggle play/stop when canvas is clicked
function mouseClicked() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    if (soundFile.isPlaying() ) {
      soundFile.stop();
    } else {
      print('play')
      soundFile.play();
    }
  }
}