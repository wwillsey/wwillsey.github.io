/* eslint-disable no-use-before-define, class-methods-use-this, no-undef */
let img, mov


let useBackgroundVideo = true;
let backgroundVideo;


let gui, E, recorder, cam;

p5.disableFriendlyErrors

function preload() {
  // img = loadImage('../media/gold.jpg')
  img = loadImage('../media/marble.jpg')
  // img = loadImage('../media/pattern.jpg')
  mov = loadVideo()
}

function setup() {
  createCanvas(1920, 1080, WEBGL);
  cam = createCamera();
  recorder = new ScreenRecorder({
    framerate: 60,
  });

  if (useBackgroundVideo) {
    backgroundVideo = createVideo('../geneticLanguage/videos/breath_ctrl (loop).mp4', () => {
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

  gui = new GUI();
  gui.add("camX", 0, -5000, 5000, 1)
  gui.add("camY", 0, -5000, 5000, 1)
  gui.add("camZ", 1500, -5000, 5000, 1)
  gui.add("rotX", 0, -PI, PI)
  gui.add("rotY", 2.5, -PI, PI)
  gui.add("rotXSpeed", 0, -10, 10)
  gui.add("rotYSpeed", 0.005, -10, 10)
  gui.add("detailX", 50, 1, 2000, 1)
  gui.add("detailY", 70, 1, 2000, 1)
  gui.add("frequency", 12, 0, 100)
  gui.add("amplitude", .2, 0, 10)
  gui.add("speed", .05, 0, 10)
  gui.add("lf_const", 1, 0, 10)
  gui.add("lf_lin", 0, 0, 10)
  gui.add("lf_quad", 0, 0, 10)

  E = new p5.Ease();
  const easeFn = gui.addFolder("easeFn")
  E.listAlgos().forEach(a => easeFn.add(a, a == 'linear').onFinishChange(redraw))
}


function draw() {
  background(0)
  // orbitControl();
  cam.setPosition(gui.camX, gui.camY, gui.camZ)


  if(frameCount == 1) {
    // recorder.toggle();
  }
  // if(frameCount == 600) recorder.toggle()

  rotateY(gui.rotY + frameCount * gui.rotYSpeed)
  rotateX(gui.rotX + frameCount * gui.rotXSpeed)

  // cam.setPosition(gui.camX, gui.camY, gui.camZ)

  // Rotate our geometry on the X and Y axes
  // rotateX(0 * 0.01);
  // rotateY(150 * 0.005);
  // lights()

  let locX = (mouseX - width / 2) * 2;
  let locY = (mouseY - height / 2) * 2;
  // to set the light position,
  // think of the world's coordinate as:
  // -width/2,-height/2 -------- width/2,-height/2
  //                |            |
  //                |     0,0    |
  //                |            |
  // -width/2,height/2--------width/2,height/2
  lightFalloff(gui.lf_const, gui.lf_lin, gui.lf_quad)
  pointLight(80, 80, 80, locX, locY, 800);
  ambientLight(10,10,10)

  // Draw some geometry to the screen
  // We're going to tessellate the sphere a bit so we have some more geometry to work with
  // specularMaterial(200);
  textureWrap(REPEAT, REPEAT)
  textureMode(NORMAL)
  // specularMaterial(0);
  // emissiveMaterial(10, 10, 20);

  if (useBackgroundVideo) {
    texture(backgroundVideo)
  } else {
    texture(img)
  }
  noStroke()
  // shininess(1);
  a = sphere(width / 5, gui.detailX, gui.detailY, mySphere);
  recorder.takeFrame();
}



var mySphere = function _ellipsoid() {
  this.vertices = []
  this.vertexNormals = []
  this.uvs = []
  for (var i = 0; i <= this.detailY; i++) {
    var v = i / this.detailY;
    v = applyEase(gui.easeFn, v)
    var phi = Math.PI * v - Math.PI / 2;
    var cosPhi = Math.cos(phi);
    var sinPhi = Math.sin(phi);

    for (var j = 0; j <= this.detailX; j++) {
      var u = j / this.detailX;
      var theta = 2 * Math.PI * u;
      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);
      var p = createVector(
        cosPhi * sinTheta,
        sinPhi,
        cosPhi * cosTheta
      );

      const disp = gui.amplitude * sin((p.x *p.y) * gui.frequency + frameCount * gui.speed)
      p.setMag(p.mag() + disp)

      this.vertices.push(p);
      this.vertexNormals.push(p);
      this.uvs.push(u, v);
    }
  }
};


let easeCache = {}
function applyEase(folder, val) {
  // return val;

  for(let i = 0; i < Object.keys(folder).length; i++) {
    if(folder[Object.keys(folder)[i]] == true) {
      // return E[Object.keys(folder)[i]](val);
      if (!easeCache[Object.keys(folder)[i]]) {
        easeCache[Object.keys(folder)[i]] = {}
      }
      const test = easeCache[Object.keys(folder)[i]][val]
      if (test != undefined) {
        return test
      }

      const v = E[Object.keys(folder)[i]](val);
      easeCache[Object.keys(folder)[i]][val] = v;
      return v;
    }
  }
  return val
}
