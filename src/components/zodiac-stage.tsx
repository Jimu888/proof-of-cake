'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useLanguage } from '../lib/i18n';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { getZodiacById, type ActiveZodiacId, type ZodiacFilter } from '../domain/zodiac';

export type ZodiacStageProps = {
  sign: ActiveZodiacId;
  mode: 'hero' | 'studio';
  heroFraming?: 'card';
  filter?: ZodiacFilter;
  motionEnabled?: boolean;
  unsealNonce?: number;
  pulseNonce?: number;
  onRevealComplete?: () => void;
  dissolving?: boolean;
};

type SharedUniforms = {
  uTime: { value: number };
  uUnseal: { value: number };
  uPulse: { value: number };
  uMotion: { value: number };
  uMode: { value: number };
  uFilter: { value: number };
  uAccent: { value: THREE.Color };
};

const SIGN_TO_MODE: Record<ActiveZodiacId, number> = {
  goat: 0,
  horse: 1,
  ox: 2,
  dragon: 3,
};

const FILTER_TO_INT: Record<ZodiacFilter, number> = {
  original: 0,
  obsidian: 1,
  hologram: 2,
  emerald: 3,
};

function prepareExplodableGeometry(geometry: THREE.BufferGeometry, globalMinY: number, globalSpanY: number, meshMatrix: THREE.Matrix4): THREE.BufferGeometry {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const pos = nonIndexed.getAttribute('position') as THREE.BufferAttribute;
  const count = pos.count;

  const centers = new Float32Array(count * 3);
  const localPos = new Float32Array(count * 3);
  const heightT = new Float32Array(count);
  const seeds = new Float32Array(count);

  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const c = new THREE.Vector3();
  const worldC = new THREE.Vector3();

  for (let i = 0; i < count; i += 3) {
    v0.fromBufferAttribute(pos, i);
    v1.fromBufferAttribute(pos, Math.min(i + 1, count - 1));
    v2.fromBufferAttribute(pos, Math.min(i + 2, count - 1));
    c.copy(v0).add(v1).add(v2).multiplyScalar(1 / 3);
    worldC.copy(c).applyMatrix4(meshMatrix);

    const ht = THREE.MathUtils.clamp((worldC.y - globalMinY) / Math.max(globalSpanY, 0.0001), 0, 1);
    const seed = Math.abs(Math.sin(c.x * 12.9898 + c.y * 78.233 + c.z * 37.719) * 43758.5453) % 1;

    for (let k = 0; k < 3 && i + k < count; k++) {
      const idx = i + k;
      const vx = pos.getX(idx);
      const vy = pos.getY(idx);
      const vz = pos.getZ(idx);

      centers[idx * 3] = c.x;
      centers[idx * 3 + 1] = c.y;
      centers[idx * 3 + 2] = c.z;

      localPos[idx * 3] = vx - c.x;
      localPos[idx * 3 + 1] = vy - c.y;
      localPos[idx * 3 + 2] = vz - c.z;

      heightT[idx] = ht;
      seeds[idx] = seed;
    }
  }

  nonIndexed.setAttribute('aCenter', new THREE.BufferAttribute(centers, 3));
  nonIndexed.setAttribute('aLocalPos', new THREE.BufferAttribute(localPos, 3));
  nonIndexed.setAttribute('aHeightT', new THREE.BufferAttribute(heightT, 1));
  nonIndexed.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  if (!nonIndexed.getAttribute('normal')) {
    nonIndexed.computeVertexNormals();
  }
  return nonIndexed;
}

function patchZodiacMaterial(material: THREE.Material, uniforms: SharedUniforms, sign: ActiveZodiacId): THREE.Material {
  const mat = material.clone() as THREE.MeshStandardMaterial;
  mat.side = THREE.DoubleSide;
  if ('metalness' in mat && typeof mat.metalness === 'number') {
    mat.metalness = Math.min(0.85, Math.max(0.18, mat.metalness));
  }
  if ('roughness' in mat && typeof mat.roughness === 'number') {
    mat.roughness = Math.min(0.75, Math.max(0.22, mat.roughness));
  }

  mat.customProgramCacheKey = () => `mement-zodiac-v1-${sign}`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uUnseal = uniforms.uUnseal;
    shader.uniforms.uPulse = uniforms.uPulse;
    shader.uniforms.uMotion = uniforms.uMotion;
    shader.uniforms.uMode = uniforms.uMode;
    shader.uniforms.uFilter = uniforms.uFilter;
    shader.uniforms.uAccent = uniforms.uAccent;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec3 aCenter;
        attribute vec3 aLocalPos;
        attribute float aHeightT;
        attribute float aSeed;
        uniform float uTime;
        uniform float uUnseal;
        uniform float uMotion;
        uniform float uMode;
        varying float vHeightT;
        varying vec3 vWorldPosZ;
        varying vec3 vNormalViewZ;
        varying vec3 vViewPosZ;
        `,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vHeightT = aHeightT;

        // Smooth cubic ease without pow(0.0, 3.0)
        float delay = 0.0;
        if (uMode < 0.5) {
          // Goat: Top-to-Bottom Airdrop
          delay = (1.0 - aHeightT) * 0.42 + aSeed * 0.12;
        } else if (uMode < 1.5) {
          // Horse: Horizontal Light-Speed Streak
          delay = clamp(0.5 - aCenter.x * 0.28, 0.0, 0.45) + aSeed * 0.12;
        } else if (uMode < 2.5) {
          // Ox: Bottom-to-Top Breakout
          delay = aHeightT * 0.42 + aSeed * 0.12;
        } else {
          // Dragon: Cosmic Spiral Ring
          delay = aHeightT * 0.36 + aSeed * 0.16;
        }

        float localProg = clamp((uUnseal - delay) / max(1.0 - delay, 0.001), 0.0, 1.0);
        float inv = 1.0 - localProg;
        float inv3 = inv * inv * inv;

        vec3 offset = vec3(0.0);
        float scaleFac = mix(0.25, 1.0, localProg);

        if (uMode < 0.5) {
          // Goat drop from sky
          offset.y += inv3 * (3.2 + aSeed * 1.4);
          offset.x += sin(aSeed * 19.0) * inv3 * 0.35;
          offset.z += cos(aSeed * 23.0) * inv3 * 0.35;
        } else if (uMode < 1.5) {
          // Horse light-speed from right
          offset.x += inv3 * (4.4 + aSeed * 1.8);
          offset.y += sin(aSeed * 17.0) * inv3 * 0.25;
        } else if (uMode < 2.5) {
          // Ox surge from below
          offset.y -= inv3 * (3.0 + aSeed * 1.3);
          float radial = inv3 * 0.65;
          offset.x += aCenter.x * radial;
          offset.z += aCenter.z * radial;
        } else {
          // Dragon cosmic spiral
          float ang = inv3 * 5.2 + aSeed * 6.2831;
          float rad = inv3 * (2.6 + aSeed * 1.1);
          offset.x += cos(ang) * rad;
          offset.z += sin(ang) * rad;
          offset.y += (aSeed - 0.5) * inv3 * 1.6;
        }

        // Ambient living motion per zodiac
        vec3 motionOffset = vec3(0.0);
        if (uMotion > 0.5 && localProg > 0.92) {
          if (uMode < 0.5) {
            // Goat: calm breath + upper horn/airdrop levitation resonance
            motionOffset.y += sin(uTime * 1.5) * 0.028;
            if (aHeightT > 0.62) {
              float topWeight = (aHeightT - 0.62) / 0.38;
              motionOffset.y += sin(uTime * 3.4 + aSeed * 6.28) * 0.032 * topWeight;
            }
          } else if (uMode < 1.5) {
            // Horse: kinetic surge + mane/tail wind ripple
            motionOffset.y += sin(uTime * 2.3) * 0.032;
            motionOffset.z += sin(uTime * 2.3) * 0.02 * aHeightT;
            if (aHeightT > 0.42) {
              motionOffset.x += sin(uTime * 5.2 - aCenter.x * 4.0) * 0.018 * (aHeightT - 0.42);
            }
          } else if (uMode < 2.5) {
            // Ox: steady bull pulse + upward radial surge
            float wave = sin(uTime * 1.75 - aHeightT * 4.2);
            motionOffset.y += sin(uTime * 1.75) * 0.022;
            motionOffset.xz += aCenter.xz * (wave * 0.016);
          } else {
            // Dragon: sinusoidal spine swim + majestic hover
            float swim = sin(uTime * 1.85 - aHeightT * 8.5);
            motionOffset.x += swim * 0.036;
            motionOffset.y += sin(uTime * 1.35) * 0.03;
          }
        }

        transformed = aCenter + aLocalPos * scaleFac + offset + motionOffset;
        `,
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vWorldPosZ = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vNormalViewZ = normalize(normalMatrix * objectNormal);
        vViewPosZ = -mvPosition.xyz;
        `,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform float uPulse;
        uniform float uMode;
        uniform float uFilter;
        uniform vec3 uAccent;
        varying float vHeightT;
        varying vec3 vWorldPosZ;
        varying vec3 vNormalViewZ;
        varying vec3 vViewPosZ;
        `,
      )
      .replace(
        '#include <dithering_fragment>',
        `
        vec3 nView = normalize(vNormalViewZ);
        vec3 vDir = normalize(vViewPosZ);
        float fresnelBase = max(1.0 - abs(dot(nView, vDir)), 0.0001);
        float fresnel = fresnelBase * fresnelBase * fresnelBase;

        // Material filter grading
        vec3 col = gl_FragColor.rgb;
        float lum = dot(col, vec3(0.299, 0.587, 0.114));

        if (uFilter < 0.5) {
          // Original Enhanced: preserve Blender materials + subtle gallery rim
          col += uAccent * (fresnel * 0.13);
        } else if (uFilter < 1.5) {
          // Obsidian & Champagne Gold
          vec3 darkObs = vec3(0.05, 0.055, 0.07) + vec3(0.16, 0.17, 0.2) * lum;
          vec3 goldRim = vec3(0.95, 0.78, 0.45) * (fresnel * 0.72 + smoothstep(0.62, 0.95, lum) * 0.45);
          col = darkObs + goldRim;
        } else if (uFilter < 2.5) {
          // Ice Silver Hologram
          vec3 iceBase = mix(vec3(0.08, 0.13, 0.20), vec3(0.76, 0.88, 0.98), lum);
          float scan = 0.92 + 0.08 * sin(vWorldPosZ.y * 42.0 - uTime * 3.0);
          col = iceBase * scan + vec3(0.55, 0.84, 1.0) * (fresnel * 0.82);
        } else {
          // Emerald Matrix
          vec3 emBase = mix(vec3(0.03, 0.09, 0.08), vec3(0.24, 0.82, 0.62), lum);
          col = emBase + vec3(0.22, 0.95, 0.68) * (fresnel * 0.75);
        }

        // On-chain energy pulse sweep
        if (uPulse > 0.001 && uPulse < 0.999) {
          float coord = vHeightT;
          if (uMode < 0.5) {
            coord = 1.0 - vHeightT; // Goat: top to bottom
          } else if (uMode < 1.5) {
            coord = clamp(vWorldPosZ.x * 0.36 + 0.5, 0.0, 1.0); // Horse: horizontal sweep
          } else {
            coord = vHeightT; // Ox & Dragon: bottom to top
          }
          float band = exp(-abs(coord - uPulse) * 14.0);
          col += uAccent * (band * 0.48);
        }

        // Compress only HDR highlights before bloom so bright facets stay legible.
        float peak = max(col.r, max(col.g, col.b));
        if (peak > 1.0) {
          float shoulder = 1.0 + 1.2 * (1.0 - exp(-0.62 * (peak - 1.0)));
          col *= shoulder / peak;
        }
        gl_FragColor.rgb = col;
        #include <dithering_fragment>
        `,
      );
  };
  return mat;
}

export default function ZodiacStage({
  sign,
  mode,
  heroFraming,
  filter = 'original',
  motionEnabled = true,
  unsealNonce = 0,
  pulseNonce = 0,
  onRevealComplete,
  dissolving = false,
}: ZodiacStageProps) {
  const revealComplete = useRef(onRevealComplete);
  revealComplete.current = onRevealComplete;
  const dissolve = useRef(dissolving);
  dissolve.current = dissolving;
  const containerRef = useRef<HTMLDivElement>(null);
  const particleRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const uniformsRef = useRef<SharedUniforms>({
    uTime: { value: 0 },
    uUnseal: { value: mode === 'hero' ? 1 : 0 },
    uPulse: { value: 0 },
    uMotion: { value: motionEnabled ? 1 : 0 },
    uMode: { value: SIGN_TO_MODE[sign] },
    uFilter: { value: FILTER_TO_INT[filter] },
    uAccent: { value: new THREE.Color(getZodiacById(sign).accentHex) },
  });

  const pulseStartRef = useRef<number>(-10);
  const unsealStartRef = useRef<number>(mode === 'hero' ? -10 : 0);
  const pointerYaw = useRef(0);
  const { t } = useLanguage();
  const spec = getZodiacById(sign);

  // Live uniform sync for filter & motion toggle
  useEffect(() => {
    uniformsRef.current.uFilter.value = FILTER_TO_INT[filter];
  }, [filter]);

  useEffect(() => {
    uniformsRef.current.uMotion.value = motionEnabled ? 1 : 0;
  }, [motionEnabled]);

  // Manual pulse trigger
  useEffect(() => {
    if (pulseNonce > 0) {
      pulseStartRef.current = uniformsRef.current.uTime.value;
    }
  }, [pulseNonce]);

  // Manual unseal trigger
  useEffect(() => {
    if (unsealNonce > 0) {
      unsealStartRef.current = uniformsRef.current.uTime.value;
      uniformsRef.current.uUnseal.value = 0;
    }
  }, [unsealNonce]);

  // 2D Crypto Atmosphere Particle Overlay
  useEffect(() => {
    const canvas = particleRef.current;
    if (!canvas || mode === 'hero') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let rafId = 0;
    let width = 0;
    let height = 0;

    const accent = new THREE.Color(spec.accentHex);
    const tint = accent.getStyle(THREE.SRGBColorSpace);
    const particles = Array.from({ length: 43 }, () => ({
      x: Math.random(), y: Math.random(),
      size: .45 + Math.random() * 1.2,
      alpha: .13 + Math.random() * .46,
      phase: Math.random() * Math.PI * 2,
    }));
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    let started: number | undefined;
    const draw = (now: number) => {
      started ??= now;
      const elapsed = (now - started) / 1000;
      ctx.clearRect(0, 0, width, height);
      for (const [i, p] of particles.entries()) {
        const x = p.x * width + Math.sin(elapsed * .2 + p.phase) * 5;
        const y = ((p.y + elapsed * .006) % 1) * height;
        ctx.globalAlpha = p.alpha * (.64 + Math.sin(elapsed * .9 + p.phase) * .35);
        ctx.fillStyle = i % 3 ? '#e6ebf3' : tint;
        ctx.shadowColor = tint;
        ctx.shadowBlur = i % 4 === 0 ? 6 : 0;
        ctx.fillRect(x, y, p.size, i % 7 === 0 ? p.size * 3 : p.size);
        if (i % 9 === 0) ctx.fillRect(x - p.size, y + p.size, p.size * 3, .55);
      }
      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [mode, spec.accentHex]);

  // Three.js WebGL Stage
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !spec.modelUrl) return;

    let disposed = false;
    let rafId = 0;
    setLoaded(false);
    setFailed(false);
    setProgress(8);

    const uniforms = uniformsRef.current;
    uniforms.uMode.value = SIGN_TO_MODE[sign];
    uniforms.uAccent.value.set(spec.accentHex);
    uniforms.uUnseal.value = mode === 'hero' ? 1 : 0;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      setFailed(true);
      revealComplete.current?.();
      return;
    }

    const touch = window.matchMedia('(pointer: coarse)').matches;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, touch ? 1.15 : 1.4);
    if (touch) renderer.domElement.classList.add('zodiac-touch-canvas');
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, 0.04, 0.1, 100, { size: 128 });
    room.dispose();
    pmrem.dispose();
    scene.environment = environment.texture;
    const hero = mode === 'hero';
    const card = hero && heroFraming === 'card';
    scene.environmentIntensity = 0.55;
    const camera = new THREE.PerspectiveCamera(card ? 30 : 34, 1, 0.1, 100);
    if (hero) camera.position.set(0, 0.24, 5.4);
    else camera.position.set(0, 0.25, 5.1);

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(pixelRatio);
    const scenePass = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.16, 0.35, 0.88);
    const output = new OutputPass();
    composer.addPass(scenePass);
    composer.addPass(bloom);
    composer.addPass(output);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Three-point gallery lighting to keep obsidian facets sculptural and legible
    const ambient = new THREE.AmbientLight(hero ? 0xebf0fa : 0xdbe6ff, hero ? 0.57 : 0.72);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, hero ? 1.8 : 2.05);
    keyLight.position.set(1.2, 6, 3.8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9cb7cc, hero ? 1.18 : 1.55);
    rimLight.position.set(-4.2, 3.2, -4.5);
    scene.add(rimLight);

    const warmFill = new THREE.DirectionalLight(0xf2743a, 0.38);
    warmFill.position.set(-4.2, 1.8, 2.0);
    scene.add(warmFill);

    const rootGroup = new THREE.Group();
    if (hero) rootGroup.rotation.y = 0.38;
    scene.add(rootGroup);

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          float falloff = 1.0 - smoothstep(0.06, 0.5, length(vUv - 0.5));
          gl_FragColor = vec4(0.0, 0.0, 0.0, falloff * falloff * 0.55);
        }
      `,
    }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.visible = false;
    scene.add(shadow);

    let controls: OrbitControls | null = null;
    if (mode === 'studio') {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.enablePan = false;
      controls.minDistance = 2.9;
      controls.maxDistance = 8.4;
      controls.autoRotate = !reduced;
      controls.autoRotateSpeed = 0.65;
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const onPointerMove = (event: PointerEvent) => {
      if (mode !== 'hero') return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerYaw.current = THREE.MathUtils.clamp(nx, -1, 1);
    };
    const onPointerLeave = () => {
      pointerYaw.current = 0;
    };
    if (mode === 'hero') {
      container.addEventListener('pointermove', onPointerMove);
      container.addEventListener('pointerleave', onPointerLeave);
    }

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('/birthday/draco/');
    loader.setDRACOLoader(draco);

    const disposableGeometries = new Set<THREE.BufferGeometry>();
    const disposableMaterials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    let revealed = false;
    let reverseStarted: number | undefined;
    let modelReady = false;
    const finishReveal = () => {
      if (revealed) return;
      revealed = true;
      revealComplete.current?.();
    };

    loader.load(
      spec.modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.traverse(obj => {
          if (!(obj instanceof THREE.Mesh)) return;
          if (disposed) obj.geometry?.dispose();
          for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) {
            if (!material) continue;
            for (const property of Object.values(material)) {
              if (property instanceof THREE.Texture) {
                if (disposed) property.dispose();
                else textures.add(property);
              }
            }
            if (disposed) material.dispose();
            else disposableMaterials.add(material);
          }
        });
        if (disposed) return;
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const targetSize = card ? 1.88 : hero ? 2.05 : 2.55;
        const scale = targetSize / maxDim;

        model.scale.setScalar(scale);
        model.position.copy(center).multiplyScalar(-scale);
        model.updateMatrixWorld(true);

        const normBox = new THREE.Box3().setFromObject(model);
        const minY = normBox.min.y;
        const spanY = Math.max(normBox.max.y - normBox.min.y, 0.001);

        model.traverse((obj) => {
          if (!(obj instanceof THREE.Mesh) || !obj.geometry) return;
          const nextGeo = prepareExplodableGeometry(obj.geometry, minY, spanY, obj.matrixWorld);
          obj.geometry.dispose();
          obj.geometry = nextGeo;
          disposableGeometries.add(nextGeo);

          if (Array.isArray(obj.material)) {
            obj.material = obj.material.map((m) => {
              const patched = patchZodiacMaterial(m, uniforms, sign);
              disposableMaterials.add(patched);
              return patched;
            });
          } else if (obj.material) {
            const patched = patchZodiacMaterial(obj.material, uniforms, sign);
            obj.material = patched;
            disposableMaterials.add(patched);
          }
        });

        shadow.position.y = minY - 0.025;
        shadow.scale.set(Math.max(size.x, size.z) * scale * 1.65, size.z * scale * 2, 1);
        shadow.visible = true;
        rootGroup.add(model);
        modelReady = true;
        setProgress(100);
        setLoaded(true);

        if (mode === 'studio' && !reduced) {
          unsealStartRef.current = uniforms.uTime.value;
          uniforms.uUnseal.value = 0;
        } else {
          unsealStartRef.current = -10;
          uniforms.uUnseal.value = 1;
        }
        pulseStartRef.current = uniforms.uTime.value + 0.6;
        if (mode === 'hero' || reduced) finishReveal();
      },
      (xhr) => {
        if (disposed) return;
        if (xhr.total > 0) {
          setProgress(Math.min(96, Math.max(12, Math.round((xhr.loaded / xhr.total) * 100))));
        }
      },
      () => {
        if (disposed) return;
        setFailed(true);
        finishReveal();
      },
    );

    const clock = new THREE.Clock();
    let lastAutoPulse = 0;

    let lastPaint = 0;
    const animate = (now: number) => {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);
      const interval = touch && mode === 'hero' ? 1000 / 30 : 0;
      if (interval && now - lastPaint < interval - 1) return;
      lastPaint = now;
      const dt = Math.min(clock.getDelta(), 0.05);
      uniforms.uTime.value += dt;
      const t = uniforms.uTime.value;

      // Unseal timeline (1.75s)
      if (dissolve.current && modelReady) {
        const now = performance.now();
        reverseStarted ??= now;
        uniforms.uUnseal.value = reduced ? 0 : Math.max(0, 1 - (now - reverseStarted) / 1650);
        rootGroup.visible = uniforms.uUnseal.value > 0;
      } else if (modelReady && unsealStartRef.current >= 0) {
        const elapsed = t - unsealStartRef.current;
        if (elapsed >= 0) {
          uniforms.uUnseal.value = Math.min(1, elapsed / 1.75);
          if (elapsed >= 1.75) {
            unsealStartRef.current = -10;
            finishReveal();
          }
        }
      }

      // Auto gentle pulse every 8 seconds
      if (t - lastAutoPulse > 8.0) {
        lastAutoPulse = t;
        pulseStartRef.current = t;
      }

      const pulseElapsed = t - pulseStartRef.current;
      if (pulseElapsed >= 0 && pulseElapsed <= 1.35) {
        uniforms.uPulse.value = pulseElapsed / 1.35;
      } else {
        uniforms.uPulse.value = 0;
      }

      if (mode === 'hero' && !reduced) {
        const targetYaw = pointerYaw.current * 0.24;
        const yaw = card ? t * 0.2 : Math.sin(t * 0.43) * 0.18;
        rootGroup.rotation.y += (0.38 + yaw + targetYaw - rootGroup.rotation.y) * 0.05;
      } else if (controls) {
        controls.update();
      }

      composer.render(dt);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      if (mode === 'hero') {
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerleave', onPointerLeave);
      }
      controls?.dispose();
      draco.dispose();
      for (const g of disposableGeometries) g.dispose();
      for (const m of disposableMaterials) m.dispose();
      for (const texture of textures) texture.dispose();
      shadow.geometry.dispose();
      shadow.material.dispose();
      bloom.dispose();
      output.dispose();
      composer.dispose();
      environment.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [sign, mode, heroFraming, spec.modelUrl, spec.accentHex]);

  return (
    <div className={`zodiac-stage zodiac-stage-${mode}${dissolving ? ' is-dissolving' : ''}`}>
      <canvas ref={particleRef} className="zodiac-particles" aria-hidden="true" />
      <div ref={containerRef} className="zodiac-webgl" role={loaded ? "img" : undefined} aria-label={loaded ? t(spec.nameEn, spec.nameCn) : undefined}/>

      {(!loaded || failed) && spec.previewUrl && (
        <div className="zodiac-preview-fallback">
          <img src={spec.previewUrl} alt={`${t(spec.nameEn, spec.nameCn)} · ${spec.cryptoTheme}`} />
          {!failed && (
            <div className="zodiac-loading-bar" role="status" aria-label={t("Loading the 3D zodiac model", "正在加载 3D 生肖模型")}>
              <span style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
