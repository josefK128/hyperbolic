// fragment shader
// raymarch - cube
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
   

     
     // distance - used by march
     float distance(vec3 p, vec3 v, vec3 b){
       vec3 p_v = p - v;
       return length(max(abs(p_v)-b, 0.0));
     }
     

     // march(eye, fwd) - uses distance 
     float march(vec3 eye, vec3 fwd){
         float t=0.0;
         float s = uFovscale;
         float sx = abs(uCam_up.y) * uAspect + (1.0 - abs(uCam_up.y));
         float sy = (1.0 - abs(uCam_up.y)) * uAspect + abs(uCam_up.y);
         float ssx = s/sx;
         float ssy = s/sy;

         for (int i=0; i<32; i++) {       // 32 iterations
             // screen uv point p
             vec3 p = eye + t*fwd;

             // object vertex obtained from scenegraph
             vec3 v = uVertex;

             // modify p by sg-camera viewMatrix = camera.matrixWorldInverse
             vec4 pp = vec4(p.xyz, 1.0) * viewMatrix;
             p = pp.xyz;

             // scale the rm-objects virtual geometry 
             // modify coords by uFovscale to match fov-zoom effect
             // modify width, depth by uAspect to compensate for screen
             // distortion due to non-uniform aspect ratio 
             vec3 b = vec3(ssx*0.1, ssy*0.1, s*0.1);

             // distance
             float d = distance(p, v, b);  
             t += d*0.5;
         }
         return t;
     }
     

     // color(march(), fwd)
     vec4 color(float d, vec3 fwd){
         float fog = 5.0/(d*d + 2.0);  // 1.0/
         return vec4(0.8*fog, 0.5*fog, 2.0*fog, 0.9);
     }


     // blend( color(march(),fwd) )
     vec4 blend(vec4 pixel){
       // blend - alpha + (1-alpha) - best for layering - poor for post!
       float alpha = 0.5 * pixel.a;
       vec4 blnd = (1.0-alpha)*texture2D(tDiffuse, vuv) + alpha*pixel;

       // color mix
       //blnd.r *= 1.2;
       blnd.r *= 2.0*uRed;
       blnd.g *= 1.8; // 2.0
       blnd.b *= 1.7;
       return blnd;
     }


     // main uses march, color and blend
     void main() {
       // eye and fwd
       vec3 eye = vec3(0.0, 0.0, 1.0);       // fov=pi/2 => z=1

       // map texture pixels to [-1,1]x[-1,1] near plane of fsh-eye fov=90
       vec3 fwd = normalize(vec3(2.0*vuv.s-1.0, 2.0*vuv.t-1.0,-1.0));

       // paint
       gl_FragColor = blend(color(march(eye,fwd), fwd));
     }`
;


export {fsh:fsh,
        uniforms:uniforms};


