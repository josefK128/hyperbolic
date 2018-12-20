// Vertex shader program 
// h_vsh_translation_axes - curvature <0 translations along axes
export var h_uniforms:Object = {
  utx: {type: 'f', value: 0.0},
  uty: {type: 'f', value: 0.0},
  utz: {type: 'f', value: 0.0},
  utime:{type: 'f', value: 0.0},
};


export var h_vsh:string = `
  uniform float utx;
  uniform float uty;
  uniform float utz;
  uniform float utime;

  function cosh(t){
    (exp(t) + exp(-t)) * 0.5;
  }

  function sinh(t){
    (exp(t) - exp(-t)) * 0.5;
  }


  void main() {
    mat4 Tx = mat4(cosh(utx),0,0,sinh(utx), 0,1,0,0, 0,0,1,0, sinh(utx),0,0,cosh(utx)];
    mat4 Ty = mat4(1,0,0,0, 0,cosh(uty),0,sinh(uty), 0,0,1,0, 0,sinh(uty),0,cosh(uty)];
    mat4 Tz = mat4(1,0,0,0, 0,1,0,0, 0,0,cosh(utz),sinh(utz), 0,0,sinh(utz),cosh(utz)];
    mat4 Tr = Tz * Ty * Tx;
    mat4 T =  projectionMatrix * modelViewMatrix * Tr;
    gl_Position = T * vec4(position.xyz, 1.0);
  }
  `;

