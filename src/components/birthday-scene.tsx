'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

export default function BirthdayScene({assetBase='/birthday/',onReady}:{assetBase?:string;onReady?:()=>void}){
 const host=useRef<HTMLDivElement>(null),frameHost=useRef<HTMLDivElement>(null),readyCallback=useRef(onReady);
 const api=useRef<{angle:(n:number)=>void;reset:()=>void}|null>(null);
 const [state,setState]=useState<'loading'|'ready'|'error'|'unsupported'>('loading'),[progress,setProgress]=useState(0),[attempt,setAttempt]=useState(0),[angle,setAngle]=useState(0),[fullscreen,setFullscreen]=useState(false);
 useEffect(()=>{readyCallback.current=onReady},[onReady]);
 useEffect(()=>{
  const el=host.current;if(!el)return;setState('loading');setProgress(0);let dead=false,frame=0,visible=true,model:THREE.Group|null=null;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch{setState('unsupported');return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),target=new THREE.Vector3(.6577835083,1.2803816795,.8092823029),camera=new THREE.PerspectiveCamera(32.1334948749,1,.05,150);camera.position.set(7.295445919,4.099999905,11.625529289);camera.lookAt(target);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(target);controls.enableZoom=false;controls.enablePan=false;controls.enableDamping=false;controls.rotateSpeed=.45;controls.update();
  const homeTheta=controls.getAzimuthalAngle(),homePhi=controls.getPolarAngle(),radius=camera.position.distanceTo(target),limit=THREE.MathUtils.degToRad(15);
  controls.minAzimuthAngle=homeTheta-limit;controls.maxAzimuthAngle=homeTheta+limit;controls.minPolarAngle=homePhi;controls.maxPolarAngle=homePhi;controls.minDistance=radius;controls.maxDistance=radius;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.3;room.dispose();pmrem.dispose();scene.add(new THREE.HemisphereLight(0x7188c4,0x382820,1.3));
  const key=new THREE.DirectionalLight(0xffbc70,3);key.position.set(1,5,-4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-5,right:5,top:6,bottom:-6,near:.1,far:25});key.shadow.bias=-.00015;key.shadow.normalBias=.02;scene.add(key);
  const fill=new THREE.DirectionalLight(0x8aa6ed,1.1);fill.position.set(-4,5,5);scene.add(fill);const rim=new THREE.DirectionalLight(0xffc67c,1.5);rim.position.set(-3,4,-.2);scene.add(rim);
  function draw(){frame=0;if(dead||!visible)return;renderer.render(scene,camera);const deg=THREE.MathUtils.radToDeg(controls.getAzimuthalAngle()-homeTheta);setAngle(Math.round(deg*10)/10);}
  function requestDraw(){if(!dead&&!frame)frame=requestAnimationFrame(draw)}
  controls.addEventListener('change',requestDraw);
  function setView(value:number){const a=homeTheta+THREE.MathUtils.degToRad(Math.max(-15,Math.min(15,value)));camera.position.copy(new THREE.Vector3().setFromSpherical(new THREE.Spherical(radius,homePhi,a)).add(target));controls.update();requestDraw()}
  api.current={angle:setView,reset:()=>setView(0)};
  const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(32.1334948749*1.08)/2)/Math.min(camera.aspect,1)));camera.updateProjectionMatrix();requestDraw()});resize.observe(el);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestDraw()});observer.observe(el);
  const draco=new DRACOLoader();draco.setDecoderPath(assetBase+'draco/');draco.setWorkerLimit(2);const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  function disposeModel(object:THREE.Object3D){const geometry=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();object.traverse(o=>{if(o instanceof THREE.Mesh){geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v instanceof THREE.Texture)textures.add(v);}}});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
  loader.load(assetBase+'birthday.glb',gltf=>{
   if(dead){disposeModel(gltf.scene);return;}model=gltf.scene;model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;for(const m of (Array.isArray(o.material)?o.material:[o.material]) as THREE.MeshStandardMaterial[]){if(/shrub|grass|nettle|rooibos/i.test(m.name)){m.alphaTest=.35;m.transparent=false;m.side=THREE.DoubleSide;m.roughness=.9;m.color.setRGB(.72,.86,.65);}if(/woven|canvas|cloth|jacket|shirt/i.test(m.name))m.roughness=.86;if(m.map)m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}}});scene.add(model);setProgress(100);setState('ready');requestDraw();readyCallback.current?.();
  },e=>{if(!dead&&e.total)setProgress(Math.min(99,Math.round(e.loaded/e.total*100)))},()=>{if(!dead)setState('error')});
  const lost=(e:Event)=>{e.preventDefault();if(!dead)setState('unsupported')};renderer.domElement.addEventListener('webglcontextlost',lost);
  return()=>{dead=true;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();controls.dispose();draco.dispose();if(model)disposeModel(model);env.dispose();key.shadow.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.dispose();renderer.domElement.remove();api.current=null;};
 },[assetBase,attempt]);
 useEffect(()=>{const change=()=>setFullscreen(document.fullscreenElement===frameHost.current);document.addEventListener('fullscreenchange',change);return()=>document.removeEventListener('fullscreenchange',change)},[]);
 async function toggleFullscreen(){if(document.fullscreenElement){await document.exitFullscreen();return;}if(frameHost.current?.requestFullscreen){try{await frameHost.current.requestFullscreen();return;}catch{}}setFullscreen(v=>!v)}
 return <div className={'birthday-viewer '+(fullscreen?'is-expanded':'')} ref={frameHost} data-model-state={state} onKeyDown={e=>{if(e.key==='Escape'&&!document.fullscreenElement)setFullscreen(false)}}>
  <div className="birthday-viewer-sky" aria-hidden="true"/>
  <div className="birthday-canvas" ref={host} role="region" tabIndex={0} aria-label="生日三维作品，左右拖动或按左右方向键查看" onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();api.current?.angle(angle+(e.key==='ArrowRight'?2:-2));}if(e.key==='Escape')setFullscreen(false)}}/>
  {state==='loading'&&<div className="birthday-load" role="status"><img className="birthday-loading-poster" src={assetBase+'poster.png'} alt=""/><span className="load-orbit"/><p>正在打开这个小世界</p><div className="model-progress"><span style={{width:progress+'%'}}/></div><small>{progress?progress+'%':'准备中…'}</small></div>}
  {(state==='error'||state==='unsupported')&&<div className="birthday-load birthday-fallback" role="alert"><img src={assetBase+'poster.png'} alt="生日三维作品的静态预览"/><p>{state==='unsupported'?'这个浏览器暂时无法展示三维作品':'作品还没有加载完成'}</p><small>{state==='unsupported'?'请尝试用 Safari 或 Chrome 打开。':'检查网络后，再试一次。'}</small><button className="button outline" onClick={()=>setAttempt(v=>v+1)}>重新加载</button></div>}
  {state==='ready'&&<div className="birthday-viewer-controls"><div className="angle-control"><span>左右轻拖，看看这段旅程</span><input type="range" min="-15" max="15" step=".5" value={angle} aria-label="查看角度" aria-valuetext={`${angle} 度`} onChange={e=>api.current?.angle(Number(e.target.value))}/></div><div className="model-actions"><button onClick={()=>api.current?.reset()}>复位</button><button onClick={toggleFullscreen}>{fullscreen?'退出全屏':'全屏欣赏'} <span aria-hidden="true">⤢</span></button></div></div>}
 </div>;
}
