// hyperbolic.ts - operations in hyperbolic space
/*
 * NOTE: all THREE.Vector4 'a' are considered to be column vectors
 * Thus aT (transpose) is a row vector
 *
 * NOTE: m = THREE.Matrix4 is 'm.set' in row-major order
 * internally m is stored in column-major order,
 * and m.elements returns elements in column-major order
 * i.e
 * var m = new Matrix4();
 * m.set( 11, 12, 13, 14,    // row-major (row,col)
 *        21, 22, 23, 24,
 *        31, 32, 33, 34,
 *        41, 42, 43, 44 );
 * m.elements = [ 11, 21, 31, 41,  // column-major (row,col)
 *                12, 22, 32, 42,
 *                13, 23, 33, 43,
 *                14, 24, 34, 44 ];
 */

/*
 * translations along principal axes are represented by
 *  	
 * T	s
 * sT	cosh(d)
 *  
 * where s is all zeros except for element, i, which is equal to sinh(d); 
 * T is the identity matrix except that cell (i, i) is equal to cosh(d).
 * 
 * It is possible to generate any rotation matrix by an appropriate sequence 
 * of translations. For example, if cosh(d) is the golden number 
 * This magical number, d = 1.06127506190504…, is the edge length of the 
 * Schläfli {5, 4} tessellation. then translating d five times along 
 * (in order) +x, +y, –x, –y, and +x is equivalent to rotating 90° 
 * in the xy plane.
 * 
 * For any rigid transformation matrix, the final row and column are 
 * always normalized points (that is, they selfdot to 1) and the other 
 * rows and columns are always normalized planes (that is, they selfdot to –1).
 */

// closure var
var hyperbolic:Hyperbolic,
    minkowski:THREE.Matrix4 = new THREE.Matrix4();



class Hyperbolic {

  constructor() {
    hyperbolic = this;
    minkowski.set(1,0,0,0,  
                  0,1,0,0,
                  0,0,1,0
                  0,0,0,-1);
  }


  // aT * minkowski * b - returns number
  innerproduct(a:THREE.Vector4, b:THREE.Vector4){
    b.applyMatrix4(minkowski);
    return a.dot(b);  // returns number
  }


  // u + v vector sum as inside - returns THREE.Vector4
  midpoint(a:THREE.Vector4, b:THREE.Vector4){
    var ipaa:number = hyperbolic.innerproduct(a,a),
        ipbb:number = hyperbolic.innerproduct(b,b),
        ipab:number = hyperbolic.innerproduct(a,b),
        u:THREE.Vector4,
        v:THREE.Vector4;

    u = a.multiplyScalar(Math.sqrt(ipbb*ipab));
    v = b.multiplyScalar(Math.sqrt(ipaa*ipab));
    return u.add(v);  // returns THREE.Vector4
  }
 

  // I - (2*p*pT*minkowski / innerproduct(p,p)) - returns THREE.Matrix4
  reflection_across(p:THREE.Vector4){
    var ippp = hyperbolic.innerproduct(p,p),
        ipppinv = 1/ippp,
        I = new THREE.Matrix4(),  // initialized as identity matrix4
        c = -2.0*p.dot(p) * ipppinv,
        mels = minkowski.elements,
        idels = I.elements,
        m = new THREE.Matrix4();

    for(let i=0; i<16; i++){
      mels[i] *= c;
      mels[i] += idels[i];
    }
    return m.fromArray(mels); 
  }


  // T(a,b) = refl_acr(midp(a,b)) * refl_acr(a) - returns THREE.Matrix4
  translation_by_refl(a:THREE.Vector4, b:THREE.Vector4){
    var mpab = hyperbolic.midpoint(a,b),
        refl_acr_mpab = hyperbolic.reflection_across(mpab),
        refl_acr_b = hyperbolic.reflection_across(b);

    return refl_acr_mpab.multiply(refl_acr_b); 
  }


  // sinh
  // Math.sinh(x)= (e**x - e**-x)/2
  // polyfill if Math.sinh does not exist
  // return (Math.exp(x) - Math.exp(-x)) * 0.5;
  sinh(t:number){
    return Math.sinh ? Math.sinh(t) : (Math.exp(t) - Math.exp(t) * 0.5;
  }

  // cosh
  // Math.cosh(x)= (e**x + e**-x)/2
  // polyfill if Math.cosh does not exist
  // return (Math.exp(x) + Math.exp(-x)) * 0.5;
  cosh(t:number){
    return Math.cosh ? Math.cosh(t) : (Math.exp(t) + Math.exp(t) * 0.5;
  }

  // NOTE:Math.log is natural log 'ln' - assumes t > 1 ?!
  // In that case how can this function be used in hyperbolic distance below ?!
  invcosh(t:number) {
    return Math.log(t + Math.sqrt(t*t - 1.0))
  }


  // hyperbolic distance between two points
  distance(a:THREE.Vector4, b:THREE.Vector4){
    var ipaa:number = hyperbolic.innerproduct(a,a),
        ipbb:number = hyperbolic.innerproduct(b,b),
        ipab:number = hyperbolic.innerproduct(a,b),
        num:number,
        denom:number,
        q:number,
        sqrtq:number,
        result:number;

    num = ipab * ipab;
    denom = ipaa * ipbb;
    q = num/denom;
    sqrtq = Math.sqrt(q);

    if(sqrtq > 1.0){
      console.log(`*** sqrtq>1 Math.sqrt(q) = ${Math.sqrt(q)}`);
      result = 2.0 * hyperbolic.invcosh(sqrtq);
      // result is NaN ?!
      //return result
      return 0.0;
    }else{
      console.log(`sqrtq<=1 Math.sqrt(q) = ${Math.sqrt(q)}`);
      return b.x;   // assumes a=(0,0,0,1)
    }
  }


  // NOTE: translation matrices are set in row-major order
  // NOTE: translation matrix.elements arrays are given in col-major order
  translationX(t){
    var mtx = new THREE.Matrix4();

    mtx.set(hyperbolic.cosh(t),0,0,hyperbolic.sinh(t),
            0,      1,0,0,
            0,      0,1,0,
            hyperbolic.sinh(t),0,0,hyperbolic.cosh(t));
    return mtx;
  }


  // NOTE: translation matrices are set in row-major order
  // NOTE: translation matrix.elements arrays are given in col-major order
  translationY(t){
    var mty = new THREE.Matrix4();

    mty.set(1,0,0,0,
            0,hyperbolic.cosh(t),0,hyperbolic.sinh(t),
            0,0,1,0,
            0,hyperbolic.sinh(t),0,hyperbolic.cosh(t));
    return mty;
  }
  
  
  // NOTE: translation matrices are set in row-major order
  // NOTE: translation matrix.elements arrays are given in col-major order
  translationZ(t){
    var mtz = new THREE.Matrix4();

    mtz.set(1,0,0,0,
            0,1,0,0,
            0,0,hyperbolic.cosh(t),hyperbolic.sinh(t),
            0,0.hyperbolic.sinh(t),hyperbolic.cosh(t));
    return mtz;
  }
}


// enforce singleton export
if(hyperbolic === undefined){
  hyperbolic = new Hyperbolic();
}
export {hyperbolic};

