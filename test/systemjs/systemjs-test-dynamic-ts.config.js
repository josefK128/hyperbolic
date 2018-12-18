System.config({
  transpiler: "typescript",
  typescriptOptions: {
    "sourceMap": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "removeComments": false,
    "noImplicitAny": true,
    "suppressImplicitAnyIndexErrors": true
  },

  // for systemjs to correctly substitute for truncated paths
  map: {
    'app' : './',
    '@angular' : '../node_modules/@angular'
    'typescript' : '../node_modules/typescript/lib/typescript.js'
  },

  // for systemjs to correctly substitute for implied files and/or ts/js
  packages: {
    'app'  : {main: 'narrative.spec.ts', defaultExtension: 'ts'},
    'app/models/scenes'  : {main: 'test', defaultExtension: 'ts'},
    '@angular/core'                    : {main: 'index.js'},
    '@angular/common'                  : {main: 'index.js'},
    '@angular/compiler'                : {main: 'index.js'},
    '@angular/router'                  : {main: 'index.js'},
    '@angular/platform-browser'        : {main: 'index.js'},
    '@angular/platform-browser-dynamic': {main: 'index.js'}
  }
});
