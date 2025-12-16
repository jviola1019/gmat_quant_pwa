
// Vanilla Three.js implementation of the React "Beams" background
(function initBeams() {
  const container = document.getElementById('canvas-container');
  if (!container || !window.THREE) return;

  const THREE = window.THREE;
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 20;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Shader Code (Ported from the provided React code)
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float time;
    
    // Simplex Noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      return 130.0 * dot(m*m, vec3( dot(p.x, x0), dot(p.y, x12.xy), dot(p.z, x12.zw) )); 
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      // Animate noise
      float noiseVal = snoise(vec2(pos.x * 0.4, pos.y * 0.1 + time * 0.1));
      pos.z += noiseVal * 2.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    void main() {
      // Beam gradient
      float strength = 1.0 - abs(vUv.y - 0.5) * 2.0;
      strength = pow(strength, 4.0); // Sharpness
      vec3 color = vec3(0.8, 0.9, 1.0) * strength; 
      gl_FragColor = vec4(color, strength * 0.3); 
    }
  `;

  // Create Stacked Planes
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(35, 2, 60, 10); 
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { time: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  // Generate beams
  for (let i = 0; i < 10; i++) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    // Random placement
    mesh.position.y = (Math.random() - 0.5) * 15;
    mesh.position.z = (Math.random() - 0.5) * 10 - 5;
    mesh.rotation.z = (Math.random() - 0.5) * 0.3;
    mesh.scale.y = Math.random() * 1.5 + 0.5;
    
    // Offset time to de-sync
    mesh.material.uniforms.time.value = Math.random() * 100;
    group.add(mesh);
  }
  
  group.rotation.z = 25 * (Math.PI / 180); // Diagonal tilt
  scene.add(group);

  // Animation Loop
  const clock = new THREE.Clock();
  
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    group.children.forEach(mesh => {
      mesh.material.uniforms.time.value += delta * 0.8; // Speed
    });
    renderer.render(scene, camera);
  }
  animate();

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
