// Fragment shader program 
export var uniforms:Object = {
  tDiffuse: {type: 't', value: null},
  uTime:{type: 'f', value: 0.0},
  uResolution:{type: 'v2', value: new THREE.Vector2(960,1080)}
};

export var fsh:string = `
      #ifdef GL_ES
      precision mediump float;
      #endif
      uniform sampler2D tDiffuse; 
      uniform float uTime; 
      varying vec2 vuv;

      void main() {
        // paint
        gl_FragColor = texture2D(tDiffuse, vuv); 
      }`;


