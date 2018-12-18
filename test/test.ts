// test.ts 
// test of hyperbolic modules methods

//services
import {hyperbolic} from '../src/app/services/hyperbolic';


// singleton closure-instance variables
var test:Test,
    minkowski:THREE.Matrix4 = new THREE.Matrix4();


class Test {
  constructor() {
    test = this;
    minkowski.set(1,0,0,0,  
                  0,1,0,0,
                  0,0,1,0
                  0,0,0,-1);
  }


  // aT * minkowski * b - returns number
  // test vector a === (3,4,-1,1)
  // test vector b === (-6,7,2,1)
  // expect result === 7.0
  innerproduct(){
    var a = new THREE.Vector4(3,4,-1,1),
        b = new THREE.Vector4(-6,7,2,1),
        ipab = hyperbolic.innerproduct(a,b);

    if(Math.abs(ipab - 7.0) < .00001){
      return 'PASSES!!';
    }else{
      return 'FAILS!!';
    }
  }


  // u + v vector sum as inside - returns THREE.Vector4
  // test vector a === (-0.5, -0.5, 0, 1)
  // test vector b ===m (0.3, -0.7, 0, 1)
  // expect result === (-0.1, -0.733, 0, 1.212)
  midpoint(){
    var a = new THREE.Vector4(-0.5, -0.5, 0, 1),
        b = new THREE.Vector4(0.3, -0.7, 0, 1),
        mpab = hyperbolic.midpoint(a,b),
        result:boolean = true;

        if(Math.abs(mpab[0] - -0.1) > .00001){
          result = false;
        }
        if(Math.abs(mpab[1] - -0.733) > .00001){
          result = false;
        }
        if(Math.abs(mpab[2] - 0) > .00001){
          result = false;
        }
        if(Math.abs(mpab[3] - 1.212) > .00001){
          result = false;
        }

    if(result === true){
      return 'PASSES!!';
    }else{
      return 'FAILS!!';
    }
  }
 

  // I - (2*p*pT*minkowski / innerproduct(p,p)) - returns THREE.Matrix4
  // test point p === (0.5, 0, 0, 1)
  // expect result matrix === (1.666, 0, 0, -1.333,
  //                               0, 1, 0,      0,
  //                               0, 0, 1,      0,
  //                           1.333, 0, 0, -1.666)
  reflection_across(){
    var p = new THREE.Vector4(0.5,0,0,1),
        rpels = hyperbolic.reflection_across(p).elements,
        m = new THREE.Matrix4(),
        els = [],
        result:boolean = true;
        
        
        m.set(1.666,0,0,-1.333,
              0,1,0,0,
              0,0,1,0,
              1.333,0,0,-1.666);
        els = m.elements;

    console.log(`els = ${els}`);
    console.log(`rpels = ${rpels}`);
    for(let i=0; i<16; i++){
      if(Math.abs(rpels[i] - els[i]) > .00001){
        result = false;
        console.log(`coord ${i} fails!`);
      }else{
        //console.log(`coord ${i} passes!`);
      }
    }

    if(result === true){
      return 'PASSES!!';
    }else{
      return 'FAILS!!';
    }
  }


  // T(a,b) = refl_acr(midp(a,b)) * refl_acr(a) - returns THREE.Matrix4
  // test point a = (-0.5,-0.5,0,1) - b in Phillips-Gunn p3
  // test point b = (0.3,-0.7,0,1) - b-prime in Phillips/Gunn p4
  // hyperbolic midpoint(a,b) = (-0.1,-0.733,0,1.212)
  // expected hyptels (col-mjr) = [1.676,-1.369,0,1.919,   
  //                               0.814,0.636,0,0.257
  //                               0,0,1,0,
  //                               1.572,-1.13,0,2.179]
  translation_by_refl(){
    var a = new THREE.Vector4(-0.5,-0.5,0,1),
        b = new THREE.Vector4(0.3,-0.7,0,1),
        mpab = hyperbolic.midpoint(a,b),
        refl_acr_mpab = hyperbolic.reflection_across(mpab),
        refl_acr_b = hyperbolic.reflection_across(b),
        hypt:THREE.Matrix4 = refl_acr_mpab.multiply(refl_acr_b), 
        hyptels = hypt.elements,
        expected_hyptels = [1.676,-1.369,0,1.919,   
                            0.814,0.636,0,0.257
                            0,0,1,0,
                            1.572,-1.13,0,2.179],
        result:boolean = true;

    // midpoint(a,b)
    if(mpab.x - -0.1 > .00001){result = false;}
    if(mpab.y - -0.733 > .00001){result = false;}
    if(mpab.z - 0 > .00001){result = false;}
    if(mpab.w - 1.212 > .00001){result = false;}
    if(result){
      console.log(`hyperbolic.translation_by_refl midpoint caculation PASSES!!`);
    }else{
      console.log(`hyperbolic.translation_by_refl midpoint caculation FAILS!!`);
    }

    // hyperbolic translation_by_refl matrix elements hyptels
    for(let i=0; i<16; i++){
      if(hyptels[i] - expected_hyptels[i] > .00001){result = false;}
    }          

    if(result){
      return 'PASSES!!';
    }else{
      return 'FAILS!!');
    }
  }


  // existence of hyperbolic functions - some js Math modules lack them
  // in any case polyfills are supplied in hyperbolic.ts
  cosh_exists(){
    if(Math.cosh){
      console.log(`Math.cosh exists!`);
      console.log(`Math.cosh(0.5) = ${hyperbolic.cosh(0.5)}`);
    }else{
      console.log(`Math.cosh does NOT exist!`);
    }
  }
 
  // existence of hyperbolic functions - some js Math modules lack them
  // in any case polyfills are supplied in hyperbolic.ts
  sinh_exists(){
    if(Math.sinh){
      console.log(`Math.sinh exists!`);
      console.log(`Math.sinh(0.5) = ${hyperbolic.sinh(0.5)}`);
    }else{
      console.log(`Math.sinh does NOT exist!`);
    }
  }


  // NOTE: translation matrices are set in row-major order
  // NOTE: translation matrix.elements arrays are given in col-major order
  translationX(){
    var mtx = hyperbolic.translationX(0.5),
        mtxels = [1.1276259652063807,0,0,0.5210953054937474,0,1,0,0,0,0,1,0,0.5210953054937474,0,0,1.1276259652063807],   // expected
        origin:THREE.Vector4 = new THREE.Vector4(0,0,0,1),
        diag:THREE.Vector4 = new THREE.Vector4(1,1,1,1),
        start:THREE.Vector4 = new THREE.Vector4(0,-1,-20,1),
        tmx:THREE.Matrix4,
        result:boolean = true;

    //console.log(`translationX = ${mtx.elements}`);
    for(let i=0; i<16; i++){
      if(Math.abs(mtx.elements[i] - mtxels[i]) > 0.00001){result = false;}
    }

    // particular values
    tmx = hyperbolic.translationX(1.0);
    console.log(`cosh(1) = ${hyperbolic.cosh(1.0)}`);
    console.log(`sinh(1) = ${hyperbolic.sinh(1.0)}`);
    console.log(`trX(1) cols = ${tmx.elements}`);
    console.log(`origin -> ${(origin.applyMatrix4(tmx).toArray()}`);
    tmx = hyperbolic.translationX(2.0);
    console.log(`cosh(2) = ${hyperbolic.cosh(2.0)}`);
    console.log(`sinh(2) = ${hyperbolic.sinh(2.0)}`);
    console.log(`trX(2) cols = ${tmx.elements}`);
    console.log(`origin -> ${(origin.applyMatrix4(tmx).toArray()}`);
    tmx = hyperbolic.translationX(5.0);
    console.log(`cosh(5) = ${hyperbolic.cosh(5.0)}`);
    console.log(`sinh(5) = ${hyperbolic.sinh(5.0)}`);
    console.log(`trX(5) cols = ${tmx.elements}`);
    console.log(`origin -> ${(origin.applyMatrix4(tmx).toArray()}`);


    if(result){
      return 'PASSES!!';
    }else{
      return 'FAILS!!');
    }
  }

  // NOTE: translation matrices are set in row-major order
  // NOTE: translation matrix.elements arrays are given in col-major order
  translationY(){
    var mty = hyperbolic.translationY(0.5),
    mtyels = [1,0,0,0,0,1.1276259652063807,0,0.5210953054937474,0,0,1,0,0,0.5210953054937474,0,1.1276259652063807],  // expected
        result:boolean = true;

    //console.log(`translationY = ${mty.elements}`);
    for(let i=0; i<16; i++){
      if(Math.abs(mty.elements[i] - mtyels[i]) > 0.00001){result = false;}
    }
    if(result){
      return 'PASSES!!';
    }else{
      return 'FAILS!!');
    }
  }

  // NOTE: translation matrices are set in row-major order
  // NOTE: translation matrix.elements arrays are given in col-major order
  translationZ(){
    var mtz = hyperbolic.translationZ(0.5),
    mtzels = [1,0,0,0,0,1,0,0,0,0,1.1276259652063807,0.5210953054937474,0,0,0.5210953054937474,1.1276259652063807],  // expected
        result:boolean = true;

    //console.log(`translationZ = ${mtz.elements}`);
    for(let i=0; i<16; i++){
      if(Math.abs(mtz.elements[i] - mtzels[i]) > 0.00001){result = false;}
    }
    if(result){
      return 'PASSES!!';
    }else{
      return 'FAILS!!');
    }
  }
}


// enforce singleton export
if(test === undefined){
  test = new Test();
}
export {test};







