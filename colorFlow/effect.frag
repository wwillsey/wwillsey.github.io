precision mediump float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// grab texcoords from vert shader
varying vec2 vTexCoord;

// our textures coming from p5
// uniform sampler2D tex0;
uniform sampler2D src;
uniform float offset;
uniform sampler2D colors;
uniform vec2 colorDimensions;
const float maxVal = .99999999;

vec4 texture2D_bilinear(sampler2D t, vec2 uv, vec2 textureSize, vec2 texelSize)
{
vec2 OneTexel = 1.0/textureSize;

vec2 coord1 = uv+vec2(0.0, OneTexel.y);
vec2 coord2 = uv+vec2(OneTexel.x, 0.0 );
vec2 coord3 = uv+OneTexel;
vec2 coord4 = uv;

vec4 s1 = vec4(texture2D(t, coord1));
vec4 s2 = vec4(texture2D(t, coord2));
vec4 s3 = vec4(texture2D(t, coord3));
vec4 s4 = vec4(texture2D(t, coord4));

vec2 Dimensions = uv * textureSize;

float fu = fract(Dimensions.x);
float fv = fract(Dimensions.y);

vec4 tmp1 = mix(s4, s2, fu);
vec4 tmp2 = mix(s1, s3, fu);

return mix(tmp1, tmp2, fv);
}


vec3 getFromColors(float val) {
  // float idx = val * float(colorDimensions.x - 1.);
  // int i = int(floor(idx));
  // int j = i + 1;
  return texture2D(colors, vec2(val, 0.)).rgb;
}

float getValueForColor(vec3 col, float offset) {
  // float val = (col.r + col.g + col.b) / 3.;
  float val = (0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b);
  return mod((val + offset), 1.);
}

void main() {
  vec2 uv = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;

  vec3 srcCol = texture2D(src, uv).rgb;
  // float o = sin(distance(uv, vec2(.5, .5)) * 10.);

  float val = getValueForColor(srcCol, offset);

  vec3 col = getFromColors(min(val, maxVal));

  gl_FragColor = vec4(col, 1.0);
}