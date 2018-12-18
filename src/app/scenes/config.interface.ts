// Config.interface.ts

interface Config {
  // bootstrapped controller
  _narrative:string;

  // loaded by cloud ONLY - rest of animation uses GSAP at url _tweenmax
  _tween:string;
  _tweenmax:string;

  //webVR?
  webvr:boolean;
  vive:boolean;
  webvr_skybox:boolean;
  webvr_skycube:boolean;
  webvr_skycube_faces:boolean;
  webvr_skydome:boolean;
  webvr_radius:number;
  webvr_cube_urls:string[]; 

  // keymap
  _map:string;

  // camera controls
  _controls:string;
  controlOptions:Object;

  canvas_id:string;
  clearColor:string;
  alpha:number;
  antialias:boolean;

  test: boolean;
  _testTarget:string;

  server_host:string;
  server_port:number;
  server_connect:boolean;
  record_actions:boolean;
  record_shots:boolean;
  log:boolean;
  channels:string[];

  // textures
  preload_textures:Object;

  // initial_camera
  initial_camera:Object;
};


export {Config:Config};

