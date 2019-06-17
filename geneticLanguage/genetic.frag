precision mediump float;
varying vec2 vTexCoord;


const int stackSize = 50;
int i = 0;
vec3 stack[50];

void setStack(int i, vec3 val) {
  for(int idx = 0; idx < stackSize; idx ++) {
    if (idx == i) {
      stack[idx] = val;
      return;
    }
  }
}

vec3 getStack(int i) {
  for(int idx = 0; idx < stackSize; idx ++) {
    if (idx == i) {
      return stack[idx];
    }
  }
}

void push(vec3 val) {
  setStack(i, val);
  i++;
}

vec3 pop() {
  if (i == 0) {
    return vec3(0.0, 0.0, 0.0);
  }
  i--;
  return getStack(i);
}

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vec2 coord = vTexCoord;
  vec3 pos = vec3(vTexCoord, 0.0);

  // use the fract function so that the values always fluctuate between 0 - 1
  // fract will return whatever number is to the right of the decimal point
  // it is built in to glsl
  float random = rand(coord);

  gl_FragColor = vec4(random, random, random, 1.0 );
}