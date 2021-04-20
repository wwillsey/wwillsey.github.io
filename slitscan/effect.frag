precision mediump float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// grab texcoords from vert shader
varying vec2 vTexCoord;

// our textures coming from p5
// uniform sampler2D tex0;
uniform sampler2D img;
uniform sampler2D tex;

uniform float time;
uniform float center;
uniform float offsetPowX;
uniform float offsetPowY;
uniform float yOffsetDiv;
uniform float spotMix;


void main() {

  vec2 uv = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;

  float yOff = pow(abs(.5 - uv.x), offsetPowY) * 1.0;
  uv.y = ((uv.y - .5) / (yOff + yOffsetDiv)) + .5;
  // uv.y += yOff;
  // if (uv.y > .5) {
  //   uv.y += yOff;
  // } else {
  //    uv.y -= yOff;
  // }

  // uv.x += timeOffset;
  // uv.x = mod(uv.x, 1.0);

  float timeOffset = time;

  uv.x = abs(center - uv.x);
  timeOffset += pow(uv.x, offsetPowX);
  uv.x -= timeOffset;


  // if(uv.x > center) {
  //   uv.x -= center;
  //   uv.x -= timeOffset;
  // } else {
  //   uv.x += timeOffset;
  // }

  uv.x = mod(uv.x, 1.0);

  vec4 spot = texture2D(img, uv);
  vec4 tex = texture2D(tex, mix(vTexCoord, uv, spotMix));

  // gl_FragColor = vec4(tex);
  gl_FragColor = mix(spot, tex, spot);
}