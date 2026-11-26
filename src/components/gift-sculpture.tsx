'use client';
import {useEffect,useRef,useState} from 'react';
import {useLanguage} from '../lib/i18n';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

/** A real, procedural mesh. The artwork inside remains a separate media asset. */
export default function GiftSculpture({opening=false}:{opening?:boolean}){
 const {t}=useLanguage();
 const host=useRef<HTMLDivElement>(null), open=useRef(opening), actions=useRef<{rotate:(n:number)=>void;reset:()=>void}|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'fallback'>('loading');
 useEffect(()=>{open.current=opening},[opening]);
 useEffect(()=>{
  const el=host.current;if(!el)return;
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{setStatus('fallback');return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,40);camera.position.set(3.7,2.8,4.8);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.2,0);controls.enablePan=false;controls.enableZoom=false;controls.minPolarAngle=.3;controls.maxPolarAngle=Math.PI-.3;controls.update();
  const model=new THREE.Group();scene.add(model);
  const loader=new THREE.TextureLoader();let disposed=false;
  const texture=loader.load('/cryptogift/obsidian-texture.png',()=>{if(!disposed)draw()});texture.colorSpace=THREE.SRGBColorSpace;
  const stone=new THREE.MeshStandardMaterial({color:0x555555,map:texture,metalness:.56,roughness:.28});
  const gold=new THREE.MeshStandardMaterial({color:0xe6b863,metalness:1,roughness:.23});
  const inside=new THREE.MeshStandardMaterial({color:0x16140f,metalness:.5,roughness:.45});
  const geometries:THREE.BufferGeometry[]=[];
  function box(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,parent:THREE.Group=model){const g=new RoundedBoxGeometry(w,h,d,3,.025);geometries.push(g);const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);parent.add(m);return m;}
  // A hollow box with four walls and a base lets the lifted lid reveal its interior.
  box(1.8,.12,1.8,0,-.72,0,stone);box(1.8,1.5,.11,0,0,.845,stone);box(1.8,1.5,.11,0,0,-.845,stone);box(.11,1.5,1.58,.845,0,0,stone);box(.11,1.5,1.58,-.845,0,0,stone);box(1.57,.03,1.57,0,-.64,0,inside);
  box(.22,1.52,.025,0,0,.907,gold);box(.22,1.52,.025,0,0,-.907,gold);box(.025,1.52,.22,.907,0,0,gold);box(.025,1.52,.22,-.907,0,0,gold);box(.22,.025,1.81,0,-.79,0,gold);box(1.81,.025,.22,0,-.79,0,gold);
  const lid=new THREE.Group();lid.position.y=.88;model.add(lid);box(1.92,.22,1.92,0,0,0,stone,lid);box(.23,.025,1.94,0,.124,0,gold,lid);box(1.94,.025,.23,0,.124,0,gold,lid);box(.23,.23,.025,0,0,.976,gold,lid);box(.23,.23,.025,0,0,-.976,gold,lid);box(.025,.23,.23,.976,0,0,gold,lid);box(.025,.23,.23,-.976,0,0,gold,lid);
  // Swept flat strips form the bow; unlike the PNG these have a back and side.
  function ribbon(points:THREE.Vector3[]){const curve=new THREE.CatmullRomCurve3(points);const positions:number[]=[],indices:number[]=[];for(let i=0;i<=60;i++){const t=i/60,p=curve.getPoint(t),tangent=curve.getTangent(t);const side=new THREE.Vector3().crossVectors(tangent,new THREE.Vector3(0,0,1)).normalize().multiplyScalar(.09);positions.push(...p.clone().add(side).toArray(),...p.clone().sub(side).toArray());if(i<60){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();geometries.push(g);const mat=gold.clone();mat.side=THREE.DoubleSide;const m=new THREE.Mesh(g,mat);lid.add(m);return mat;}
  const ribbonMats:THREE.Material[]=[];for(const sign of [-1,1])ribbonMats.push(ribbon([new THREE.Vector3(0,.2,0),new THREE.Vector3(sign*.45,.65,-.04),new THREE.Vector3(sign*.72,.43,.05),new THREE.Vector3(sign*.37,.19,.16),new THREE.Vector3(0,.2,0)]));box(.25,.16,.23,0,.23,0,gold,lid);
  const key=new THREE.DirectionalLight(0xffdfaa,5);key.position.set(3,5,4);scene.add(key);const rim=new THREE.DirectionalLight(0xe8edff,3);rim.position.set(-4,2,-3);scene.add(rim);const glow=new THREE.PointLight(0xffb344,0,5);glow.position.set(0,.3,0);scene.add(glow);
  let frame=0,start=0,inView=true;
  function draw(){if(!disposed&&inView)renderer.render(scene,camera);}
  function animate(time:number){frame=0;if(disposed)return;if(open.current){if(!start)start=time;const t=Math.min((time-start)/1350,1),e=1-Math.pow(1-t,3);lid.position.y=.88+e*1.4;lid.rotation.z=-.23*e;lid.rotation.x=-.25*e;glow.intensity=7*e;draw();if(t<1)frame=requestAnimationFrame(animate);}else{start=0;lid.position.y=.88;lid.rotation.set(0,0,0);glow.intensity=0;draw();}}
  function change(){draw();}
  controls.addEventListener('change',change);
  actions.current={rotate:(n)=>{model.rotation.y+=n;draw()},reset:()=>{model.rotation.y=0;camera.position.set(3.7,2.8,4.8);controls.target.set(0,.2,0);controls.update();draw()}};
  const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);draw()});resize.observe(el);
  const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)draw()});observer.observe(el);
  const event=()=>{if(!frame)frame=requestAnimationFrame(animate)};el.addEventListener('gift-open',event);
  const lost=(e:Event)=>{e.preventDefault();setStatus('fallback')};renderer.domElement.addEventListener('webglcontextlost',lost);
  setStatus('ready');draw();
  return()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();el.removeEventListener('gift-open',event);renderer.domElement.removeEventListener('webglcontextlost',lost);controls.dispose();geometries.forEach(g=>g.dispose());[stone,gold,inside,...ribbonMats].forEach(m=>m.dispose());texture.dispose();env.dispose();renderer.dispose();renderer.domElement.remove();actions.current=null};
 },[]);
 useEffect(()=>{host.current?.dispatchEvent(new Event('gift-open'))},[opening,status]);
 return <div className="sculpture" data-renderer={status}>
  <div ref={host} className="sculpture-canvas" role={status==='ready' ? 'img' : undefined}
    aria-label={status==='ready' ? t('Rotatable 3D obsidian gift box', '可旋转的三维黑曜石礼盒') : undefined}/>
  {status!=='ready'&&<div className="sculpture-fallback"><img src="/cryptogift/gift.png" alt={t('Obsidian gift box', '黑曜石礼盒')}/><span>{status==='loading' ? t('Preparing the 3D gift box…', '正在准备三维礼盒…') : t('3D display is unavailable on this device. Showing the gift box image.', '此设备暂不支持三维显示，已显示礼盒图片。')}</span></div>}
  {status==='ready'&&!opening&&<div className="sculpture-controls"><span>{t('Drag or swipe to rotate', '拖动旋转 · 触屏可拖动')}</span><div><button aria-label={t('Rotate gift box left', '向左旋转礼盒')} onClick={()=>actions.current?.rotate(-Math.PI/6)}>↶</button><button onClick={()=>actions.current?.reset()}>{t('Reset view', '复位')}</button><button aria-label={t('Rotate gift box right', '向右旋转礼盒')} onClick={()=>actions.current?.rotate(Math.PI/6)}>↷</button></div></div>}
 </div>;
}
