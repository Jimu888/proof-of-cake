import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createBirthdayParcel(center:THREE.Vector3){
 const root=new THREE.Group(),lid=new THREE.Group(),geometry:THREE.BufferGeometry[]=[],materials:THREE.MeshStandardMaterial[]=[];
 root.position.copy(center);root.rotation.y=-.16;
 const paper=new THREE.MeshStandardMaterial({color:0xe4d6bc,roughness:.76,metalness:.02,transparent:true}),ribbon=new THREE.MeshStandardMaterial({color:0x9d6846,roughness:.48,metalness:.22,transparent:true}),lining=new THREE.MeshStandardMaterial({color:0xdfb479,roughness:.88,transparent:true});materials.push(paper,ribbon,lining);
 function box(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,parent:THREE.Group=root){const g=new RoundedBoxGeometry(w,h,d,3,.045);geometry.push(g);const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const left=new THREE.Group(),right=new THREE.Group(),front=new THREE.Group(),back=new THREE.Group();left.position.set(-1.515,-1.19,0);right.position.set(1.515,-1.19,0);front.position.set(0,-1.19,1.34);back.position.set(0,-1.19,-1.34);root.add(left,right,front,back);
 box(3.15,.14,2.8,0,-1.19,0,paper);box(2.88,.04,2.5,0,-1.09,0,lining);
 for(const g of [front,back]){box(3.15,2.35,.12,0,1.19,0,paper,g);box(.29,2.37,.035,0,1.19,g===front?.08:-.08,ribbon,g)}
 for(const g of [left,right]){box(.12,2.35,2.56,0,1.19,0,paper,g);box(.035,2.37,.29,g===left?-.08:.08,1.19,0,ribbon,g)}
 lid.position.y=1.3;root.add(lid);box(3.32,.23,2.97,0,0,0,paper,lid);box(.3,.035,2.99,0,.137,0,ribbon,lid);box(3.34,.035,.3,0,.137,0,ribbon,lid);box(.3,.24,.035,0,0,1.505,ribbon,lid);box(.3,.24,.035,0,0,-1.505,ribbon,lid);
 const sealGeometry=new THREE.CylinderGeometry(.22,.22,.05,32);geometry.push(sealGeometry);const seal=new THREE.Mesh(sealGeometry,ribbon);seal.position.set(.48,.16,.42);lid.add(seal);
 const dustGeometry=new THREE.SphereGeometry(.035,8,6);geometry.push(dustGeometry);const dustMat=new THREE.MeshBasicMaterial({color:0xffdb93,transparent:true,opacity:0});const dust=Array.from({length:13},(_,i)=>{const p=new THREE.Mesh(dustGeometry,dustMat);p.position.set(Math.sin(i*2.4)*1.2,.6+(i%4)*.2,Math.cos(i*2.4)*.9);root.add(p);return p});
 return {root,lid,
  open(t:number){const k=1-Math.pow(1-t,3);lid.position.y=1.3+k*2.1;lid.position.x=k*.25;lid.rotation.z=-k*.18;lid.rotation.x=-k*.16;dustMat.opacity=Math.sin(t*Math.PI)*.65;dust.forEach((p,i)=>{p.position.y=.7+k*(1+i*.16)})},
  unfold(t:number){left.rotation.z=t*1.12;right.rotation.z=-t*1.12;front.rotation.x=t*1.08;back.rotation.x=-t*1.08;lid.position.x=.25+t*.8;lid.position.y=3.4+t*.6},
  light(t:number){dustMat.opacity=Math.sin(t*Math.PI)*.9;dust.forEach((p,i)=>{p.position.y=.8+t*(1.5+i*.12);p.position.x=Math.sin(i*2.4)*(1.2+t*1.8);p.position.z=Math.cos(i*2.4)*(.9+t)})},
  fade(t:number){materials.forEach(m=>{m.opacity=1-t;m.depthWrite=t<.01});root.visible=t<.999},
  dispose(){geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());dustMat.dispose()}
 };
}
