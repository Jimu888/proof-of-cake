'use client';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
const BirthdayScene=lazy(()=>import('./birthday-scene'));
const copy={sender:process.env.NEXT_PUBLIC_BIRTHDAY_SENDER||'jimu.ai',message:process.env.NEXT_PUBLIC_BIRTHDAY_MESSAGE||'生日快乐。\n\n愿新的一岁，有喜欢的风景，\n有一起前行的人，\n也有不断出发的勇气。'};
const message=copy.message.replace(/\\n/g,'\n');
const greeting='生日快乐。';
const hasGreeting=message===greeting||message.startsWith(greeting+'\n');
const blessing=hasGreeting?message.slice(greeting.length).trimStart():message;
export default function BirthdayReceive({assetBase='/birthday/',chainNotice=true,mintTransaction}:{assetBase?:string;chainNotice?:boolean;mintTransaction?:string}){
 const [phase,setPhase]=useState<'sealed'|'opening'|'gift'>('sealed'),[settled,setSettled]=useState(false),[sequenceDone,setSequenceDone]=useState(false),[graphicsUnavailable,setGraphicsUnavailable]=useState(false),[hovered,setHovered]=useState(false),[reveal,setReveal]=useState<'unfold'|'dissolve'|'push'>('unfold');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),letter=useRef<HTMLElement>(null),stage=useRef<HTMLElement>(null),aura=useRef<HTMLDivElement>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 useEffect(()=>{if(phase==='gift')letter.current?.focus({preventScroll:true})},[phase]);
 useEffect(()=>{if(phase==='opening'&&sequenceDone&&settled)setPhase('gift')},[phase,sequenceDone,settled]);
 useEffect(()=>{const v=new URLSearchParams(window.location.search).get('reveal');if(v==='dissolve'||v==='push')setReveal(v);const root=stage.current,light=aura.current;if(!root||!light||window.matchMedia('(pointer: coarse)').matches||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;let rect=root.getBoundingClientRect(),frame=0,x=0,y=0;const resize=new ResizeObserver(()=>{rect=root.getBoundingClientRect()});resize.observe(root);const move=(e:PointerEvent)=>{x=e.clientX-rect.left;y=e.clientY-rect.top;if(!frame)frame=requestAnimationFrame(()=>{light.style.transform=`translate3d(${x-120}px,${y-120}px,0)`;light.style.opacity='1';frame=0})};const leave=()=>{light.style.opacity='0'};root.addEventListener('pointermove',move);root.addEventListener('pointerleave',leave);return()=>{cancelAnimationFrame(frame);resize.disconnect();root.removeEventListener('pointermove',move);root.removeEventListener('pointerleave',leave)}},[]);
 function open(){if(phase!=='sealed')return;setPhase('opening');timer.current=setTimeout(()=>setSequenceDone(true),window.matchMedia('(prefers-reduced-motion: reduce)').matches?60:1500)}
 return <div className={'birthday-experience birthday-minimal birthday-phase-'+phase}>
  <main id="birthday-main" className="birthday-stage" ref={stage}>{chainNotice&&<p className="birthday-chain-notice" role="status"><span className="birthday-chain-dot" aria-hidden="true"/>{mintTransaction
    ? <span>这份礼物已作为一枚不可转让的 NFT，铸造至 yaya.ai 钱包。 <a className="birthday-chain-link" href={`https://bscscan.com/tx/${mintTransaction}`} target="_blank" rel="noopener noreferrer">查看链上交易 ↗</a></span>
    : <span>NFT 赠送准备中<span className="birthday-chain-network"> · BNB Smart Chain</span></span>}</p>}<div className="birthday-cursor-aura" ref={aura} aria-hidden="true"/>
   <section className="birthday-world-layer" aria-hidden={phase!=='gift'} inert={phase!=='gift'}>
    <Suspense fallback={<div className="birthday-viewer"/>}><BirthdayScene phase={phase} reveal={reveal} hovered={hovered} assetBase={assetBase} onSettled={supported=>{setSettled(true);setGraphicsUnavailable(supported===false)}}/></Suspense>
    <aside className="birthday-inline-letter" ref={letter} tabIndex={-1} aria-label="送给丫丫的生日祝福"><h1 className="birthday-letter-to">To 丫丫</h1><p>{hasGreeting&&<span className="birthday-letter-greeting">{greeting}</span>}{blessing}</p><span className="birthday-letter-signature">— {copy.sender}<time className="birthday-letter-date" dateTime="2026-11-03">2026 年 11 月 3 日</time></span></aside>
    <p className="birthday-drag-hint"><span className="birthday-touch-hint">轻拖换个角度 · 双指放大看细节</span><span className="birthday-pointer-hint">拖动换个角度 · 滚轮放大看细节</span></p>
   </section>
   <section className="birthday-minimal-sealed" aria-hidden={phase==='gift'} inert={phase==='gift'}>

    {graphicsUnavailable&&<div className="minimal-parcel-fallback" aria-hidden="true"><div className="paper-parcel-fallback"><i/><b/></div></div>}
    <button className="birthday-parcel-target" aria-label="轻点礼盒，打开看看" onClick={open} onPointerEnter={()=>setHovered(true)} onPointerLeave={()=>setHovered(false)} onFocus={()=>setHovered(true)} onBlur={()=>setHovered(false)} disabled={phase!=='sealed'}>{phase==='opening'&&<span className="birthday-click-ripple" aria-hidden="true"/>}<span className="birthday-open-hint">轻点礼盒，打开看看 <span aria-hidden="true">↗</span></span></button>
    {phase==='opening'&&sequenceDone&&!settled&&<div className="birthday-wait-dots" role="status" aria-label="礼物正在准备"><i/><i/><i/></div>}
   </section>
  </main>
 </div>;
}
