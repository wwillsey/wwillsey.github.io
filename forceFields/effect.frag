precision mediump float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// grab texcoords from vert shader
varying vec2 vTexCoord;

// our textures coming from p5
// uniform sampler2D tex0;
uniform sampler2D img;
uniform vec2 imgResolition;
uniform float forceModifier;

uniform float mouseDown;
uniform vec2 forceDimensions;
uniform float time;
uniform sampler2D forces;



// vec4 texture2D_bilinear(sampler2D t, vec2 uv, vec2 textureSize, vec2 texelSize)
// {
//     vec2 f = fract( uv * textureSize );
//     uv += ( .5 - f ) * texelSize;    // move uv to texel centre
//     vec4 tl = texture2D(t, uv);
//     vec4 tr = texture2D(t, uv + vec2(texelSize.x, 0.0));
//     vec4 bl = texture2D(t, uv + vec2(0.0, texelSize.y));
//     vec4 br = texture2D(t, uv + vec2(texelSize.x, texelSize.y));
//     vec4 tA = mix( tl, tr, f.x );
//     vec4 tB = mix( bl, br, f.x );
//     return mix( tA, tB, f.y );
// }

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


// vec2 getForceAtPt(const vec2 pos) {
//   vec2 posAdj = pos * forceDimensions;
//   posAdj.x = floor(posAdj.x);
//   posAdj.y = floor(posAdj.y);

//   posAdj /= forceDimensions;
//   return texture2D(forces, posAdj).xy - .50196;
// }

vec2 getForceAtPt(const vec2 pos) {
  return (texture2D_bilinear(forces, pos, forceDimensions, 1.0 / forceDimensions).xy - 127. / 255.) * forceModifier;
}



void main() {
  vec2 uv = vTexCoord;
  // the texture is loaded upside down and backwards by default so lets flip it
  uv.y = 1.0 - uv.y;

  vec2 dir = getForceAtPt(uv);
  // vec3 col = texture2D(img, uv - dir).rgb;
  vec3 col = texture2D_bilinear(img, uv - dir, imgResolition,  vec2(1.0,1.0) / imgResolition).rgb;
  // vec3 col = texture2D(forces, uv).rgb;

  // vec3 src = texture2D(sourceImg, uv).rgb;

  // float percent = .0;
  gl_FragColor = vec4(col, 1.0);
}