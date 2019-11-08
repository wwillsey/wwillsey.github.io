precision mediump float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// grab texcoords from vert shader
varying vec2 vTexCoord;

// our textures coming from p5
// uniform sampler2D tex0;
uniform sampler2D img;

uniform float mouseDown;
uniform vec2 resolution;
uniform vec2 forceDimensions;
// uniform vec2 mousePos;
uniform float time;
const int forceX = 30;
const int forceY = 30;
uniform vec2 forces[forceX * forceY];



// vec2 getForceAtPt(vec2 pos) {
//   vec2 totalForce = vec2(0.0, 0.0);
//   for (int i = 0; i < 400; i++) {
//     vec2 force = forces[i];
//     vec2 forcePos = vec2(mod(float(i), float(forceDimensions.x)), floor(float(i) / forceDimensions.y)) / forceDimensions;
//     float dist = distance(pos, forcePos);
//     vec2 newForce = force / (pow(dist + 1., 10.0));
//     newForce = normalize(newForce) * min(length(newForce), 1.0);
//     totalForce -= newForce;
//   }
//   return totalForce;
// }

vec2 getForceAtPt(const vec2 pos) {
  for(int x = 0; x < forceX; x++) {
    for(int y = 0; y < forceY; y++) {
      if (int(floor(pos.y * float(forceY))) == y && int(floor(pos.x * float(forceX))) == x) {
        return forces[x + forceY * y];
      }
    }
  }
}


void main() {
  vec2 uv = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;

  vec2 dir = getForceAtPt(uv) * .1;
  vec3 col = texture2D(img, uv + dir).rgb;

  gl_FragColor = vec4(col, 1.0);
}