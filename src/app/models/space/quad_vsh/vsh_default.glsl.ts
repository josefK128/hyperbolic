// Vertex shader program 
// vsh_default - texture map
export var vsh:string = `
      varying vec2 vuv;
      void main() {
        gl_Position = vec4(position.xy, 1.0, 1.0);
        vuv = uv;
      }
      `;

