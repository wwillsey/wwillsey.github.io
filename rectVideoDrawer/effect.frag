precision mediump float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// grab texcoords from vert shader
varying vec2 vTexCoord;

// our textures coming from p5
// uniform sampler2D tex0;
uniform sampler2D tex;
uniform sampler2D rectPos;
uniform sampler2D rectDim;
uniform vec2 resolution;
const int N_RECTS = 500;


// vec3 rect(float x, float y, float w, float h, vec3 color){
//   vec2 coord = gl_FragCoord.xy;
//   coord.y = resolution.y - coord.y;
//   float width = 1.0 -mix(0.0, 1.0, step(x + w, coord.x));
//   float xPos =  1.0 -mix(0.0, 1.0, step(x, coord.x));
//   float height = 1.0 - mix(0.0, 1.0, step(y + h, coord.y));
//   float yPos = 1.0 - mix(0.0, 1.0, step(y, coord.y));
//   vec3 col = color;//rgb(color.r, color.g, color.b);
//   return  col * ((height - yPos) * (width - xPos));
// }

float rectangle(in vec2 st, in vec2 origin, in vec2 dimensions) {
    // bottom-left
    vec2 bl = step(origin, st);
    float pct = bl.x * bl.y;

    // top-right
    vec2 tr = step(1.0 - origin - dimensions, 1.0 - st);
    pct *= tr.x * tr.y;

    return pct;
}

float rect(vec2 pt, vec2 pos, vec2 dim) {
  vec2 upperLeft = pos - dim/2.;
  vec2 lowerRight = pos + dim/2.;

  vec2 compare1 = step(upperLeft, pt);
  vec2 compare2 = step(pt, lowerRight);

  return compare1.x * compare1.y * compare2.x * compare2.y;
}

vec4 applyRects(vec2 uv, vec4 col) {
  for(int i = 0; i < N_RECTS; i++) {
    vec2 pos = texture2D(rectPos, vec2(float(i) / float(N_RECTS), 0.)).xy;
    vec2 dim = texture2D(rectDim, vec2(float(i) / float(N_RECTS), 0.)).xy;

    float r = step(.5, rect(uv, pos, dim));
    // scene = mix(vec4(0.,0.,0.,0.), scene, step(.5, r));
    // scene = vec4(vec3(r), 1.);
    // vec3 r = rect(pos.x, pos.y, dim.x, dim.y, vec3(1.));
    if (r == 1.) {
      return col;
    }
  }
  return vec4(0.);
}

void main() {

  vec2 uv = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;

  vec4 col = applyRects(uv, texture2D(tex, uv));

  gl_FragColor = vec4(col);
}