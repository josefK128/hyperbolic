// * transform3d.ts
// * creates a transform matrix from a transform model.
// * transform model has form: transform:<br> 
// ```{t: [tx,ty,tz],
//     q: [qx,qy,qz,qw],
//     e: [ep,ey,er],
//     s: [sx,sy,sz]}```
// where t is translation, q is quaternion-rotation, e is euler-rotation
// and s is scale.<br> 
// Each has canonical identity default<br>
// At most one of q or e should be used 
//
// * ```Transform3d.apply(transform, [actor])``` takes as first arg a (JSON.parsed)
// transform model, i.e. a javascript object containing numeric arrays.<br>
// A transform matrix is created and returned<br>
// An optional second arg is a THREE.js Object3d on which the created
// matrix is applied.
//
// * NOTE: mm = (new THREE.Matrix4()).set(e0,e1,...,e15) takes arguments in
//   row-major order, i.e set(m11,m12,m13,m14,m21,...m44) (using math indices).
//   However, when a matrix is decomposed into elements, for example,
//   [a0,a1,a2,...,a15] = mm.elements, the a-array is in column-major order,
//   i.e [m11,m21,m31,m41,m12,...m44] (using math indices).
//   Thus [ei] !== [ai]

// services
import {mediator} from  './mediator';


// singleton instance - exported
var transform3d:Transform3d;



class Transform3d {

  constructor() {
    mediator.log(`Transform3d ctor:`);
  }


  apply(transform, actor) {
    var m = new THREE.Matrix4(),  // identity matrix
        mr = undefined,
        mt = undefined,
        ms = undefined;

    // transform matrix component matrices
    if(transform['q']){
      let qa = transform.q;
      let q = new THREE.Quaternion(qa[0],qa[1],qa[2],qa[3]);
      mr = (new THREE.Matrix4()).makeRotationFromQuaternion(q);
    }
    if(transform['e']){
      let ea = transform.e;
      let euler = new THREE.Euler(ea[0],ea[1],ea[2]); //default pyr (xyz)
      mr = (new THREE.Matrix4()).makeRotationFromEuler(euler);
    }
    if(transform['t']){               
      let ta = transform.t;
      mt = (new THREE.Matrix4()).makeTranslation(ta[0],ta[1],ta[2]);
    }
    if(transform['s']){               
      let sa = transform.s;
      ms = (new THREE.Matrix4()).makeScale(sa[0],sa[1],sa[2]);
    }

    // * transform matrix - first scale, then rotate, then translate
    // * NOTE: m = [mt*mr*ms], so m*v = mt*(mr*(ms*v)))
    m = mt || m;
    if(mr){
      m = m.multiply(mr);
    }
    if(ms){
      m = m.multiply(ms);
    }

    // if Object3d-actor is sent as second arg apply matrix to it
    if(actor){
      actor.applyMatrix(m);
    }

    // return created matrix representing model transform input
    return m;
  }

  // for unit test verification - does m1 equal m2?
  // careful of precision - .01 error is very generous
  // * NOTE: m.elements is given in column-major!
  //   Thus m[i][j].elements = [m00, m10, m20, m30, m01, m11, m21, m31, ...]
  //                            column0           , column1 etc...
  verify(m,mm){
    var a = m.elements,
        aa = mm.elements,
        flag = true,
        d = [],
        sa = [],
        i;
    for(i=0; i<a.length; i++){
      d[i] = Math.abs(a[i]-aa[i]);
      sa.push("a["+i+"]=" + a[i] + " aa[" + i + "]=" + aa[i] + " d[i]=" + d[i]);
      if(Math.abs(d[i]) > 0.01){
        flag = false;
        for(i=0; i<sa.length; i++){
          mediator.loge("error: " + sa[i]);
        }
        break;
      }
    }
    return flag;
  }
}


// enforce singleton export
if(transform3d === undefined){
  transform3d = new Transform3d();
}
export {transform3d};

