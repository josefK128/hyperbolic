// fragment shader
// raymarch - expt2-infinite cubes/toruses - adapted from Roast
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
 
#define RAY_DEPTH 128
#define MAX_DEPTH 100.0
#define DISTANCE_MIN 0.01
  
const vec3 CamPos = vec3(0,0,1);  //vec3(5,10.0,6.0);
const vec3 CamLook = vec3(0,0,-1); // vec3(0,0,0)
const vec3 LightDir1 = vec3(.7,1,-1.0);
const vec3 LightColour1 = vec3(1.2,1.05,1);
const vec3 LightDir2 = vec3(0,0,1);
const vec3 LightColour2 = vec3(.78,.6,.6); //vec3(.38,.4,.6);
const float LightSpecular = 64.0;
const float LightSpecularHardness = 256.0;
const vec3 Diffuse = vec3(0.85);
const float AmbientFactor = 0.05;
const float NoiseSize = 128.0;
const float NoiseRoughness = 0.5;



vec3 RotateY(vec3 p, float a) {
	float c,s;
	vec3 q=p;
	c = cos(a);
	s = sin(a);
	p.x = c * q.x - s * q.z;
	p.z = s * q.x + c * q.z;
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

float cone(vec3 p, vec2 t) {
   vec2 c = normalize(t);
   float q = length(p.xz);
   return dot(t, vec2(q, p.z));
}



float Replicate(vec3 p, vec3 c) {
   vec3 q = mod(p,c) - 0.5 * c;
   //float distBox = RoundBox(q, vec3(0.5,0.5,0.5), 0.15);
   float distTorus = Torus(q, vec2(0.75,0.4+(sin(uTime/2.0))*0.25));
   //return smax(distBox, distTorus, 3.0);  //0.2
   //return Torus(q, vec2(1,0.4));
   //return smax(0.2*distBox, distTorus, 0.3);  //0.2
   return smax(0.05*cone(q, vec2(1,5)), 1.6*distTorus, 0.9);  //0.9  
}

// This should return continuous positive values when outside and negative values inside,
// which roughly indicate the distance of the nearest surface.
float Dist(vec3 pos) {
   pos = RotateY(pos, 0.01*uTime);
   pos.x += uVertex.x;
   pos.y += uVertex.y;
   pos.z += uVertex.z;
   return Replicate(pos, vec3(5));// + Noise(pos*NoiseSize)*NoiseRoughness/NoiseSize;
}

float CalcAO(vec3 p, vec3 n) {
	float r = 0.0;
	float w = 1.0;
	for (float i=1.0; i<=5.0; i++)
	{
		float d0 = (i / 5.0) * 1.25;
		r += w * (d0 - Dist(p + n*d0));
		w *= 0.5;
	}
	float ao = 1.0 - clamp(r,0.0,1.0);
	return ao;
}

vec3 GetNormal(vec3 pos) {
   const vec2 delta = vec2(0.01, 0);
   
   vec3 n;
   n.x = Dist( pos.xyz + delta.xyy ) - Dist( pos.xyz - delta.xyy );
   n.y = Dist( pos.xyz + delta.yxy ) - Dist( pos.xyz - delta.yxy );
   n.z = Dist( pos.xyz + delta.yyx ) - Dist( pos.xyz - delta.yyx );
   
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
vec3 Sky(vec3 rd) {
	float sunAmount = max(dot(rd, sunLight), 0.0);
	float v = pow(1.0 - max(rd.y,0.0),6.);
	vec3  sky = mix(vec3(.1, .2, .3), vec3(.32, .32, .32), v);
	sky = sky + sunColour * sunAmount * sunAmount * .25;
	sky = sky + sunColour * min(pow(sunAmount, 800.0)*1.5, .3);
	
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


