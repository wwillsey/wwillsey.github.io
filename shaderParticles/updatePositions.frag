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
uniform vec2 resolution;

const int nBorSize = 3;

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

vec3 getNextPosForCell(vec2 cellPos) {
  vec4 positionColor = texture(positions, cellPos);
  if (hasPt(positionColor)) {
    vec4 velocityColor = texture(velocities, cellPos);

    vec2 pos = cellPos + posColor2vec(positionColor);
    vec2 vel = velColor2vec(velocityColor);

    pos += vel;
    return vec3(pos, 1.0);
  }
  return vec3(0.);
}

vec4 updateCell(vec2 uv) {
  vec2 cellPos = getIndices(uv);

  for(int dx = -nBorSize; dx <= nBorSize ; dx++){
    for(int dy = -nBorSize; dy <= nBorSize ; dy++){
      vec2 samplePos = cellPos + vec2(dx ,dy);
      samplePos = mod(samplePos, resolution);


      if(samplePos.x < 0. || samplePos.y < 0. || samplePos.x > resolution.x || samplePos.y > resolution.y) {
        continue;
      }

      vec3 newPos = getNextPosForCell(samplePos);
      newPos.xy = mod(newPos.xy, resolution);

      if (step(.5, newPos.z) == 1.0) { // valid pos
        vec2 newPosCell = getIndices(newPos.xy / resolution);


        if(0. == step(.1, distance(newPosCell, cellPos))) {
          return pos2color(newPos.xy);
          // return texture(velocities, samplePos);
        }
      }
    }
  }
  return vec4(vec3(0.), 1.);
}


void main() {

  vec2 uv = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;

  gl_FragColor = updateCell(uv);
}