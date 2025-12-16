/**
 * GMAT Study PWA - Beams Background
 * Version 6.0 - Exact reactbits.dev Beams Implementation
 * Vanilla Three.js with Perlin noise shaders
 */

(function initBeams() {
  'use strict';

  const container = document.getElementById('canvas-container');
  if (!container || typeof THREE === 'undefined') {
    console.warn('Three.js or canvas container not found');
    return;
  }

  // Configuration matching reactbits.dev Beams component
  const CONFIG = {
    beamWidth: 1.5,
    beamHeight: 20,
    beamNumber: 14,
    colorStops: ['#a8c7fa', '#7c4dff', '#d5bde2'],  // Gradient colors
    speed: 1.5,
    noiseIntensity: 2.0,
    scale: 0.15,
    rotation: 30,  // degrees
    opacity: 0.7
  };

  // Scene Setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 25;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Simplex/Perlin Noise GLSL (exact reactbits implementation)
  const noiseGLSL = `
    // Simplex 3D Noise
    vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 1.0/7.0;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    // Fractal Brownian Motion
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }
  `;

  // Vertex Shader (reactbits.dev style)
  const vertexShader = `
    ${noiseGLSL}

    varying vec2 vUv;
    varying float vNoise;
    varying float vY;

    uniform float uTime;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uNoiseIntensity;

    void main() {
      vUv = uv;
      vY = position.y;

      vec3 pos = position;

      // Create wave-like displacement using noise
      float noiseX = uv.x * 10.0;
      float noiseY = uv.y * 5.0 + uTime * uSpeed;
      float noiseZ = uTime * uSpeed * 0.5;

      float noise1 = snoise(vec3(noiseX * uScale, noiseY * uScale, noiseZ));
      float noise2 = snoise(vec3(noiseX * uScale * 2.0, noiseY * uScale * 2.0, noiseZ * 1.5));

      vNoise = noise1;

      // Apply displacement
      pos.z += (noise1 * 0.8 + noise2 * 0.2) * uNoiseIntensity;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  // Fragment Shader (reactbits.dev gradient beam style)
  const fragmentShader = `
    varying vec2 vUv;
    varying float vNoise;
    varying float vY;

    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uOpacity;
    uniform float uTime;

    void main() {
      // Beam center gradient (strongest at center, fading to edges)
      float beamStrength = 1.0 - abs(vUv.x - 0.5) * 2.0;
      beamStrength = pow(beamStrength, 2.5);

      // Vertical fade (stronger at center vertically too)
      float verticalFade = 1.0 - abs(vY) / 10.0;
      verticalFade = clamp(verticalFade, 0.0, 1.0);
      verticalFade = pow(verticalFade, 0.5);

      // Edge softening
      float edgeSoftX = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
      float edgeSoftY = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);

      float finalStrength = beamStrength * verticalFade * edgeSoftX * edgeSoftY;

      // Color gradient based on position and noise
      float colorMix = vUv.y + vNoise * 0.3;
      vec3 color;
      if (colorMix < 0.5) {
        color = mix(uColor1, uColor2, colorMix * 2.0);
      } else {
        color = mix(uColor2, uColor3, (colorMix - 0.5) * 2.0);
      }

      // Add subtle shimmer
      float shimmer = sin(vUv.y * 20.0 + uTime * 2.0) * 0.05 + 0.95;
      color *= shimmer;

      // Glow effect
      color += color * finalStrength * 0.5;

      float alpha = finalStrength * uOpacity;

      gl_FragColor = vec4(color, alpha);
    }
  `;

  // Convert hex to RGB Vector3
  function hexToRGB(hex) {
    const clean = hex.replace('#', '');
    return new THREE.Vector3(
      parseInt(clean.substring(0, 2), 16) / 255,
      parseInt(clean.substring(2, 4), 16) / 255,
      parseInt(clean.substring(4, 6), 16) / 255
    );
  }

  // Create stacked beam geometry
  function createBeamsGeometry(count, width, height, segments) {
    const geometry = new THREE.BufferGeometry();
    const segmentsX = 2;
    const segmentsY = segments;

    const verticesPerBeam = (segmentsX + 1) * (segmentsY + 1);
    const indicesPerBeam = segmentsX * segmentsY * 6;

    const totalVertices = count * verticesPerBeam;
    const totalIndices = count * indicesPerBeam;

    const positions = new Float32Array(totalVertices * 3);
    const uvs = new Float32Array(totalVertices * 2);
    const indices = new Uint32Array(totalIndices);

    const totalWidth = count * width * 1.2;
    const startX = -totalWidth / 2;

    let vIndex = 0;
    let iIndex = 0;
    let vertexOffset = 0;

    for (let b = 0; b < count; b++) {
      const beamX = startX + b * width * 1.2 + (Math.random() - 0.5) * width * 0.3;
      const beamZ = (Math.random() - 0.5) * 3;
      const uvOffsetX = Math.random() * 100;
      const uvOffsetY = Math.random() * 100;

      for (let y = 0; y <= segmentsY; y++) {
        for (let x = 0; x <= segmentsX; x++) {
          const px = beamX + (x / segmentsX - 0.5) * width;
          const py = (y / segmentsY - 0.5) * height;
          const pz = beamZ;

          positions[vIndex * 3] = px;
          positions[vIndex * 3 + 1] = py;
          positions[vIndex * 3 + 2] = pz;

          uvs[vIndex * 2] = x / segmentsX + uvOffsetX;
          uvs[vIndex * 2 + 1] = y / segmentsY + uvOffsetY;

          vIndex++;
        }
      }

      for (let y = 0; y < segmentsY; y++) {
        for (let x = 0; x < segmentsX; x++) {
          const a = vertexOffset + y * (segmentsX + 1) + x;
          const b = a + 1;
          const c = a + (segmentsX + 1);
          const d = c + 1;

          indices[iIndex++] = a;
          indices[iIndex++] = c;
          indices[iIndex++] = b;
          indices[iIndex++] = b;
          indices[iIndex++] = c;
          indices[iIndex++] = d;
        }
      }

      vertexOffset += verticesPerBeam;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    return geometry;
  }

  // Create material
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: CONFIG.speed },
      uScale: { value: CONFIG.scale },
      uNoiseIntensity: { value: CONFIG.noiseIntensity },
      uColor1: { value: hexToRGB(CONFIG.colorStops[0]) },
      uColor2: { value: hexToRGB(CONFIG.colorStops[1]) },
      uColor3: { value: hexToRGB(CONFIG.colorStops[2]) },
      uOpacity: { value: CONFIG.opacity }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });

  // Create geometry and mesh
  const geometry = createBeamsGeometry(
    CONFIG.beamNumber,
    CONFIG.beamWidth,
    CONFIG.beamHeight,
    80
  );

  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(mesh);
  group.rotation.z = CONFIG.rotation * (Math.PI / 180);

  scene.add(group);

  // Animation
  const clock = new THREE.Clock();
  let animationId;

  function animate() {
    animationId = requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();
    material.uniforms.uTime.value = elapsed;

    renderer.render(scene, camera);
  }

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

  // Cleanup
  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationId);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  });
})();
