precision mediump float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define MID 126.0
#define TOP 255.0

// grab texcoords from vert shader
varying vec2 vTexCoord;

uniform sampler2D positions;
uniform sampler2D velocities;
uniform float MAXSPEED;

uniform sampler2D lastFrame;
uniform vec2 resolution;


vec2 velColor2vec(vec4 color) {
  // return vec2((color.x - MID) / MID * MAXSPEED, (color.y - MID) / MID * MAXSPEED);
  // return (color.xy * 255. - MID) / MID * MAXSPEED;
  return (color.xy - .5) * 2. * MAXSPEED;
}

vec2 posColor2vec(vec4 color) {
  return color.xy;
}

vec4 pos2color(vec2 pos) {
  vec2 p = fract(pos) * TOP;

  return vec4(
    floor(p.x),
    floor(p.y),
    255., 255.) / 255.;
}

vec2 getIndices(vec2 uv) {
  vec2 scaled = uv * resolution;
  return scaled - fract(scaled);
}

vec4 texture(sampler2D tex, vec2 bigPos) {
  return texture2D(tex, (bigPos + .5) / resolution);
}

bool hasPt(vec4 positionValue) {
  return step(1., positionValue.z) == 1.;
}


float applyThreshold(vec3 color, float thresh) {
  return step(thresh, (color.x + color.y + color.z)/3.);
}

void main() {

  vec2 uv = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;
  vec3 lastColor = texture2D(lastFrame, uv).xyz;
  vec3 posColor = texture2D(positions, uv).xyz;
  vec4 velColor = texture2D(velocities, uv);

  float thresh = applyThreshold(posColor, .1);
  vec3 color = vec3(thresh) * (1. - length(velColor2vec(velColor)));

  color = mix(lastColor, color, max(color.x,.07));


  gl_FragColor = vec4(color, 1.);
}