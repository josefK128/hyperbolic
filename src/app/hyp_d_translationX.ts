// narrative.ts
    x_c.onChange((v) => {
      x = v;
      //e_cube.position.set(v, y+1.0, z);
      //h_cube.position.set(v, y-1.0, z);
      
      // Euclidean matrix4
      let mt = (new THREE.Matrix4()).makeTranslation(x,y,z);
      let p = new THREE.Vector4(0,0,0,1);
      p.applyMatrix4(mt);
      e_cube.position.set(p.x, p.y+1.0, p.z);
      //h_cube.position.set(p.x, p.y-1.0, p.z); // euclidean translation

      // hyperbolic.translation_by_refl Matrix4 FAILS!
      //p = new THREE.Vector4(0,-1.0,0,1);             // start
      //let u = new THREE.Vector4(x, y-1.0, z, 1.0);  // destination
      //mt = hyperbolic.translation(p,u);
      //h_cube.position.set(p);
      //h_cube.applyMatrix(mt);   // Object3D.applyMatrix(mt)

      // hyperbolic.translationX Matrix4 
      p = new THREE.Vector3(0,-1.0,0);             // start
      let u = new THREE.Vector3(x, y-1.0, z);     // destination
      //let e:THREE.Vector3 = u.add(p.multiplyScalar(-1.0));
      //let d = e.length();  // euclidean!!!!
      let d = hyperbolic.distance(p,u);
      console.log(`p = ${p} u = ${u} d = ${d}`);
      mt = hyperbolic.translationX(d);
      h_cube.position.set(p);
      h_cube.applyMatrix(mt);   // Object3D.applyMatrix(mt)
    });




// hyperbolic.ts
  // hyperbolic distance between two points
  distance(p:THREE.Vector3, v:THREE.Vector3){
    return 0.5;
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

