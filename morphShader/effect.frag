precision mediump float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// grab texcoords from vert shader
varying vec2 vTexCoord;

// our textures coming from p5
// uniform sampler2D tex0;
uniform sampler2D tex1;

uniform float mouseDown;
uniform vec2 resolution;
// uniform vec2 mousePos;
uniform float time;
uniform vec2 balls[10];
const int numBalls = 10;

float isNear(vec2 uv, vec2 ballPos) {
  float dist = distance(uv, ballPos);
  return step(dist, 0.05);
}

vec3 applyBall(vec2 uv, vec2 ballPos) {
  vec3 m = texture2D(tex1, uv).rgb;

  float dist = distance(uv, ballPos);
  vec2 dir = (uv - ballPos) * 0.001 / pow(dist, 2.0);
  vec3 offset = texture2D(tex1, uv + dir).rgb;
  float near = step(dist, 0.05);
  float percent = 0.7;

  return (m * percent + offset * (1.0 - percent)) * near + (1.0 - near) * m;
}

void main() {
  vec2 uv = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;

  float nears = 0.0;
  for (int i = 0; i < numBalls; i++) {
    vec2 ballPos = balls[i];
    ballCol = applyBall(uv, ballPos);
    nears += isNear();
  }
  vec3 col = step(nears, 0.0) * 

  gl_FragColor = vec4(col, 1.0);
}