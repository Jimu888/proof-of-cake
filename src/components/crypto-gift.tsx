'use client';
import {useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import {describeArtworkPolicy} from '../domain/artwork-policy';
import {catalog, artworkImage, type Artwork} from '../domain/catalog';
const GiftSculpture=dynamic(()=>import('./gift-sculpture'),{ssr:false,loading:()=> <p className="three-loading">正在准备三维预览…</p>});
const A='/cryptogift/';
const asWork=(work: Artwork)=>({...work,cn:work.title,tag:work.media==='image'?'数字图像概念':'数字艺术',desc:work.description});
const works=catalog.map(asWork);
type Work=typeof works[number];
type Draft={art:string;to:string;message:string};
const defaultMessage='送你一只宇航猫，\n愿你在更大的世界里，\n一直保持好奇。';
function Arrow(){return <span aria-hidden="true">↗</span>}
export default function Mement({receive=false, artworks=catalog}:{receive?:boolean; artworks?:readonly Artwork[]}){
 const [notice,setNotice]=useState(''),[threeD,setThreeD]=useState(false);
 const [welcome,setWelcome]=useState(false);
 useEffect(()=>{
   if(receive||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   try { if(sessionStorage.getItem('mement-welcome'))return; sessionStorage.setItem('mement-welcome','1'); } catch { return; }
   setWelcome(true);
   const timeout=setTimeout(()=>setWelcome(false),2400);
   const dismiss=(event:KeyboardEvent)=>{if(event.key==='Escape'||event.key==='Tab')setWelcome(false);};
   window.addEventListener('keydown',dismiss);
   return ()=>{clearTimeout(timeout);window.removeEventListener('keydown',dismiss);};
 },[receive]);
 const [to,setTo]=useState(''),[message,setMessage]=useState(defaultMessage);
 const [phase,setPhase]=useState<'sealed'|'opening'|'revealed'|'detail'|'letter'|'full'>('sealed'),[recipientWork,setRecipientWork]=useState(works[0]),[saved,setSaved]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{if(!receive)return;try{const d=JSON.parse(sessionStorage.getItem('cryptogift-draft')||'null') as Draft|null;if(d){setRecipientWork(works.find(w=>w.id===d.art)||works[0]);setTo(d.to);setMessage(d.message);}setSaved(sessionStorage.getItem('cryptogift-saved')==='yes');}catch{} return ()=>{if(timer.current)clearTimeout(timer.current);};},[receive]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(t)},[notice]);
 function open(){if(phase!=='sealed')return;setPhase('opening');timer.current=setTimeout(()=>setPhase('revealed'),window.matchMedia('(prefers-reduced-motion: reduce)').matches?50:1900);}
 const featured=artworks.map(asWork);
 return <>
 <a className="skip" href="#main">跳到内容</a>
 <header className="header"><a className="brand" href="/" aria-label="Mement 首页"><span className="brand-star">✦</span> Mement</a>{!receive&&<nav aria-label="主导航"><a className="active" href="#gifts">礼物 <small>Gifts</small></a><a href="/creators/apply">创作者申请</a><a href="/receive">收礼体验 <span>↗</span></a></nav>}<div className="header-end"><a className="demo-badge wallet-entry" href="/wallet">钱包登录 ↗</a></div></header>
 {!receive?<main id="main">
 {welcome && <div className="catalog-welcome" onClick={() => setWelcome(false)}>
   <img src={A+'hero.png'} alt=""/><button type="button" onClick={() => setWelcome(false)}>跳过开场 ↗</button>
 </div>}
 <section className="catalog-gallery" id="gifts">
   <div className="catalog-heading"><h1>挑选礼物</h1><span>{featured.length} 件作品</span></div>
   <div className="catalog-grid">{featured.map((work,index) => <a className="catalog-item" href={'/gifts/'+work.id} key={work.id}>
     <div className="catalog-frame"><img src={artworkImage(work,true)} alt="" loading={index < 4 ? 'eager' : 'lazy'}/></div>
     <div className="catalog-caption"><div><h2>{work.title}</h2><p>{work.artist}</p></div><Arrow/></div>
   </a>)}</div>
 </section>

 </main>:<main id="main" className={'receive receive-'+phase}>
 <div className="receive-atmosphere"/><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="floor-glow"/>
 {phase==='sealed'||phase==='opening'?<section className="unboxing"><p className="eyebrow">SOMEONE THOUGHT OF YOU</p><div className={threeD?"present present-three":'present '+(phase==='opening'?'is-opening':'')}>{threeD?<GiftSculpture opening={phase==='opening'}/>:<><div className="present-light"/><img className="box-closed" src={A+'gift.png'} alt="等待打开的礼盒"/><img className="box-open" src={A+'gift-open.png'} alt="" aria-hidden="true"/></>}</div>{phase==='sealed'&&<button className="receive-mode" onClick={()=>setThreeD(!threeD)}>{threeD?'返回渲染图':'试试三维礼盒 · 拖动旋转'}</button>}<div className="unbox-copy" aria-live="polite"><h1>{phase==='opening'?'心意，正在展开…':'你收到了一份礼物'}</h1><p>From Jimu · 演示署名{to&&<span> / To {to}</span>}</p>{phase==='sealed'?<button className="button primary" onClick={open}>点击打开 <Arrow/></button>:<div className="opening-progress" role="status" aria-label="正在打开礼物"/>}<small>开箱为展示动画，无需连接钱包或领取资产。</small></div></section>:
 phase==='revealed'?<section className="unboxing reveal"><p className="eyebrow">A LITTLE CURIOSITY. A BIGGER WORLD.</p><div className="revealed-frame"><img src={A+recipientWork.image} className={recipientWork.cutout?'cutout':''} alt={recipientWork.cn}/></div><h1>一份为你挑选的心意</h1><p>{recipientWork.name} / {recipientWork.cn}</p><button className="button primary" onClick={()=>setPhase('detail')}>查看礼物 <Arrow/></button><small>演示礼物 · 尚未铸造或链上发送</small></section>:
 phase==='letter'?<section className="letter-view"><button className="back" onClick={()=>setPhase('detail')}>← 返回礼物</button><div className="letter"><span className="eyebrow">A NOTE, JUST FOR YOU</span><p>{message||'有些心意，不必用语言表达。'}</p><span className="signature">— Jimu</span></div><button className="button outline" onClick={()=>{try{sessionStorage.setItem('cryptogift-saved',saved?'no':'yes');setSaved(!saved)}catch{setNotice('浏览器无法保存收藏。')}}}>{saved?'已收藏这份心意 ♥':'收藏这份心意 ♡'}</button><small>收藏仅保存在本次浏览器会话中。</small></section>:
 phase==='full'?<section className="full-art"><button className="back" onClick={()=>setPhase('detail')}>← 返回详情</button><img src={A+recipientWork.image} alt={recipientWork.cn}/><div><h1>{recipientWork.name}</h1><p>{recipientWork.cn} · 二维作品预览</p></div></section>:
 <section className="gift-detail"><button className="back" onClick={()=>setPhase('revealed')}>← 返回</button><div className="detail-display"><div className="revealed-frame"><img src={A+recipientWork.image} className={recipientWork.cutout?'cutout':''} alt={recipientWork.cn}/></div><button className="text-link" onClick={()=>setPhase('full')}>完整欣赏 ↗</button></div><div className="detail-copy"><p className="eyebrow">A GIFT, JUST FOR YOU</p><h1>{recipientWork.name}</h1><h2>{recipientWork.cn}</h2><p>{recipientWork.desc}</p><dl><div><dt>From</dt><dd>Jimu（演示署名）</dd></div><div><dt>To</dt><dd>{to||'you.ai（示例）'}</dd></div><div><dt>状态</dt><dd>演示预览 · 未上链</dd></div><div><dt>作品类型</dt><dd>{recipientWork.tag}</dd></div><div><dt>发行规则</dt><dd>{describeArtworkPolicy(recipientWork.policy)}</dd></div></dl><button className="button primary" onClick={()=>setPhase('letter')}>读一读 TA 的留言 <Arrow/></button></div></section>}
 <a className="receive-home" href="/">也为一个人挑选礼物 ↗</a></main>}
 <footer><a className="brand" href="/"><span className="brand-star">✦</span> Mement</a><span>A little more than a gift.</span><span><a href="/creators/apply">创作者申请 ↗</a><br/>设计演示 · 钱包与链上功能尚未接入</span></footer>

 {notice&&<div className="toast" role="status">{notice}</div>}
 </>;
}
