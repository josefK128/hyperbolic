// narrative.ts 

//services
import {mediator} from './services/mediator';
import {transform3d} from './services/transform3d';
import {hyperbolic} from './services/hyperbolic';

// actors
import {create as shadercube_create} from './models/stage/actors/shadercube';


// shaders - simple default
import {vsh_default} from './models/space/default/vsh_default.glsl';
import {fsh_default} from './models/space/default/fsh_default.glsl';
import {uniforms_default} from './models/space/default/vsh_default.glsl';

// shaders - euclidean and hyperbolic translations on x,y,z axes
import {e_vsh} from './models/space/euclidean/e_vsh_translation_axes.glsl';
import {e_fsh} from './models/space/euclidean/e_fsh_red.glsl';
import {e_uniforms} from './models/space/euclidean/e_vsh_translation_axes.glsl';
import {h_vsh} from './models/space/hyperbolic/h_vsh_translation_axes.glsl';
import {h_fsh} from './models/space/hyperbolic/h_fsh_green.glsl';
import {h_uniforms} from './models/space/hyperbolic/h_vsh_translation_axes.glsl';


// singleton closure-instance variables
var narrative:Narrative,
    state:any,
    stats:any,
    datgui:any,
    TWEEN:any,
    TweenMax:any,


    // resize
    width:number = window.innerWidth,
    height:number = window.innerHeight,

    // needed in animate-render-loop
    _stats:boolean = true,
    _webvr:boolean = false,
    _vive:boolean = false,
    _euclidean:boolean = true,
    _hyperbolic:boolean = true,
    animating:boolean = false,

    // start time (first nar.changeState()) and elapsed time from start
    // animating is flag indicating whether animation has begun (t) or not (f)
    clock = new THREE.Clock(),
    _deltaTime:boolean = true,
    //dt:number = 0,  // deltaTime from clock  
    et:number = 0,  // elapsedTime from clock  
    t0:number = 0,  // deltaTime/elapsedTime from clock <=> _deltaTime = t/f  
    at:number = 0,  // deltaTime/elapsedTime in action msg <=> _deltaTime = t/f 
    animating:boolean = false,
    frame:number = 0,  // frame counter


    // renderer
    canvas:any,
    scene:THREE.Scene,
    renderer:THREE.WebGLRenderer,
    clearColor:number = 0xffffff,
    alpha:number = 0.0,  // opaque so see clearColor white
    antialias:boolean = false,

    // camera
    camera:THREE.PerspectiveCamera,
    //controls:THREE.OrbitControls,

    // actors
    axes:THREE.AxesHelper,
    ambient_light:THREE.AmbientLight,
    e_geometry:THREE.BoxGeometry,
    e_material:THREE.Material,
    e_options:Object,
    e_cube:THREE.Mesh,
    h_geometry:THREE.BoxGeometry,
    h_material:THREE.Material,
    h_cube:THREE.Mesh,
    h_options:Object,
    h_cube_orig:THREE.Mesh,

    // translation.xyz via dat.gui
    // euclidean
    etx:number = 0.0,
    ety:number = 0.0,
    etz:number = 0.0,
    // hyperbolic
    htx:number = 0.0,
    hty:number = 0.0,
    htz:number = 0.0,


    onWindowResize:any = () => {
      var aspect;
      width = window.innerWidth;
      height = window.innerHeight;
      aspect = width/height;
      canvas.width = width;
      canvas.height = height;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);

      // resolution
      quad.material.uniforms.uResolution.value = new THREE.Vector2(width,height);
      quad.material.uniforms.uResolution.needsUpdate = true;

      //hud.scale.set(aspect, 1.0, 1.0);     // one-half width, height
      hud.scale.set(2.0*aspect, 2.0, 1.0);  // full-screen
      //mediator.log(`canvas w=${canvas.width} h=${canvas.height}`);
    },   
    

    render = () => {
        // ellapsedTime in seconds - used in simulations
        et = clock.getElapsedTime();

        // write e_cube shader uniforms utx, uty, utz, utime
        e_cube.material.uniforms.utx.value = etx;
        e_cube.material.uniforms.utx.needsUpdate = true;
        e_cube.material.uniforms.uty.value = ety;
        e_cube.material.uniforms.uty.needsUpdate = true;
        e_cube.material.uniforms.utz.value = etz;
        e_cube.material.uniforms.utz.needsUpdate = true;
        e_cube.material.uniforms.utime.value = et;
        e_cube.material.uniforms.utime.needsUpdate = true;

        // write h_cube shader uniforms utx, uty, utz, utime
        h_cube.material.uniforms.utx.value = htx;
        h_cube.material.uniforms.utx.needsUpdate = true;
        h_cube.material.uniforms.uty.value = hty;
        h_cube.material.uniforms.uty.needsUpdate = true;
        h_cube.material.uniforms.utz.value = htz;
        h_cube.material.uniforms.utz.needsUpdate = true;
        h_cube.material.uniforms.utime.value = et;
        h_cube.material.uniforms.utime.needsUpdate = true;


        // actors
        for(let actor in narrative.actors){
          let _actor = narrative.actors[actor];
          if(_actor['render']){
            //console.log(`${actor} is rendering`);
            _actor['render'](et);
          }
        }
  
        // @@@@render scene 
        renderer.render(scene, camera);

        // report
        //if(frame++ % 600 === 0){
        //  console.log(`frame ${frame}`);
        //}
    },//render()


    animate = () => {
      // loop
      requestAnimationFrame( animate );
      
      // delta-t - accumulate
      // _deltaTime = f => dt is ellapsed time
      // _deltaTime = t => dt is reset to 0 after every action exec
      // NOTE: et = clock.getEllapsedTime() not used - except temporarily in 
      //   render for camera animation simulation
      t0 += clock.getDelta();

      // OrbitControls
      //controls.update();

      if(_stats){
        stats.update();
        }

        // delay render start to ensure e_cube and h_cube are created  
      setTimeout(() => {
        render();
      },1000);
    };



class Narrative {

  // ctor
  constructor(){
    narrative = this;
  } //ctor
 

  create_gui(){
    console.log(`narrative.create_gui()`);

    // do NOT propogate mouse events outside datgui
    //datgui.domElement.parentNode.setAttribute('style', 'pointer-events:none'); 
    // set initial/reset values
    const PI:number = 3.141592654;
    var euclidean_c,
        hyperbolic_c,
        x_c,
        y_c,
        z_c,
        x:number = 0.0,
        y:number = 0.0,
        z:number = 0.0,
        sinh = hyperbolic.sinh,
        cosh = hyperbolic.cosh,
        options = {
          camera: 'fov=90 at (0, .01, 10)';
          euclidean_cube: 'side=2 at (0, 1, 0) red';
          hyperbolic_cube: 'side=2 at (0, -1, 0) green';
          euclidean: e_cube.visible;
          hyperbolic: h_cube.visible
          positionX: 0.0;
          positionY: 0.0;
          positionZ: 0.0;
          reset_to_initial: function() {
            console.log(`reset`);
            etx = 0.0;
            ety = 0.0;
            etz = 0.0;
            htx = 0.0;
            hty = 0.0;
            htz = 0.0;
            options['positionX'] = 0.0;
            options['positionY'] = 0.0;
            options['positionZ'] = 0.0;
            e_cube.position.set(0, 1, 0);
            e_cube.visible = true;
            options['euclidean'] = true;
            h_cube.position.set(0, -1, 0);
            h_cube.visible = true;
            options['hyperbolic'] = true;
          }
        };
    
    datgui.add(options, 'camera');
    datgui.add(options, 'euclidean_cube');
    euclidean_c = datgui.add(options, 'euclidean').listen();
    datgui.add(options, 'hyperbolic_cube');
    hyperbolic_c = datgui.add(options, 'hyperbolic').listen();
    x_c = datgui.add(options, 'positionX', -20,20).listen();
    y_c = datgui.add(options, 'positionY', -20,20).listen();
    z_c = datgui.add(options, 'positionZ', -100,5).listen();
    datgui.add(options, 'reset_to_initial');

    // changes
    euclidean_c.onChange((b) => {
      console.log(`euclidean_c received changed boolean b = ${b}`);
      e_cube.visible = b;
    });
    hyperbolic_c.onChange((b) => {
      console.log(`hyperbolic_c received changed boolean b = ${b}`);
      h_cube.visible = b;
    });
    
    x_c.onChange((v) => {
      x = v;
      etx = v;
      htx = v;
      
      // Euclidean matrix4
      //let mt = (new THREE.Matrix4()).makeTranslation(x,y,z);
      //let mt = (new THREE.Matrix4()).makeTranslation(htx,hty,htz);
      //let p = new THREE.Vector4(0,0,0,1);
      //p.applyMatrix4(mt);
      //e_cube.position.set(p.x, p.y+1.0, p.z);
      //h_cube.position.set(p.x, p.y-1.0, p.z);
    });
    
    y_c.onChange((v) => {
      y = v;
      ety = v;
      hty = v;

      // Euclidean matrix4
//      let mt = (new THREE.Matrix4()).makeTranslation(x,y,z);
//      let mt = (new THREE.Matrix4()).makeTranslation(htx,hty,htz);
//      let p = new THREE.Vector4(0,0,0,1);
//      p.applyMatrix4(mt);
//      e_cube.position.set(p.x, p.y+1.0, p.z);
//      h_cube.position.set(p.x, p.y-1.0, p.z);
    });

    z_c.onChange((v) => {
      z = v;
      etz = v;
      htz = v;

      // Euclidean matrix4
//      //let mt = (new THREE.Matrix4()).makeTranslation(x,y,z);
//      let mt = (new THREE.Matrix4()).makeTranslation(htx,hty,htz);
//      let p = new THREE.Vector4(0,0,0,1);
//      p.applyMatrix4(mt);
//      //e_cube.position.set(p.x, p.y+1.0, p.z);
//      h_cube.position.set(p.x, p.y-1.0, p.z);
    });

  }//create_gui
   
    
  bootstrap(injection:Object){
    mediator.logc(`\n\n*** narrative bootstrap`);

    // diagnostic
//    console.log(`shadercube_create = ${shadercube_create}`);
//    console.log(`vsh_default = ${vsh_default}`);
//    console.log(`fsh_default = ${fsh_default}`);
//    console.log(`uniforms_default = ${uniforms_default}`);
//    console.log(`e_vsh = ${e_vsh}`);
//    console.log(`e_fsh = ${e_fsh}`);
//    console.log(`e_uniforms = ${e_uniforms}`);
//    console.log(`h_vsh = ${h_vsh}`);
//    console.log(`h_fsh = ${h_fsh}`);
//    console.log(`h_uniforms = ${h_uniforms}`);


    _webvr = config.webvr;
    _vive = config.vive;
    console.log(`*** injection is ${injection}:`);
    console.dir(injection);
    state = injection['state'];
    stats = injection['stats'];
    datgui = injection['datgui'];
    TWEEN = injection['TWEEN'];
    TweenMax = injection['TweenMax'];

    if(config.test){
      console.log(`config.test is true - no e2e test in hyperbolic!`);
    }else{
      narrative.initialize();
    }
  }//bootstrap



  initialize(){
    mediator.logc(`*** narrative.initialize()`);

    // stats - create and append stats to body but initially hide
    document.body.appendChild(stats.dom);
    stats.dom.style.display = 'block';

    // bg - clearColor
    clearColor = config['clearColor'] || clearColor;
    alpha = config['alpha'] || alpha;
    antialias = config['antialias'] || antialias;

    // scene - written to sgTarget, rm_scene - written to output
    // sgTarget is the result renderer.render(scene, camera, sgTarget)
    // which renders the three.js scenegraph to a WebGLRenderTarget sent
    // to the space fragmentshader as sgTarget.texture uniform 'tDiffuse'
    scene = new THREE.Scene();

    // renderer
    canvas = document.getElementById(config['canvas_id']);
    renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:antialias, alpha:true});
    renderer.setClearColor(clearColor, alpha);
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    //renderer.autoClear = false; // To allow render overlay on top of sprited sphere

    // webvr
    // disable vr for sgTarget and postTarget passes - set true in render
    renderer.vr.enabled = false; 

    // initialize axes, ambient_light
    axes = new THREE.AxesHelper(5000);
    axes.position.set(0,0,0);
    scene.add(axes);
    ambient_light = new THREE.AmbientLight('#111111');
    ambient_light.position.y = 10.0;
    scene.add(ambient_light);

    // initialize camera 
    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.01, 1000 );
    camera.position.x = 0.0;
    camera.position.y = 0.01;
    camera.position.z = 10.0;
    camera.lookAt(0,0,0);
    //controls = new THREE.OrbitControls(camera);
    //controls.target.set(htx, hty, htz);


    // initialize e-cube, h_cube, dat.gui 
    // e_cube tmp uses default shaders
    // h_cube tmp uses default shaders
    e_options = {
      fsh:e_fsh,
      vsh:e_vsh,
      uniforms:e_uniforms
    }
    shadercube_create(e_options).then((cube) => {
      e_cube = cube;
      e_cube.position.y = 1.0;
      e_cube.position.z = 0.0;
      scene.add(e_cube );
      console.log(`e_cube = ${e_cube}`);
      console.log(`e_cube.g.p.width = ${e_cube.geometry.parameters.width}`);
      console.log(`e_cube.position = ${e_cube.position.toArray()}`);

      // h_cube tmp uses default shaders
      h_options = {
      //fsh:fsh_default,
      //vsh:vsh_default,
      //uniforms:uniforms_default
        fsh:h_fsh,
        vsh:h_vsh,
        uniforms:h_uniforms
      }
      shadercube_create(h_options).then((cube) => {
        h_cube = cube;
        h_cube.position.y = -1.0;
        h_cube.position.z = 0.0;
        scene.add(h_cube );
        console.log(`h_cube = ${h_cube}`);
        console.log(`h_cube.g.p.width = ${h_cube.geometry.parameters.width}`);
        console.log(`h_cube.position = ${h_cube.position.toArray()}`);

        // create gui
        narrative.create_gui();
      }
    }


    // if not started, start clock and begin rendering cycle
    if(animating){return;}
    animating = true;

    // gsap
    //TweenMax.ticker.addEventListener('tick', animate);
    //console.log(`** starting TweenMax`);

    clock.start();
    console.log(`** starting clock`);

    // start render-cycle
    animate();

  }//initialize()

}//class Narrative



// enforce singleton export
if(narrative === undefined){
  narrative = new Narrative();
}
export {narrative};

