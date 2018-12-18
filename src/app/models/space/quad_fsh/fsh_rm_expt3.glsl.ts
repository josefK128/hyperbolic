// fragment shader
// raymarch - expt3-infinite mengersponge - adapted from Roast
export var uniforms:Object = {
              tDiffuse: {type: 't', value: null},
              uVertex: {type: 'v3', value: new THREE.Vector3()}, //rm_point.getWorldPosition(),
              uAspect: {type: 'f', value: 1.0}, //aspect,
              uFovscale: {type: 'f', value: 1.0}, //fov_initial/lens.fov,
              uCam_fwd: {type: 'v3', value: new THREE.Vector3(0,0,-1)}, //cam_fwd,
              uCam_up: {type: 'v3', value: new THREE.Vector3(0,1,0)},  //cam_up,
              uCam_right: {type: 'v3', value: new THREE.Vector3(1,0,0)}, //cam_right
              uRed:{type: 'f', value: 0.5},
              uTime:{type: 'f', value: 0.0},
              uResolution:{type: 'v2', value: new THREE.Vector2(960,1080)}
            };

export var fsh:string =`
     #ifdef GL_ES
     precision mediump float;
     #endif
     uniform sampler2D tDiffuse; // quad-sgTarget texture map 
     uniform vec3 uVertex;       // custom sg-vertex to use in raymarch
     uniform float uFovscale;    // custom scalar to sync zoom fov changes
     uniform float uAspect;      // custom scalar to correct for screen aspect
     uniform vec3 uCam_up;       // custom up-vector to modify rm objects.xyz
     uniform vec3 uCam_fwd;      // custom fwd-vector to modify rm objects.xyz
     uniform vec3 uCam_right;    // custom R-vector to modify rm objects.xyz
     uniform float uRed;         // test scalar for uniform animation
     uniform float uTime;        // scalar for ellapsed time - for animation
     varying vec2 vuv;
 


uniform vec2 resolution; // GLSL built-in ?
//uniform vec3 uCam_fwd;  //cameraLookat; // 0,0,0

#define GAMMA 0.8
#define AO_SAMPLES 5
#define RAY_DEPTH 256
#define MAX_DEPTH 200.0
#define SHADOW_RAY_DEPTH 16
#define DISTANCE_MIN 0.001
#define PI 3.14159265
#define PIOV4 0.785398 

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
const bool antialias = false;
const bool rotateWorld = true;











vec3 RotateY(vec3 p, float a) {
	float c,s;
	vec3 q=p;
	c = cos(a);
	s = sin(a);
	p.x = c * q.x - s * q.z;
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
   //if (rotateWorld) pos = RotateY(pos, sin(uTime*0.025)*PI);
   //if (rotateWorld) pos = RotateY(pos, sin(uTime*0.025)*PIOV4);
   //if (rotateWorld) pos = RotateY(pos, sin(uTime*0.025)*0.5);

   pos.xyz += uVertex.xyz;
  
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







vec4 colormarch(vec3 ro, vec3 rd) {
   float t = 0.0;
   float d = 1.0;
   vec3 p;
   for (int i=0; i<RAY_DEPTH; i++)
   {
      if(rd.z > ro.z) break; 
      //if(rd.y > 0.0) break; 
      //if(rd.x < 0.0) break; 
      p = ro + rd * t;
      d = Dist(p);
      if (abs(d) < DISTANCE_MIN)
      {
         vec3 c = clamp(Shading(p, rd, GetNormal(p)).xyz, 0.0, 1.0);
         return vec4(c, 1.0);
      }
      t += d;
      if (t >= MAX_DEPTH) break;
   }
   //return vec4(Sky(p), 1.0);
   return vec4(0.0,0.0,0.0,1.0);
}



     // blend( color(march(),fwd) )
     vec4 blend(vec4 pixel){
       // blend - alpha + (1-alpha) - best for layering - poor for post!
       //float alpha = 0.1 * pixel.a;  // 0.5

       float alpha = 0.6;
       vec4 blnd = (1.0-alpha)*texture2D(tDiffuse, vuv) + alpha*pixel;

       // color mix
       //blnd.r *= 1.2;
       blnd.r *= 1.2 + 0.5 * sin(0.2*uTime);   //0.8 + 0.5*
       //blnd.r *= 1.5*uRed + 0.2 * sin(0.2*uTime); 
       blnd.g *= 0.5 + 0.4 * (sin(0.1*uTime)); // 2.0
       blnd.b *= 0.5 + 0.35 * (cos(0.3*uTime));
       return blnd;
     }


     // main uses march, color and blend
     void main() {
       // eye and fwd
       //vec3 eye = vec3(0.0, 0.0, 1.0);       // fov=pi/2 => z=1
       vec3 eye = cameraPosition;

       // map texture pixels to [-1,1]x[-1,1] near plane of fsh-eye fov=90
       vec3 fwd = normalize(vec3(2.0*vuv.s-1.0, 2.0*vuv.t-1.0,-1.0));

       // paint
       gl_FragColor = blend(colormarch(eye,fwd));
     }`
;


export {fsh:fsh,
        uniforms:uniforms};


