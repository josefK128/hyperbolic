// Vertex shader program 
// e_vsh_etranslation_axes - default curvature=0 translations along axes
export var e_uniforms:Object = {
  utx: {type: 'f', value: 0.0},
  uty: {type: 'f', value: 0.0},
  utz: {type: 'f', value: 0.0},
  utime:{type: 'f', value: 0.0}
};


//mat4 T = projectionMatrix * viewMatrix * Tr; //world->camera and projection
// produces cubes in model coords around origin, and camera at origin =>
// viewMatrix is identity - overall effect is projection of model around
// origin onto the camera near-plane

export var e_vsh:string = `
  uniform float utx;
  uniform float uty;
  uniform float utz;
  uniform float utime;

  void main() {
    //vec3 t = vec3(-6.0,2.0,5.0);

    // express matrix in column-major order !!!!!!
    mat4 Tr = mat4(1,0,0,0, 0,1,0,0, 0,0,1,0, utx,uty,utz,1); //model->world
    //mat4 Tr = mat4(1,0,0,0, 0,1,0,0, 0,0,1,0, t.x,t.y,t.z,1); //model->world
    mat4 T = projectionMatrix * modelViewMatrix * Tr; //world->camera and projection
    gl_Position = T * vec4(position.xyz, 1.0);
  }
  `;

