// narrative.ts 

//services
import {mediator} from './services/mediator';
import {transform3d} from './services/transform3d';

// shaders
import {vsh} from './models/space/quad_vsh/vsh_default.glsl';
import {fsh} from './models/space/quad_fsh/fsh_default.glsl';
import {uniforms} from './models/space/quad_fsh/fsh_default.glsl';



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
    e_cube:THREE.Mesh,
    h_geometry:THREE.BoxGeometry,
    h_material:THREE.Material,
    h_cube:THREE.Mesh,


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
      render();
    };



class Narrative {

  // ctor
  constructor(){
    narrative = this;
  } //ctor
 

  create_gui(){
  console.log(`narrative.create_gui()`);
    // set initial/reset values
    const PI:number = 3.141592654;
    var euclidean_c,
        hyperbolic_c,
        options = {
          camera: 'fov=90 at (0, .01, 10)';
          camera_dollyX: camera.position.x;
          camera_dollyY: camera.position.y;
          camera_dollyZ: camera.position.z;
          euclidean_cube: 'side=2 at (0, 1, -10)';
          euclidean: e_cube.visible;
          e_translateX: e_cube.position.x;
          e_translateY: e_cube.position.y;
          e_translateZ: e_cube.position.z;
          e_pitch: e_cube.rotation.x;
          e_yaw: e_cube.rotation.y;
          e_roll: e_cube.rotation.z;
          hyperbolic_cube: 'side=2 at (0, -1, -10)';
          hyperbolic: h_cube.visible
          h_translateX: 0.0;
          h_translateY: -1.0;
          h_translateZ: -10.0;
          h_pitch: h_cube.rotation.x;
          h_yaw: h_cube.rotation.y;
          h_roll: h_cube.rotation.z;
          reset: function() {
            console.log(`reset`);
//            camera.position.x = 0.0;
//            camera.position.y = 0.01;
//            camera.position.z = 10.0;
//            camera.lookAt(scene);  // origin
//            console.log(`pre: options['euclidean'] = ${options['euclidean']}`);
            e_cube.visible = true;
            options['euclidean'] = true;
//            console.log(`post: options['euclidean'] = ${options['euclidean']}`);
//            e_cube.position.x = 0.0;
//            e_cube.position.y = 1.0; 
//            e_cube.position.z = -10.0; 
            h_cube.visible = true;
            options['hyperbolic'] = true;
//            h_cube.position.x = 0.0;
//            h_cube.position.y = -1.0; 
//            h_cube.position.z = -10.0; 
          }
        };
    
    datgui.add(options, 'camera');
    datgui.add(options, 'camera_dollyX', -10,10);
    datgui.add(options, 'camera_dollyY', -10,10);
    datgui.add(options, 'camera_dollyZ', 5,50);
    datgui.add(options, 'euclidean_cube');
    euclidean_c = datgui.add(options, 'euclidean').listen();
    datgui.add(options, 'e_translateX', -10,10);
    datgui.add(options, 'e_translateY', -10,10);
    datgui.add(options, 'e_translateZ', -20,0);
    datgui.add(options, 'e_pitch', -PI,PI);
    datgui.add(options, 'e_yaw', -PI,PI);
    datgui.add(options, 'e_roll', -PI,PI);
    datgui.add(options, 'hyperbolic_cube');
    hyperbolic_c = datgui.add(options, 'hyperbolic').listen();
    datgui.add(options, 'h_translateX', -10,10);
    datgui.add(options, 'h_translateY', -10,10);
    datgui.add(options, 'h_translateZ', -20,0);
    datgui.add(options, 'h_pitch', -PI,PI);
    datgui.add(options, 'h_yaw', -PI,PI);
    datgui.add(options, 'h_roll', -PI,PI);
    datgui.add(options, 'reset');

    // changes
    euclidean_c.onChange((b) => {
      console.log(`euclidean_c received changed boolean b = ${b}`);
      e_cube.visible = b;
    });
    hyperbolic_c.onChange((b) => {
      console.log(`hyperbolic_c received changed boolean b = ${b}`);
      h_cube.visible = b;
    });
  }//create+gui
    
    
  bootstrap(injection:Object){
    mediator.logc(`\n\n*** narrative bootstrap`);

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

    // initialize camera 
    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.01, 1000 );
    camera.position.z = 10.0;
    camera.position.y = 0.01;
    //controls = new THREE.OrbitControls(camera);

    // initialize axes, ambient_light
    axes = new THREE.AxesHelper(1000.);
    scene.add(axes);
    ambient_light = new THREE.AmbientLight('#111111');
    ambient_light.position.y = 10.0;
    scene.add(ambient_light);

    // initialize e-cube 
    e_geometry = new THREE.BoxGeometry(2.0, 2.0, 2.0 );
    e_material = new THREE.MeshBasicMaterial({
           wireframe: false,
           color: 'red',            
           transparent: true,
           opacity:0.6,
           side:THREE.DoubleSide
    });
    e_cube = new THREE.Mesh( e_geometry, e_material );
    e_cube.blendSrc = THREE.SrcAlphaFactor; // default
    e_cube.blendDst = THREE.OneMinusSrcAlphaFactor; //default
    if(_euclidean){
      e_cube.visible = true;
    }else{
      e_cube.visible = false;
    }
    e_cube.position.y = 1.0;
    e_cube.position.z = -10.0;
    scene.add(e_cube );


    // initialize h-cube 
    h_geometry = new THREE.BoxGeometry(2.0, 2.0, 2.0 );
    h_material = new THREE.MeshBasicMaterial({
           wireframe: true,
           color: 'green',            
           transparent: true,
           opacity:0.8,
           side:THREE.DoubleSide
    });
    h_cube = new THREE.Mesh( h_geometry, h_material );
    h_cube.blendSrc = THREE.SrcAlphaFactor; // default
    h_cube.blendDst = THREE.OneMinusSrcAlphaFactor; //default
    h_cube = new THREE.Mesh( h_geometry, h_material );
    if(_hyperbolic){
      h_cube.visible = true;
    }else{
      h_cube.visible = false;
    }
    h_cube.position.y = -1.0;
    h_cube.position.z = -10.0;
    scene.add(h_cube );

    // if not started, start clock and begin rendering cycle
    if(animating){return;}
    animating = true;

    // create gui
    narrative.create_gui();

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

