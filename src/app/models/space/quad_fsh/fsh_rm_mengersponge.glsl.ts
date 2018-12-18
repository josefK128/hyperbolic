// fragment shader
// raymarch - mengersponge
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



export var fsh:string = `
#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;   //time;  
uniform vec2 resolution; // GLSL built-in ?
//uniform vec3 uCam_fwd;  //cameraLookat; // 0,0,0

#define GAMMA 0.8
#define AO_SAMPLES 5
#define RAY_DEPTH 256
#define MAX_DEPTH 200.0
#define SHADOW_RAY_DEPTH 16
#define DISTANCE_MIN 0.001
#define PI 3.14159265

const vec2 delta = vec2(0.001, 0.);
const vec3 cameraPos = vec3(0,0,1);  //cameraPos; // 0,0,0
const vec3 cameraLookat = vec3(0,0,-1);  //cameraLookat; // 0,0,0
const vec3 lightDir = vec3(-2.0,0.8,-1.0);
const vec3 lightColour = vec3(2.0,1.8,1.5);
const float specular = 64.0;
const float specularHardness = 512.0;
const vec3 diffuse = vec3(0.25,0.25,0.25);
const float ambientFactor = 2.65;  // 0.65
const bool ao = true;
const bool shadows = true;
const bool rotateWorld = true;
const bool antialias = false;


vec3 RotateY(vec3 p, float a)
{
   float c,s;
   vec3 q=p;
   c = cos(a);
   s = sin(a);
   p.x = c * q.x + s * q.z;
   p.z = -s * q.x + c * q.z;
   return p;
}

float Cross(vec3 p)
{
   p = abs(p);
   vec3 d = vec3(max(p.x, p.y),
                 max(p.y, p.z),
                 max(p.z, p.x));
   return min(d.x, min(d.y, d.z)) - (1.0 / 3.0);
}

float CrossRep(vec3 p)
{
   vec3 q = mod(p + 1.0, 2.0) - 1.0;
   return Cross(q);
}

float CrossRepScale(vec3 p, float s)
{
   return CrossRep(p * s) / s;   
}

const int MENGER_ITERATIONS = 4;

float Dist(vec3 pos)
{
   if (rotateWorld) pos = RotateY(pos, sin(uTime*0.025)*PI);
   
   float scale = 0.05;
   float dist = 0.0;
   for (int i = 0; i < MENGER_ITERATIONS; i++)
   {
      dist = max(dist, -CrossRepScale(pos, scale));
      scale *= 3.0;
   }
   return dist;
}

// Based on original by IQ - optimized to remove a divide
float CalcAO(vec3 p, vec3 n)
{
   float r = 0.0;
   float w = 1.0;
   for (int i=1; i<=AO_SAMPLES; i++)
   {
      float d0 = float(i) * 0.3;
      r += w * (d0 - Dist(p + n * d0));
      w *= 0.5;
   }
   return 1.0 - clamp(r,0.0,1.0);
}

// Based on original code by IQ
float SoftShadow(vec3 ro, vec3 rd, float k)
{
   float res = 1.0;
   float t = 0.1;          // min-t see http://www.iquilezles.org/www/articles/rmshadows/rmshadows.htm
   for (int i=0; i<SHADOW_RAY_DEPTH; i++)
   {
      if (t < 20.0)  // max-t
      {
         float h = Dist(ro + rd * t);
         res = min(res, k*h/t);
         t += h;
      }
   }
   return clamp(res, 0.0, 1.0);
}

vec3 GetNormal(vec3 pos)
{
   vec3 n;
   n.x = Dist( pos + delta.xyy ) - Dist( pos - delta.xyy );
   n.y = Dist( pos + delta.yxy ) - Dist( pos - delta.yxy );
   n.z = Dist( pos + delta.yyx ) - Dist( pos - delta.yyx );
   
   return normalize(n);
}

// Based on a shading method by Ben Weston. Added AO and SoftShadows to original.
vec4 Shading(vec3 pos, vec3 rd, vec3 norm)
{
   vec3 light = lightColour * max(0.0, dot(norm, lightDir));
   vec3 heading = normalize(-rd + lightDir);
   float spec = pow(max(0.0, dot(heading, norm)), specularHardness);
   
   light = (diffuse * light) + (spec * specular * lightColour);
   if (shadows) light *= SoftShadow(pos, lightDir, 16.0);
   if (ao) light += CalcAO(pos, norm) * ambientFactor;
   return vec4(light, 1.0);
}

// Original method by David Hoskins
vec3 Sky(in vec3 rd)
{
   float sunAmount = max(dot(rd, lightDir), 0.0);
   float v = pow(1.0 - max(rd.y,0.0),6.);
   vec3 sky = mix(vec3(.1, .2, .3), vec3(.32, .32, .32), v);
   sky += lightColour * sunAmount * sunAmount * .25 + lightColour * min(pow(sunAmount, 800.0)*1.5, .3);
   
   return clamp(sky, 0.0, 1.0);
}

// Camera function by TekF
// Compute ray from camera parameters
vec3 GetRay(vec3 dir, vec2 pos)
{
   pos = pos - 0.5;
   pos.x *= resolution.x/resolution.y;
   
   dir = normalize(dir);
   vec3 right = normalize(cross(vec3(0.,1.,0.),dir));
   vec3 up = normalize(cross(dir,right));
   
   return dir + right*pos.x + up*pos.y;
}

vec4 March(vec3 ro, vec3 rd)
{
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

void main()
{
   const int ANTIALIAS_SAMPLES = 4;
   
   vec4 res = vec4(0.0);
   
   if (antialias)
   {
      float d_ang = 2.*PI / float(ANTIALIAS_SAMPLES);
      float ang = d_ang * 0.33333;
      float r = .3;
      for (int i = 0; i < ANTIALIAS_SAMPLES; i++)
      {
         vec2 p = vec2((gl_FragCoord.x + cos(ang)*r) / resolution.x, (gl_FragCoord.y + sin(ang)*r) / resolution.y);
         vec3 ro = cameraPos;
         vec3 rd = normalize(GetRay(cameraLookat-cameraPos, p));
         vec4 _res = March(ro, rd);
         if (_res.a == 1.0) res.xyz += clamp(Shading(_res.xyz, rd, GetNormal(_res.xyz)).xyz, 0.0, 1.0);
         else res.xyz += Sky(_res.xyz);
         ang += d_ang;
      }
      res /= float(ANTIALIAS_SAMPLES);
   }
   else
   {
      vec2 p = gl_FragCoord.xy / resolution.xy;
      vec3 ro = cameraPos;
      vec3 rd = normalize(GetRay(cameraLookat-cameraPos, p));
      res = March(ro, rd);
      if (res.a == 1.0) res.xyz = clamp(Shading(res.xyz, rd, GetNormal(res.xyz)).xyz, 0.0, 1.0);
      else res.xyz = Sky(res.xyz);
   }
   
   gl_FragColor = vec4(res.xyz, 1.0);
}
`;//fsh
