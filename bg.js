/**
 * GMAT Study PWA - Beams Background
 * Version 5.0 - Adapted from reactbits.dev Beams component
 * Vanilla Three.js implementation with advanced noise shaders
 */

(function initBeams() {
  'use strict';

  const container = document.getElementById('canvas-container');
  if (!container || typeof THREE === 'undefined') {
    console.warn('Three.js or canvas container not found');
    return;
  }

  // Configuration (matching reactbits.dev Beams component)
  const CONFIG = {
    beamWidth: 2,
    beamHeight: 15,
    beamNumber: 12,
    lightColor: '#a8c7fa',  // Using primary color from theme
    speed: 2,
    noiseIntensity: 1.75,
    scale: 0.2,
    rotation: 25  // degrees
  };

  // Scene Setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 20;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Noise Functions (GLSL)
  const noiseGLSL = `
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

    float cnoise(vec3 P) {
      vec3 Pi0 = floor(P);
      vec3 Pi1 = Pi0 + vec3(1.0);
      Pi0 = mod(Pi0, 289.0);
      Pi1 = mod(Pi1, 289.0);
      vec3 Pf0 = fract(P);
      vec3 Pf1 = Pf0 - vec3(1.0);
      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
      vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz;
      vec4 iz1 = Pi1.zzzz;
      vec4 ixy = permute(permute(ix) + iy);
      vec4 ixy0 = permute(ixy + iz0);
      vec4 ixy1 = permute(ixy + iz1);
      vec4 gx0 = ixy0 / 7.0;
      vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
      gx0 = fract(gx0);
      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
      vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5);
      gy0 -= sz0 * (step(0.0, gy0) - 0.5);
      vec4 gx1 = ixy1 / 7.0;
      vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
      gx1 = fract(gx1);
      vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
      vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5);
      gy1 -= sz1 * (step(0.0, gy1) - 0.5);
      vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
      vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
      vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
      vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
      vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
      vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
      vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
      vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
      vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
      g000 *= norm0.x;
      g010 *= norm0.y;
      g100 *= norm0.z;
      g110 *= norm0.w;
      vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
      g001 *= norm1.x;
      g011 *= norm1.y;
      g101 *= norm1.z;
      g111 *= norm1.w;
      float n000 = dot(g000, Pf0);
      float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
      float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
      float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
      float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
      float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
      float n111 = dot(g111, Pf1);
      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
      return 2.2 * n_xyz;
    }
  `;

  // Vertex Shader
  const vertexShader = `
    ${noiseGLSL}

    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vNoise;

    uniform float time;
    uniform float uSpeed;
    uniform float uScale;

    float getPos(vec3 pos) {
      vec3 noisePos = vec3(pos.x * 0.0, pos.y - uv.y, pos.z + time * uSpeed * 3.0) * uScale;
      return cnoise(noisePos);
    }

    vec3 getCurrentPos(vec3 pos) {
      vec3 newpos = pos;
      newpos.z += getPos(pos);
      return newpos;
    }

    vec3 getNormal(vec3 pos) {
      vec3 curpos = getCurrentPos(pos);
      vec3 nextposX = getCurrentPos(pos + vec3(0.01, 0.0, 0.0));
      vec3 nextposZ = getCurrentPos(pos + vec3(0.0, -0.01, 0.0));
      vec3 tangentX = normalize(nextposX - curpos);
      vec3 tangentZ = normalize(nextposZ - curpos);
      return normalize(cross(tangentZ, tangentX));
    }

    void main() {
      vUv = uv;
      vPosition = position;

      vec3 pos = position;
      float noiseVal = getPos(pos);
      pos.z += noiseVal;
      vNoise = noiseVal;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  // Fragment Shader
  const fragmentShader = `
    ${noiseGLSL}

    varying vec2 vUv;
    varying vec3 vPosition;
    varying float vNoise;

    uniform float uNoiseIntensity;
    uniform vec3 uLightColor;

    void main() {
      // Beam gradient effect
      float strength = 1.0 - abs(vUv.y - 0.5) * 2.0;
      strength = pow(strength, 3.0);

      // Edge fade
      float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
      strength *= edgeFade;

      // Apply light color
      vec3 color = uLightColor * strength;

      // Add subtle noise grain
      float randomNoise = noise(gl_FragCoord.xy * 0.5);
      color -= randomNoise / 15.0 * uNoiseIntensity;

      // Final alpha based on strength
      float alpha = strength * 0.4;

      gl_FragColor = vec4(color, alpha);
    }
  `;

  // Convert hex color to RGB
  function hexToRGB(hex) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return new THREE.Vector3(r, g, b);
  }

  // Create stacked planes geometry (matching reactbits.dev implementation)
  function createStackedPlanesGeometry(count, width, height, heightSegments) {
    const geometry = new THREE.BufferGeometry();
    const spacing = 0;
    const numVertices = count * (heightSegments + 1) * 2;
    const numFaces = count * heightSegments * 2;

    const positions = new Float32Array(numVertices * 3);
    const indices = new Uint32Array(numFaces * 3);
    const uvs = new Float32Array(numVertices * 2);

    let vertexOffset = 0;
    let indexOffset = 0;
    let uvOffset = 0;

    const totalWidth = count * width + (count - 1) * spacing;
    const xOffsetBase = -totalWidth / 2;

    for (let i = 0; i < count; i++) {
      const xOffset = xOffsetBase + i * (width + spacing);
      const uvXOffset = Math.random() * 300;
      const uvYOffset = Math.random() * 300;

      for (let j = 0; j <= heightSegments; j++) {
        const y = height * (j / heightSegments - 0.5);
        const v0 = [xOffset, y, 0];
        const v1 = [xOffset + width, y, 0];

        positions.set([...v0, ...v1], vertexOffset * 3);

        const uvY = j / heightSegments;
        uvs.set([uvXOffset, uvY + uvYOffset, uvXOffset + 1, uvY + uvYOffset], uvOffset);

        if (j < heightSegments) {
          const a = vertexOffset;
          const b = vertexOffset + 1;
          const c = vertexOffset + 2;
          const d = vertexOffset + 3;
          indices.set([a, b, c, c, b, d], indexOffset);
          indexOffset += 6;
        }
        vertexOffset += 2;
        uvOffset += 4;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();

    return geometry;
  }

  // Create beam material
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      time: { value: 0 },
      uSpeed: { value: CONFIG.speed },
      uScale: { value: CONFIG.scale },
      uNoiseIntensity: { value: CONFIG.noiseIntensity },
      uLightColor: { value: hexToRGB(CONFIG.lightColor) }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  // Create geometry
  const geometry = createStackedPlanesGeometry(
    CONFIG.beamNumber,
    CONFIG.beamWidth,
    CONFIG.beamHeight,
    100  // height segments for smooth animation
  );

  // Create mesh and group
  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(mesh);

  // Apply rotation
  group.rotation.z = CONFIG.rotation * (Math.PI / 180);

  scene.add(group);

  // Add directional light
  const dirLight = new THREE.DirectionalLight(CONFIG.lightColor, 1);
  dirLight.position.set(0, 3, 10);
  scene.add(dirLight);

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Animation
  const clock = new THREE.Clock();
  let animationId;

  function animate() {
    animationId = requestAnimationFrame(animate);

    const delta = clock.getDelta();
    material.uniforms.time.value += delta * 0.1;

    renderer.render(scene, camera);
  }

  // Start animation
  animate();

  // Handle resize
  function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener('resize', handleResize);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationId);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  });
})();
