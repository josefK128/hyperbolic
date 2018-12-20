// shadercube.ts
// requires options={vsh:vsh, fsh:fsh, uniforms:uniforms}!!

export var create = (options:Object={}) => {
  var cube_g:THREE.Geometry,
      cube_m:THREE.ShaderMaterial,
      cube:THREE.Mesh,
      // options
      vsh:String = options['vsh'],
      fsh:String = options['fsh'],
      uniforms:String = options['uniforms'];
      


  // diagnostics
  //console.log(`shadercube: vsh = ${vsh}`);
  //console.log(`shadercube: fsh = ${fsh}`);
  //console.log(`shadercube: uniforms = ${uniforms}`);


  return new Promise((resolve, reject) => {

    cube_g = new THREE.BoxBufferGeometry(2.0, 2.0, 2.0);
    cube_m = new THREE.ShaderMaterial({
           vertexShader:vsh,
           fragmentShader:fsh,
           uniforms:uniforms,
           transparent: true,
           side:THREE.DoubleSide
     });
     cube_m.blendSrc = THREE.SrcAlphaFactor; // default
     cube_m.blendDst = THREE.OneMinusSrcAlphaFactor; //default
     cube_m.depthTest = false;
     cube = new THREE.Mesh(cube_g, cube_m);
  
  
     // delta method for modifying properties
     cube['delta'] = (options:Object={}) => {
       cube_m.transparent = options['transparent'] || cube_m.transparent;
       cube_m.vertexShader = options['vsh'] || vsh;
       cube_m.fragmentShader = options['fsh'] || fsh;
       cube_m.uniforms = options['uniforms'] || uniforms;
     };
  
     // render method - not needed in this case
     //cube['render'] = (et:number=0, options:Object={}) => {}
  
     // return actor ready to be added to scene
     resolve(cube);

   });//return new Promise
 };
