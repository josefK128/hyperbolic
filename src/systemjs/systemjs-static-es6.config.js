System.config({
  transpiler: "typescript",
  typescriptOptions: {
    "target": "es6",
    "sourceMap": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "removeComments": false,
    "noImplicitAny": true,
    "suppressImplicitAnyIndexErrors": true
  },

  // for systemjs to correctly substitute for truncated paths
  map: {
    'app-es6' : './',
    '@angular': '../node_modules/@angular'
  },

  // for systemjs to correctly substitute for implied files and/or ts/js
  packages: {
    'app-es6'  : {main: 'narrative', defaultExtension: 'js'},
    'app-es6/models/scenes'  : {main: 'test', defaultExtension: 'ts'},
    '@angular/core'                    : {main: 'index.js'},
    '@angular/common'                  : {main: 'index.js'},
    '@angular/compiler'                : {main: 'index.js'},
    '@angular/router'                  : {main: 'index.js'},
    '@angular/platform-browser'        : {main: 'index.js'},
    '@angular/platform-browser-dynamic': {main: 'index.js'}
  }
});
