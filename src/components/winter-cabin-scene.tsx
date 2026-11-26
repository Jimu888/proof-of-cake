'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useLanguage } from '../lib/i18n';
import { renderSnowflakeSprite } from './snowflake-art';

type View = 'forest' | 'cabin' | 'window';
const views = ['forest', 'cabin', 'window'] as const;
const position = { forest: [0, 2.3, 12], cabin: [-0.3, 1.48, 1.25], window: [1.24, 1.48, -1.35] } as const;
const target = { forest: [0, 1.3, 0], cabin: [0, 1.3, -3], window: [1.27, 1.55, -11] } as const;

function createCabin(host: HTMLDivElement, seed: string, changeView: (view: View) => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2('#111d30', 0.052);
  const camera = new THREE.PerspectiveCamera(46, 1, 0.035, 90);
  camera.position.set(...position.forest);
  const aim = new THREE.Vector3(...target.forest);
  const destination = new THREE.Vector3();
  const gaze = new THREE.Vector3();
  const pointer = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const clock = new THREE.Timer();
  clock.connect(document);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const textures = new Set<THREE.Texture>();

  const material = (color: string, flat = false) => flat ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color });
  const wood = material('#493126'), beams = material('#251c19'), snow = material('#9badc5');
  const amber = material('#efb373', true), iron = material('#282227'), pine = material('#1a303c');
  const glass = new THREE.MeshBasicMaterial({ color: '#9fc6f4', transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide });
  function box(w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }
  scene.add(new THREE.HemisphereLight('#9db9f0', '#584540', 1.7));
  const moon = new THREE.DirectionalLight('#a6bdf5', 0.85);
  moon.position.set(-7, 10, -8);
  scene.add(moon);
  const hearth = new THREE.PointLight('#ff994f', 9, 7);
  hearth.position.set(-1.4, 0.82, -2.54);
  scene.add(hearth);
  const doorGlow = new THREE.PointLight('#ffab61', 12, 7);
  doorGlow.position.set(0, 1.2, 2.95);
  scene.add(doorGlow);
  box(110, 0.3, 110, 0, -0.22, 0, snow);
  const bark = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), beams, 38);
  const branches = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6), pine, 119);
  const caps = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 6), snow, 119);
  const stamp = new THREE.Object3D();
  function place(batch: THREE.InstancedMesh, index: number, x: number, y: number, z: number, w: number, h: number, d: number) {
    stamp.position.set(x, y, z);
    stamp.scale.set(w, h, d);
    stamp.updateMatrix();
    batch.setMatrixAt(index, stamp.matrix);
  }
  for (let i = 0; i < 38; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (3.7 + (i * 1.79) % 16);
    const z = 11 - ((i * 4.31) % 38);
    const height = 1.85 + (i * 0.81) % 3.4;
    place(bark, i, x, height / 2, z, .15, height, .15);
    for (let j = 0; j < 3; j++) {
      const radius = height * (0.24 - j * 0.05);
      const y = height * (0.47 + j * 0.19);
      place(branches, i * 3 + j, x, y, z, radius, height * .54, radius);
      place(caps, i * 3 + j, x, y + height * .08, z, radius * .75, height * .41, radius * .75);
    }
  }
  for (let i = 0; i < 5; i++) {
    const x = i * 1.46 - 2.92;
    const y = 1.5 + (i % 3) / 2;
    const z = -9 - i % 2 * 3;
    place(branches, 114 + i, x, y, z, .95, 3 + i % 3, .95);
    place(caps, 114 + i, x, y + .35, z, .74, 2.5 + i % 3, .74);
  }
  scene.add(bark, branches, caps);

  box(5.8, 0.22, 5.8, 0, 0.03, -0.35, wood);
  box(0.24, 2.85, 5.8, -2.73, 1.48, -0.35, wood);
  box(0.24, 2.85, 5.8, 2.73, 1.48, -0.35, wood);
  for (const x of [-1.68, 1.68]) {
    box(2.16, 2.85, 0.23, x, 1.48, 2.55, wood);
    box(0.99, 0.82, 0.07, x, 1.65, 2.7, amber);
    box(0.065, 0.85, 0.08, x, 1.65, 2.75, beams);
    box(1.03, 0.065, 0.08, x, 1.65, 2.75, beams);
  }
  box(1.22, 0.72, 0.23, 0, 2.54, 2.55, wood);
  const door = box(1.14, 2.12, 0.09, 0, 1.19, 2.58, beams);
  const doorPanel = box(0.89, 1.91, 0.025, 0, 1.19, 2.64, amber);
  box(5.35, 0.68, 0.24, 0, 0.45, -3.13, wood);
  box(5.35, 0.53, 0.24, 0, 2.61, -3.13, wood);
  box(2.72, 1.89, 0.24, -1.31, 1.68, -3.13, wood);
  box(0.42, 1.89, 0.24, 2.48, 1.68, -3.13, wood);
  const windowPane = box(2.23, 1.56, 0.035, 1.18, 1.56, -3.13, glass);
  for (const x of [0.055, 1.18, 2.31]) box(0.075, 1.63, 0.09, x, 1.56, -3.09, beams);
  for (const y of [0.76, 1.56, 2.35]) box(2.31, 0.075, 0.09, 1.18, y, -3.09, beams);
  box(1.95, 0.19, 0.62, 1.18, 0.52, -2.68, wood);
  box(1.72, 0.11, 0.53, 1.18, 0.67, -2.68, material('#564f58'));
  for (const side of [-1, 1]) {
    const cover = box(3.52, 0.25, 6.37, side * 1.48, 3.26, -0.3, beams);
    cover.rotation.z = -side * 0.4;
    const roofSnow = box(3.52, 0.11, 6.37, side * 1.52, 3.43, -0.3, snow);
    roofSnow.rotation.z = -side * 0.4;
  }
  const triangle = new THREE.Shape();
  triangle.moveTo(-2.77, 2.85);
  triangle.lineTo(0, 3.92);
  triangle.lineTo(2.77, 2.85);
  triangle.closePath();
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(triangle, { depth: .17, bevelEnabled: false }), wood);
  gable.position.z = 2.45;
  scene.add(gable);
  box(0.45, 1.5, 0.46, -1.48, 3.8, -2.88, iron);
  const fireplace = box(1.42, 1.18, 0.43, -1.45, 0.72, -2.87, iron);
  box(1.62, 0.12, 0.55, -1.45, 1.34, -2.82, wood);
  box(0.94, 0.69, 0.025, -1.45, 0.6, -2.64, material('#120e13', true));
  const flames = Array.from({ length: 6 }, (_, i) => {
    const shape = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), material(i % 2 ? '#ffad55' : '#da613c', true));
    shape.position.set(-1.76 + i * 0.124, 0.43, -2.58 + (i % 3) * 0.028);
    scene.add(shape);
    return shape;
  });
  const embers = Array.from({ length: 12 }, (_, i) => {
    const spark = box(0.014, 0.014, 0.014, -1.45 + (i % 4 - 1.5) * 0.13, 0.5, -2.54, amber);
    return spark;
  });

  const image = renderSnowflakeSprite(seed, 192);
  const texture = new THREE.CanvasTexture(image);
  textures.add(texture);
  const softCanvas = document.createElement('canvas');
  softCanvas.width = softCanvas.height = 192;
  const soft = softCanvas.getContext('2d');
  if (soft) { soft.filter = 'blur(4px)'; soft.drawImage(image, 0, 0); }
  const softTexture = new THREE.CanvasTexture(softCanvas);
  textures.add(softTexture);
  const flakes = Array.from({ length: 108 }, (_, index) => {
    const layer = Math.floor(index / 36);
    const mat = new THREE.SpriteMaterial({ map: layer === 2 ? texture : softTexture, opacity: 0.35 + layer * 0.24, depthWrite: false });
    const item = new THREE.Sprite(mat);
    const size = 0.07 + (index % 7) * 0.014 + layer * 0.025;
    item.scale.setScalar(size);
    const x = ((index * 2.739) % 16) - 8;
    const z = index % 3 === 0 ? 3.05 + (index * 1.31 % 8) : -3.33 - (index * 1.73 % 15);
    item.position.set(x, (index * 1.676) % 8, z);
    scene.add(item);
    return { item, mat, x, y: item.position.y, speed: 0.32 + layer * 0.18, phase: index * 1.829 };
  });
  const frost = [0.63, 1.68].map((x, i) => {
    const item = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    item.position.set(x, 1.44 + i * 0.48, -3.05);
    scene.add(item);
    return item;
  });

  let view: View = 'forest';
  let boost = 0;
  let frame = 0;
  const point = (event: PointerEvent) => {
    const bounds = host.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
  };
  const resetPointer = () => pointer.set(0, 0);
  const click = (event: PointerEvent) => {
    point(event);
    ray.setFromCamera(pointer, camera);
    const objects = view === 'forest' ? [doorPanel, door] : [fireplace, windowPane];
    const hit = ray.intersectObjects(objects)[0]?.object;
    if (hit === doorPanel || hit === door) changeView('cabin');
    if (hit === windowPane) changeView(view === 'window' ? 'cabin' : 'window');
    if (hit === fireplace) stoke();
  };
  function stoke() { boost = 1; }
  host.addEventListener('pointermove', point);
  host.addEventListener('pointerleave', resetPointer);
  host.addEventListener('pointerup', click);
  const resize = new ResizeObserver(() => {
    const { clientWidth: w, clientHeight: h } = host;
    if (w && h) { camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
  });
  resize.observe(host);

  function draw(time: number) {
    clock.update(time);
    const dt = Math.min(0.05, clock.getDelta());
    const t = reduce.matches ? 0 : clock.getElapsed();
    const damping = reduce.matches ? 1 : 1 - Math.exp(-dt * 2.35);
    destination.fromArray(position[view]);
    if (view === 'forest' && !reduce.matches) { destination.x += pointer.x * 0.55; destination.y += pointer.y * 0.27; }
    gaze.fromArray(target[view]);
    camera.position.lerp(destination, damping);
    aim.lerp(gaze, damping);
    camera.lookAt(aim);
    const open = view !== 'forest' || camera.position.z < 3.15;
    door.visible = doorPanel.visible = !open;
    doorGlow.intensity = open ? 3.5 : 12;

    for (const { item, mat, x, y, speed, phase } of flakes) {
      item.position.y = ((y - t * speed) % 8 + 8) % 8;
      item.position.x = x + Math.sin(t * 0.55 + phase) * 0.43;
      mat.rotation = phase + t * (0.26 + speed * 0.18);
    }
    frost.forEach((item, i) => {
      const cycle = (t + i * 6) % 15;
      item.material.opacity = view === 'window' && cycle < 4.5 ? Math.min(1, cycle * 2, (4.5 - cycle) / 2) : 0;
      item.scale.setScalar(0.15 + Math.min(cycle, 4.5) * -0.011);
    });
    boost = Math.max(0, boost - dt * 0.28);
    hearth.intensity = 8.2 + Math.sin(t * 8) * 1.05 + boost * 12;
    flames.forEach((item, i) => {
      item.scale.set(0.53, 1 + Math.sin(t * 7 + i * 2) * 0.34 + boost * 0.75, 0.55);
      item.rotation.z = Math.sin(t * 4 + i) * 0.25;
    });
    embers.forEach((spark, i) => {
      const phase = (t * (0.56 + boost * 0.3) + i * 0.19) % 1;
      spark.position.y = 0.53 + phase * (0.48 + boost * 0.42);
      spark.scale.setScalar((1 - phase) * (0.65 + boost));
    });
    renderer.render(scene, camera);
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
  return {
    move(next: View) { view = next; }, stoke,
    dispose() {
      cancelAnimationFrame(frame);
      clock.dispose();
      resize.disconnect();
      host.removeEventListener('pointermove', point);
      host.removeEventListener('pointerleave', resetPointer);
      host.removeEventListener('pointerup', click);
      const materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.InstancedMesh) object.dispose();
        if (object instanceof THREE.Mesh) { object.geometry.dispose(); materials.add(object.material); }
        if (object instanceof THREE.Sprite) materials.add(object.material);
      });
      materials.forEach(mat => mat.dispose());
      textures.forEach(map => map.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

function cabinAudio() {
  const context = new AudioContext();
  const wind = context.createGain();
  const fire = context.createGain();
  const rate = context.sampleRate;
  const buffer = context.createBuffer(2, rate * 5, rate);
  const windSamples = buffer.getChannelData(0), fireSamples = buffer.getChannelData(1);
  let smooth = 0, tick = 0;
  for (let i = 0; i < windSamples.length; i++) {
    const noise = Math.random() * 2 - 1;
    smooth = smooth * .991 + noise * .009;
    if (Math.random() < .00029) tick = .8;
    const envelope = Math.min(1, i / 2000, (windSamples.length - 1 - i) / 2000);
    windSamples[i] = smooth * (.72 + .22 * Math.sin(i / rate * 1.25)) * envelope;
    fireSamples[i] = (smooth * .12 + noise * tick) * envelope;
    tick *= .985;
  }
  const channels = context.createChannelSplitter(2);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(channels);
  channels.connect(wind, 0); channels.connect(fire, 1);
  wind.gain.value = fire.gain.value = 0;
  wind.connect(context.destination); fire.connect(context.destination);
  source.start();
  return {
    set(view: View, enabled: boolean) {
      wind.gain.setTargetAtTime(!enabled ? 0 : view === 'forest' ? .37 : .06, context.currentTime, .3);
      fire.gain.setTargetAtTime(enabled && view !== 'forest' ? .10 : 0, context.currentTime, .3);
      if (enabled) void context.resume().catch(() => {});
    },
    close() { void context.close().catch(() => {}); },
  };
}

export default function WinterCabin({ seed, onClose }: { seed: string; onClose: () => void }) {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createCabin> | null>(null);
  const audio = useRef<ReturnType<typeof cabinAudio>>(null);
  const [sound, setSound] = useState(false);
  const [view, setView] = useState<View>('forest');
  const [error, setError] = useState(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    if (!surface.current) return;
    try {
      const current = createCabin(surface.current, seed, setView);
      scene.current = current;
      return () => { current.dispose(); scene.current = null; };
    } catch { setError(true); }
  }, [seed]);
  useEffect(() => { scene.current?.move(view); audio.current?.set(view, sound); }, [view, sound]);
  useEffect(() => () => audio.current?.close(), []);
  function toggleSound() {
    try {
      audio.current ??= cabinAudio();
      audio.current.set(view, !sound);
      setSound(!sound);
    } catch { setSound(false); }
  }

  return <dialog ref={dialog} className="winter-cabin" aria-label={t('Winter Cabin', '冬日木屋')}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="winter-cabin-surface" ref={surface}/>
    <button type="button" className="winter-cabin-return boutique-link" onClick={onClose}>{t('← Return to Snowflake', '← 返回雪花藏品')}</button>
    {!error && <button type="button" className="winter-cabin-audio boutique-link" aria-pressed={sound} onClick={toggleSound}>
      {sound ? t('Sound on', '环境音开启') : t('Sound off', '环境音关闭')}
    </button>}
    {error && <p role="status" className="winter-cabin-error">{t('The cabin needs WebGL to open.', '木屋需要 WebGL 才能开启。')}</p>}
    {!error && <nav className="winter-cabin-nav" aria-label={t('Cabin viewpoints', '木屋视角')}>
      {views.map(node => <button key={node} type="button" aria-pressed={view === node} onClick={() => setView(node)}>
        {{ forest: t('Pine Forest', '松林'), cabin: t('Cabin', '室内'), window: t('Window Seat', '窗边') }[node]}
      </button>)}
      {view === 'cabin' && <button type="button" onClick={() => scene.current?.stoke()}>{t('Stoke fire', '添柴')}</button>}
    </nav>}
  </dialog>;
}
