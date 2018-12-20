// Vertex shader program 
// vsh_default
export var uniforms_default:Object = {
  utime:{type: 'f', value: 0.0}
};


// gl_Position = projectionMatrix * viewMatrix * vec4(position.xyz, 1.0);
// produces cubes in model coords around origin, and camera at origin =>
// viewMatrix is identity - overall effect is projection of model around
// origin onto the camera near-plane

export var vsh_default:string = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
  }
  `;

