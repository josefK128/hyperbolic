// fragment shader
// raymarch - cubes
export var uniforms:Object = {
              tDiffuse: {type: 't', value: null},
              uVertex: {type: 'v3', value: new THREE.Vector3()}, //rm_point.getWorldPosition(),
              uAspect: {type: 'f', value: 1.0}, //aspect,
              uFovscale: {type: 'f', value: 1.0}, //fov_initial/lens.fov,
              uCam_fwd: {type: 'v3', value: new THREE.Vector3(0,0,-1)}, //cam_fwd,
              uCam_up: {type: 'v3', value: new THREE.Vector3(0,1,0)},  //cam_up,
              uCam_right: {type: 'v3', value: new THREE.Vector3(1,0,0)}, //cam_right
              uRed:{type: 'f', value: 0.0},
              uTime:{type: 'f', value: 0.0},
              uResolution:{type: 'v2', value: new THREE.Vector2(960,1080)}
            };

export var fsh:string =`
#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform vec2 uResolution;

#define RAY_DEPTH 128
#define MAX_DEPTH 100.0
#define DISTANCE_MIN 0.01

const vec3 CamPos = vec3(0,0,1);  //vec3(5,10.0,6.0);
const vec3 CamLook = vec3(0,0,-1); // vec3(0,0,0)
const vec3 LightDir1 = vec3(.7,1,-1.0);
const vec3 LightColour1 = vec3(1.2,1.05,1);
const vec3 LightDir2 = vec3(0,0,1);
const vec3 LightColour2 = vec3(.38,.4,.6);
const float LightSpecular = 64.0;
const float LightSpecularHardness = 256.0;
const vec3 Diffuse = vec3(0.85);
const float AmbientFactor = 0.05;
const float NoiseSize = 128.0;
const float NoiseRoughness = 0.5;


float Hash(in float n) {
    return fract(sin(n)*43758.5453123);
}

float Noise(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*157.0 + 113.0*p.z;
    return mix(mix(mix( Hash(n+  0.0), Hash(n+  1.0),f.x),
                   mix( Hash(n+157.0), Hash(n+158.0),f.x),f.y),
               mix(mix( Hash(n+113.0), Hash(n+114.0),f.x),
                   mix( Hash(n+270.0), Hash(n+271.0),f.x),f.y),f.z);
}

vec3 RotateZ(vec3 p, float a) {
	float c,s;
	vec3 q=p;
	c = cos(a);
	s = sin(a);
	p.x = c * q.x - s * q.y;
	p.y = s * q.x + c * q.y;
	return p;
}

// polynomial smooth
float smax(float a, float b, float k) {
   float h = clamp(0.5+0.5*(b-a)/k, 0.0, 1.0);
   return mix(a, b, h) - k*h*h;
}

float RoundBox(vec3 p, vec3 b, float r) {
   return length(max(abs(p)-b,0.0))-r;
}

float Torus(vec3 p, vec2 t) {
   vec2 q = vec2(length(p.xz)-t.x,p.y);
   return length(q)-t.y;
}

float Replicate(vec3 p, vec3 c) {
   vec3 q = mod(p,c) - 0.5 * c;
   float distBox = RoundBox(q, vec3(0.5,0.5,0.5), 0.15);
   float distTorus = Torus(q, vec2(0.75,0.4+(sin(uTime/2.0))*0.25));
   return smax(distBox, distTorus, 0.2);
   //return Torus(q, vec2(1,0.4));
}

// This should return continuous positive values when outside and negative values inside,
// which roughly indicate the distance of the nearest surface.
float Dist(vec3 pos) {
   pos = RotateZ(pos, sin(uTime));
   return Replicate(pos, vec3(5));// + Noise(pos*NoiseSize)*NoiseRoughness/NoiseSize;
}

float CalcAO(vec3 p, vec3 n) {
	float r = 0.0;
	float w = 1.0;
	for (float i=1.0; i<=5.0; i++)
	{
		float d0 = (i / 5.0) * 1.25;
		r += w * (d0 - Dist(p + n * d0));
		w *= 0.5;
	}
	float ao = 1.0 - clamp(r,0.0,1.0);
	return ao;
}

vec3 GetNormal(vec3 pos) {
   const vec2 delta = vec2(0.01, 0);
   
   vec3 n;
   n.x = Dist( pos + delta.xyy ) - Dist( pos - delta.xyy );
   n.y = Dist( pos + delta.yxy ) - Dist( pos - delta.yxy );
   n.z = Dist( pos + delta.yyx ) - Dist( pos - delta.yyx );
   
   return normalize(n);
}

// Based on a shading method by Ben Weston. Added AO to the original.
vec4 Shading(vec3 pos, vec3 rd, vec3 norm) {
   float ao = CalcAO(pos, norm) * AmbientFactor;
	vec3 light1 = LightColour1 * max(0.0, dot(norm, normalize(LightDir1))) + ao;
	vec3 light2 = LightColour2 * max(0.0, dot(norm, normalize(LightDir2))) + ao;
	
	vec3 view = normalize(-rd);
	vec3 heading = normalize(view + LightDir1);
	float specular = pow(max(0.0, dot(heading, norm)), LightSpecularHardness);
	
	return vec4(Diffuse * (light1 + light2) + (specular * LightSpecular * LightColour1), 1.0 );
}

vec3 sunLight  = normalize( vec3(0.35, 0.2, .3) );
vec3 sunColour = vec3(1.0, .75, .6);
vec3 Sky(in vec3 rd) {
	float sunAmount = max(dot(rd, sunLight), 0.0);
	float v = pow(1.0 - max(rd.y,0.0),6.);
	vec3  sky = mix(vec3(.1, .2, .3), vec3(.32, .32, .32), v);
	sky = sky + sunColour * sunAmount * sunAmount * .25;
	sky = sky + sunColour * min(pow(sunAmount, 800.0)*1.5, .3);
	
	return clamp(sky, 0.0, 1.0);
}

vec3 GetRay(vec3 dir, vec2 pos) {
   pos = pos - 0.5;
   pos.x *= uResolution.x/uResolution.y;
   
   dir = normalize(dir);
   vec3 right = normalize(cross(vec3(0.,1.,0.),dir));
   vec3 up = normalize(cross(dir,right));
   
   return dir + right*pos.x + up*pos.y;
}

vec4 March(vec3 ro, vec3 rd) {
   float t = 0.0;
   float d = 1.0;
   for (int i=0; i<RAY_DEPTH; i++)
   {
      vec3 p = ro + rd * t;
      d = Dist(p);
      if (abs(d) < DISTANCE_MIN)
      {
         return vec4(p, 1.0);
      }
      t += d;
      if (t >= MAX_DEPTH) break;
   }
   return vec4(0.0);
}

void main() {
   vec2 p = gl_FragCoord.xy / uResolution.xy;
   vec3 ro = CamPos;
   vec3 rd = normalize(GetRay(CamLook-CamPos, p));
   vec4 res = March(ro, rd);
   if (res.a == 1.0) res.xyz = clamp(Shading(res.xyz, rd, GetNormal(res.xyz)).xyz, 0.0, 1.0);
   else res.xyz = Sky(res.xyz);
   
   gl_FragColor = vec4(res.rgb, 1.0);
}
`;
