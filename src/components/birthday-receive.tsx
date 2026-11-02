'use client';
import {lazy,Suspense,useEffect,useRef,useState} from 'react';
const BirthdayScene=lazy(()=>import('./birthday-scene'));
const copy={title:process.env.NEXT_PUBLIC_BIRTHDAY_TITLE||'一起向前的小世界',recipient:process.env.NEXT_PUBLIC_BIRTHDAY_RECIPIENT||'',sender:process.env.NEXT_PUBLIC_BIRTHDAY_SENDER||'Jimu',message:process.env.NEXT_PUBLIC_BIRTHDAY_MESSAGE||'生日快乐。\n\n愿新的一岁，有喜欢的风景，\n有一起前行的人，\n也有不断出发的勇气。'};
export default function BirthdayReceive({assetBase='/birthday/',shellBase='/cryptogift/'}:{assetBase?:string;shellBase?:string}){
 const [phase,setPhase]=useState<'sealed'|'opening'|'gift'>('sealed'),[note,setNote]=useState(false),[ready,setReady]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),heading=useRef<HTMLHeadingElement>(null),dialog=useRef<HTMLDialogElement>(null),noteButton=useRef<HTMLButtonElement>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 useEffect(()=>{if(phase==='gift')heading.current?.focus()},[phase]);
 useEffect(()=>{if(note){dialog.current?.showModal();}else if(dialog.current?.open){dialog.current.close();noteButton.current?.focus()}},[note]);
 function open(){if(phase!=='sealed')return;setPhase('opening');timer.current=setTimeout(()=>setPhase('gift'),window.matchMedia('(prefers-reduced-motion: reduce)').matches?60:1700)}
 return <div className={'birthday-experience birthday-phase-'+phase}>
  <a className="skip" href="#birthday-main">跳到礼物</a>
  <header className="birthday-header"><span className="brand"><span className="brand-star" aria-hidden="true">✦</span> Mement</span><span>A GIFT, JUST FOR YOU</span></header>
  <main id="birthday-main">
  {phase!=='gift'?<section className="birthday-sealed"><div className="birthday-halo" aria-hidden="true"/><p className="eyebrow">{copy.recipient?'FOR '+copy.recipient:'SOMEONE THOUGHT OF YOU'}</p><div className={'birthday-present '+(phase==='opening'?'is-opening':'')}><div className="present-light"/><img className="box-closed" src={shellBase+'gift.png'} alt="为你准备的生日礼盒"/><img className="box-open" src={shellBase+'gift-open.png'} alt="" aria-hidden="true"/></div><div className="birthday-invitation" aria-live="polite"><h1>{phase==='opening'?'心意，正在展开':'有一份礼物，想送给你。'}</h1><p>来自 {copy.sender} 的生日心意</p>{phase==='sealed'?<button className="button primary" onClick={open}>打开你的礼物 <span aria-hidden="true">↗</span></button>:<div className="opening-progress" role="status" aria-label="礼盒正在打开"/>}<span className="birthday-quiet">为一个特别的日子，留住一个小世界。</span></div></section>:
  <section className="birthday-opened"><div className="birthday-title"><div><p className="eyebrow">A LITTLE WORLD, MADE FOR YOU</p><h1 ref={heading} tabIndex={-1}>{copy.title}</h1></div><button className="birthday-note-link" ref={noteButton} onClick={()=>setNote(true)}>有几句话，想对你说 <span aria-hidden="true">↗</span></button></div><Suspense fallback={<div className="birthday-viewer"><div className="birthday-load"><p>正在准备你的礼物…</p></div></div>}><BirthdayScene assetBase={assetBase} onReady={()=>setReady(true)}/></Suspense><div className="birthday-art-caption"><p>送给{copy.recipient||'特别的你'}<span> · </span>由 {copy.sender} 创作与赠予</p><span aria-live="polite">{ready?'一份可以慢慢看的生日心意。':'正在载入三维作品…'}</span></div></section>}
  </main>
  <footer className="birthday-footer"><span>A moment, made to stay.</span><span>数字艺术礼物 · 预览版</span></footer>
  <dialog ref={dialog} className="birthday-letter-dialog" aria-labelledby="birthday-note-title" onCancel={e=>{e.preventDefault();setNote(false)}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)setNote(false)}}}><button className="close" aria-label="关闭赠言" onClick={()=>setNote(false)}>×</button><p className="eyebrow">A NOTE, JUST FOR YOU</p><h2 id="birthday-note-title">生日快乐{copy.recipient?'，'+copy.recipient:'。'}</h2><p className="birthday-letter-copy">{copy.message.replace(/\\n/g,'\n')}</p><span className="signature">— {copy.sender}</span><button className="text-link" onClick={()=>setNote(false)}>回到你的小世界 ↗</button></dialog>
 </div>;
}
