'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getZodiacById, type ActiveZodiacId, type ZodiacFilter } from '../domain/zodiac';

export type ZodiacStageProps = {
  sign: ActiveZodiacId;
  mode: 'hero' | 'studio';
  filter?: ZodiacFilter;
  motionEnabled?: boolean;
  unsealNonce?: number;
  pulseNonce?: number;
  onReady?: () => void;
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
          col = col * 1.08 + uAccent * (fresnel * 0.24);
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
          col += uAccent * (band * 0.72);
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
  filter = 'original',
  motionEnabled = true,
  unsealNonce = 0,
  pulseNonce = 0,
  onReady,
}: ZodiacStageProps) {
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
  const pointerTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let rafId = 0;
    let width = 0;
    let height = 0;

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      char?: string;
      wick?: number;
    };

    const count = mode === 'hero' ? 20 : 34;
    const particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const resetParticle = (p: Particle, initial: boolean) => {
      if (sign === 'goat') {
        p.x = Math.random() * width;
        p.y = initial ? Math.random() * height : -16;
        p.vx = (Math.random() - 0.5) * 0.14;
        p.vy = 0.25 + Math.random() * 0.35;
        p.size = 4 + Math.random() * 5;
        p.alpha = 0.14 + Math.random() * 0.24;
      } else if (sign === 'horse') {
        p.x = initial ? Math.random() * width : width + 30;
        p.y = Math.random() * height;
        p.vx = -(1.4 + Math.random() * 1.9);
        p.vy = 0.25 + Math.random() * 0.35;
        p.size = 18 + Math.random() * 34;
        p.alpha = 0.12 + Math.random() * 0.22;
      } else if (sign === 'ox') {
        p.x = Math.random() * width;
        p.y = initial ? Math.random() * height : height + 24;
        p.vx = 0;
        p.vy = -(0.28 + Math.random() * 0.38);
        p.size = 8 + Math.random() * 12;
        p.wick = 5 + Math.random() * 8;
        p.alpha = 0.16 + Math.random() * 0.22;
      } else {
        p.x = Math.random() * width;
        p.y = initial ? Math.random() * height : height + 16;
        p.vx = (Math.random() - 0.5) * 0.12;
        p.vy = -(0.22 + Math.random() * 0.32);
        p.size = 10 + Math.random() * 4;
        p.char = Math.random() > 0.5 ? '1' : '0';
        p.alpha = 0.14 + Math.random() * 0.24;
      }
    };

    resize();
    for (let i = 0; i < count; i++) {
      const p: Particle = { x: 0, y: 0, vx: 0, vy: 0, size: 6, alpha: 0.2 };
      resetParticle(p, true);
      particles.push(p);
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (sign === 'goat') {
          if (p.y > height + 20) resetParticle(p, false);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.strokeStyle = `rgba(245, 200, 108, ${p.alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.72, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.72, 0);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        } else if (sign === 'horse') {
          if (p.x < -60 || p.y > height + 40) resetParticle(p, false);
          const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.size, p.y - p.size * 0.2);
          grad.addColorStop(0, `rgba(125, 211, 252, ${p.alpha})`);
          grad.addColorStop(1, 'rgba(125, 211, 252, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.size, p.y - p.size * 0.2);
          ctx.stroke();
        } else if (sign === 'ox') {
          if (p.y < -30) resetParticle(p, false);
          const w = 3.5;
          const wick = p.wick ?? 6;
          ctx.strokeStyle = `rgba(52, 211, 153, ${p.alpha * 0.85})`;
          ctx.fillStyle = `rgba(52, 211, 153, ${p.alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - wick);
          ctx.lineTo(p.x, p.y + p.size + wick);
          ctx.stroke();
          ctx.fillRect(p.x - w / 2, p.y, w, p.size);
        } else {
          if (p.y < -20) resetParticle(p, false);
          ctx.fillStyle = `rgba(232, 196, 116, ${p.alpha})`;
          ctx.font = `${Math.round(p.size)}px ui-monospace, Menlo, monospace`;
          ctx.fillText(p.char ?? '1', p.x, p.y);
        }
      }
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [sign, mode]);

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
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.25, mode === 'hero' ? 4.9 : 5.1);

    // Three-point gallery lighting to keep obsidian facets sculptural and legible
    const ambient = new THREE.AmbientLight(0xdbe6ff, 0.72);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.05);
    keyLight.position.set(3.2, 5.4, 4.8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa5d8ff, 1.55);
    rimLight.position.set(-4.2, 3.2, -4.5);
    scene.add(rimLight);

    const warmFill = new THREE.PointLight(0xf5c86c, 2.2, 14);
    warmFill.position.set(2.4, -1.6, 3.2);
    scene.add(warmFill);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    let controls: OrbitControls | null = null;
    if (mode === 'studio') {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.enablePan = false;
      controls.minDistance = 2.9;
      controls.maxDistance = 8.4;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.65;
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const onPointerMove = (event: PointerEvent) => {
      if (mode !== 'hero') return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      pointerTargetRef.current = { x: THREE.MathUtils.clamp(nx, -1, 1), y: THREE.MathUtils.clamp(ny, -1, 1) };
    };
    const onPointerLeave = () => {
      pointerTargetRef.current = { x: 0, y: 0 };
    };
    if (mode === 'hero') {
      container.addEventListener('pointermove', onPointerMove);
      container.addEventListener('pointerleave', onPointerLeave);
    }

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('/birthday/draco/');
    loader.setDRACOLoader(draco);

    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableMaterials: THREE.Material[] = [];

    loader.load(
      spec.modelUrl,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const targetSize = mode === 'hero' ? 2.45 : 2.55;
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
          disposableGeometries.push(nextGeo);

          if (Array.isArray(obj.material)) {
            obj.material = obj.material.map((m) => {
              const patched = patchZodiacMaterial(m, uniforms, sign);
              disposableMaterials.push(patched);
              return patched;
            });
          } else if (obj.material) {
            const patched = patchZodiacMaterial(obj.material, uniforms, sign);
            obj.material = patched;
            disposableMaterials.push(patched);
          }
        });

        rootGroup.add(model);
        setProgress(100);
        setLoaded(true);

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (mode === 'studio' && !reduced) {
          unsealStartRef.current = uniforms.uTime.value;
          uniforms.uUnseal.value = 0;
        } else {
          unsealStartRef.current = -10;
          uniforms.uUnseal.value = 1;
        }
        pulseStartRef.current = uniforms.uTime.value + 0.6;
        onReady?.();
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
      },
    );

    const clock = new THREE.Clock();
    let lastAutoPulse = 0;

    const animate = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      uniforms.uTime.value += dt;
      const t = uniforms.uTime.value;

      // Unseal timeline (1.75s)
      if (unsealStartRef.current >= 0) {
        const elapsed = t - unsealStartRef.current;
        if (elapsed >= 0) {
          uniforms.uUnseal.value = Math.min(1, elapsed / 1.75);
          if (elapsed >= 1.8) unsealStartRef.current = -10;
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

      if (mode === 'hero') {
        const targetYaw = pointerTargetRef.current.x * 0.24;
        const targetPitch = pointerTargetRef.current.y * 0.14;
        rootGroup.rotation.y += (t * 0.22 + targetYaw - rootGroup.rotation.y) * 0.05;
        rootGroup.rotation.x += (targetPitch - rootGroup.rotation.x) * 0.05;
      } else if (controls) {
        controls.update();
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
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
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [sign, mode, spec.modelUrl, spec.accentHex, onReady]);

  return (
    <div className={`zodiac-stage zodiac-stage-${mode}`}>
      <canvas ref={particleRef} className="zodiac-particles" aria-hidden="true" />
      <div ref={containerRef} className="zodiac-webgl" />

      {(!loaded || failed) && spec.previewUrl && (
        <div className="zodiac-preview-fallback">
          <img src={spec.previewUrl} alt={`${spec.nameCn} · ${spec.cryptoTheme}`} />
          {!failed && (
            <div className="zodiac-loading-bar" role="status" aria-label="正在加载 3D 生肖模型">
              <span style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
