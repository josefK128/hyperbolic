// scene module template - all modifiable properties 
// 
// [1] config is used once for initialization
// [2] substates are dynamic/variable - for initialization AND subsequent use
//
//
// the inclusion of a substate object (camera, stage, cloud, space, action)
// implies that a change of substate properti(es) is requested.
// there are two cases for substates or substate-property change:
// Let p be a substate or substate-property:
// state entries have the form:  p:{_p:boolean; ...} 
//   _p true => create new p using properties listed (previous p deleted first)
//   _p false => set p to null/empty to remove (ignore prperties listed, if any)
//   _p undefined => modify the properties listed (no effect on non-existent p)
// NOTE: in the special case of substate 'action': 
//   _action:true => set queue.fifo = actions
//   _action:false => set queue.fifo = []
//   _action undefined => append actions to queue.fifo
// NOTE: substate camera only modifies properties

// all substate property objects are optional so a non-trivial state change
// could consist of as few as one substate - for example:
// delta0 = {
//   action: {states: [{},...]}   // exec an action(s)
// }
// delta0 = {
//   stage: {cube: {}}  // replace original cube (or no cube) with new cube
// }
//
// NOTE: stateChange action has form:
// { o:'narrative',
//   f:'changeState',
//   o: {stage: {cube:{}},   // delta0 state
//   ms: 0}                  // immediate


// import scene.interface - enforces required properties 
import {Config} from '../config.interface';


// CONFIG
// for initialization
const config:Config = {
    // libs
    // RECALL base-href=/src so need .. prefix for node_modules
    // used in cloud - otherwise GSAP TweenMax is used (given url below)
    _tween: '../node_modules/tween.js/src/Tween.js',
    _tweenmax: '../node_modules/gsap/TweenMax.js',
  
    // root component url 
    _narrative: './app/narrative',
 
    // webVR?
    webvr:false,
    vive:false,
    webvr_skycube:false,
    webvr_radius:10000,
    webvr_cloud: false,

    // camera3d keyboard map (depends on webVR, Leap, ...) 
    // _map is name of models/camera/keymap file
    _map: './app/models/camera/keymaps/vr',

    // camera controls - _controls url or false
    _controls:'./app/models/camera/controls/controls-onehand',
    controlsOptions:{translationSpeed:2.0, //10
                    rotationSpeed: 20, //4.0,  // 1.0
                    transSmoothing:0.0025, 
                    rotationSmooting:0.001, 
                    translationDecay:0.1, //0.3 
                    scaleDecay:0.5, 
                    rotationSlerp:0.4,  //0.8, 
                    pinchThreshold:0.1   //0.5
    },

 
    // canvas
    canvas_id: 'i3d',
    clearColor:'black',
    alpha:1.0,
    antialias:false,
  
    // mock testTarget
    test: false,
    _testTarget: '../e2e/mocks/testTarget.ts',
    
    // communications
    server_host: 'localhost',
    server_port: 8081,   // channels
    server_connect: false,
    record_actions: false,
    record_shots: false,
    log: false,
    channels: [],  // log is not required if use mediator.log(s)

    // for textures service
    preload_textures: {},

    // for camera initialization
    // csphere, lens and hud are *required
    // key, fill and back lights are optional - can be {} or even undefined
    // NOTE: csphere radius is constant 1.0 !
    initial_camera: {
      csphere:{
        visible:true,
        wireframe:false,
        opacity:0.5,
        color:'blue',
      },//csphere
      lens: {
        fov:90,
        controls:false
      },//lens
      hud: {
        _post: false,
        _hud_rendered:true,
        opacity: 0.5,
        scaleX:1.05,
        scaleY:0.995
      },//hud
      key: {
        color: 'orange', 
        intensity: 2.5,
        distance: 0.0,  // 0 => infinite range of light
        position: [1.0,0.4,0.4]
      },//key
      fill: { 
        color: 'blue', 
        intensity: 0.8,
        distance: 0.0,  // 0 => infinite range of light
        position: [-1.0,-0.2, 0.0]
      },//fill
      back: {
        color: 'grey', 
        intensity: 2.5,
        distance: 0.0,  // 0 => infinite range of light
        position: [-0.8,-0.2,-1.0]
      }//back
    }
};



// STATE
// for initialization AND subsequent changeState actions 
const state = {
  // camera
  camera:{
    hud:{
      fsh:'./app/models/camera/hud_fsh/fsh_post.glsl',
      // texture requires post:f or replaced in render by postTarget.texture
      texture: './assets/images/moon_256.png'
    }
  },

  // stage - default stage is empty. 
  // _stage = t/f/undefined
  stage:{
    frame:{
      _stats: true,    // fps monitor - hide/show
    },
    actors: {
      unitcube: { 
        url:'./app/models/stage/actors/unitcube',
        _actor:true,
        options:{wireframe:true, 
              color:'black', 
              opacity:0.5, 
              transform:{t:[0.0,0.0,0.0001], s:[1.0,1.0,1.0]}
        } 
      }
    }
  },

  // vrstage - default stage is empty. 
  // environment: _axes,_ambient_l,_fog t/f/undefined => create/remove/modify
  // _actors = t/f/undefined => create/remove/modify
  vrstage:{
    environment:{
      axes:{
        _axes: true  // create/remove reference coord axes - default null
      }
//      ambient_light:{
//        _ambient_light: true,   // t/f/undefined => create/remove/modify 
//        intensity: 1.0,         // defaults if ambient_light exists
//        color: 'white'
//      }
//      fog:{
//        _fog: true,      // t/f/undefined => create/remove/modify  
//        color: 'white',  // defaults if fog exists
//        near: 300.0,
//        far: 20000.0
//      }
    },
    actors:{
      pointcloud:{
        _actor:true,
        url:'./app/models/stage/actors/pointcloud-lines',
        options: {
          showDots: true,  // no effect ?!
          showLines: true,     // no effect ?!
          minDistance: 256, //90,  //150,    // *
          limitConnections: false, //false, // *
          maxConnections: 20,  //20,  // *
          particleCount: 512,   // 500 // no effect ?!
          transform:{t:[0.0,0.0,-800.0001], s[2.0,12.0, 2.0]}    // -300 
        }
      }
    }
  },


  // cloud - spritecloud/pointcloud - default none
  // _cloud = t/f/undefined
  // radiusScalar scales cphere_radius to produce cloud_radius (default 1.0)
  // range is generally [0.5, 5.0] but all positive values are 'allowed'
  cloud:{
    _cloud:true,
    N: 4,
    urls: ["./assets/images/sprite_redlight.png",
         "./assets/images/moon_256.png" ,
         "./assets/images/lotus_64.png" ,
         //"./assets/images/glad.png" ,
         "./assets/images/sprites/ball.png" ],
    options:{
      fog:false,
      lights:false,
      transparent:true,  // must be true to allow opacity<1.0
      opacity:1.0
      //period:?       // TBD
    },
    particles: 128,  // 128,  // 256
    // positions.length = particles * morphTargets.length * 3 
    morphtargets: ['cube','sphere1','plane','sphere2','helix1','helix2','helix3','sphere3','sphere4'],
    positions: [], 
    cloudRadius: 1000,  //900,  //800 //1000
    translateZ:-1000,
    duration: 20000
  },

  // audio - music and sound
//  audio:{
//    _audio:true,  // create
//    url: './assets/audio/music/test.wav',
//    actor:'rm_point',
//    refDistance:500,
//    maxDistance:1000,
//    playbackRate: 1.0,  //default 1.0
//    delay:2.0,
//    volume: 1.0,
//    loop:false
//  },


  space:{
    _raymarch: true,
    fsh:'./app/models/space/quad_fsh/fsh_rm_mengersponge-nav.glsl' 
  },

  // action - default fifo=[] in queue
  // _action = t/f/undefined
  // dt/et are in decimal seconds!!!
  action:{
    _action: true,
    _deltaTime:false,
    actions:[
    {
      t: 'animation',
      f:'perform',
      et:10,
      o:{timeline:{ 
           p:{immediateRender:false},
           actors:{ 'uniform~quad~uRed': [ 
             {dur:10, 
              p:{value:1.0, 
                 immediateRender:false,
                 repeat:-1,
                 yoyo:true,
                }
             }]//tweens,
           }//actors
        }//timeline
      }//o
      },
  }//action
};


export {config:config, state:state};
