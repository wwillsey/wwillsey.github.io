precision mediump float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718
#define MID 126.0
#define TOP 255.0

// grab texcoords from vert shader
varying vec2 vTexCoord;

uniform sampler2D positions;
uniform sampler2D velocities;
uniform sampler2D lastFrame;
uniform float MAXSPEED;
uniform bool mouseDown;
uniform vec2 mousePos;
uniform vec2 resolution;
uniform float frictionAmt;
uniform float gravity;
uniform float mouseDownAmt;
uniform float mouseDownSize;
uniform float lookAheadDist;
uniform float lookAheadRotate;

const int nBorSize = 3;


vec2 velColor2vec(vec4 color) {
  // return vec2((color.x - MID) / MID * MAXSPEED, (color.y - MID) / MID * MAXSPEED);
  // return (color.xy * 255. - MID) / MID * MAXSPEED;
  return (color.xy - .5) * 2. * MAXSPEED;
}

vec4 vel2color(vec2 vel) {
  return vec4(
    vel / MAXSPEED / 2. + .5,
    0.,1.);
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

vec2 applySlimeForce(vec2 vel, vec2 pos) {
  vec2 dirLeft = vec2(
    cos(lookAheadRotate) * vel.x - sin(lookAheadRotate) * vel.y,
    sin(lookAheadRotate) * vel.x + cos(lookAheadRotate) * vel.y
  );
  vec2 dirRight = vec2(
    cos(-lookAheadRotate) * vel.x - sin(-lookAheadRotate) * vel.y,
    sin(-lookAheadRotate) * vel.x + cos(-lookAheadRotate) * vel.y
  );


  float vLeft = length(texture(lastFrame, pos + normalize(dirLeft) * lookAheadDist));
  float vStraight = length(texture(lastFrame, pos + normalize(vel) * lookAheadDist));
  float vRight = length(texture(lastFrame, pos + normalize(dirRight) * lookAheadDist));

  if (vLeft > vStraight && vLeft > vRight) {
    return dirLeft;
  }
  if (vRight > vStraight && vRight > vLeft) {
    return dirRight;
  }
  return vel;
}

vec2 applyForceOnVel(vec2 vel, vec2 pos) {
  pos /= resolution;
  vel += .003925;

  // vel *= .9;
  if (mouseDown && distance(pos, mousePos) < mouseDownSize) {
    vec2 force = (pos - mousePos) / distance(pos, mousePos);
    vel += force * mouseDownAmt;
  }


  vec2 friction = vec2(vel.x * vel.x, vel.y * vel.y);
  vel.x -= sign(vel.x) * vel.x * vel.x  * frictionAmt;
  vel.y -= sign(vel.y) * vel.y * vel.y *  frictionAmt;
  // vel -= normalize(vel) * friction * frictionAmt;

  // vel = normalize(vel) * 2.;
  vel = applySlimeForce(vel, pos * resolution);

  vel.y += gravity;
  return vel;
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

      // if(samplePos.x < 0. || samplePos.y < 0. || samplePos.x > resolution.x || samplePos.y > resolution.y) {
      //   continue;
      // }

      vec3 newPos = getNextPosForCell(samplePos);
      newPos.xy = mod(newPos.xy, resolution);

      if (step(.5, newPos.z) == 1.0) { // valid pos
        vec2 newPosCell = getIndices(newPos.xy / resolution);

        if(0. == step(.1, distance(newPosCell, cellPos))) {
          // return pos2color(newPos.xy);
          vec2 newVel = velColor2vec(texture(velocities, samplePos));
          return vel2color(applyForceOnVel(newVel, newPos.xy));
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