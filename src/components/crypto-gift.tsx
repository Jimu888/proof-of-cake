'use client';
import {useCallback,useEffect,useMemo,useRef,useState,type TouchEvent,type WheelEvent} from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {describeArtworkPolicy} from '../domain/artwork-policy';
import {catalog, artworkImage, type Artwork} from '../domain/catalog';
import { giftSeries, zodiacSeries } from '../domain/series';
const featuredSeries = giftSeries.find(series => series.status === 'live' && series.featuredInVitrine);
const GiftSculpture=dynamic(()=>import('./gift-sculpture'),{ssr:false,loading:()=> <p className="three-loading">正在准备三维预览…</p>});
const ZodiacStage=dynamic(()=>import('./zodiac-stage'),{ssr:false});
const A='/cryptogift/';
const asWork=(work: Artwork)=>({...work,cn:work.title,tag:work.media==='image'?'数字图像概念':'数字艺术',desc:work.description});
const works=catalog.map(asWork);
type Draft={art:string;to:string;message:string};
const defaultMessage='送你一只宇航猫，\n愿你在更大的世界里，\n一直保持好奇。';
function Arrow(){return <span aria-hidden="true">↗</span>}
function padIndex(index: number){return String(index + 1).padStart(2, '0');}

export default function Mement({receive=false, artworks=catalog}:{receive?:boolean; artworks?:readonly Artwork[]}){
 const [notice,setNotice]=useState(''),[threeD,setThreeD]=useState(false);
 const [view,setView]=useState<'vitrine'|'room'>('vitrine');
 const [roomSection,setRoomSection]=useState<'permanent'|'series'>('permanent');
 const [activeIndex,setActiveIndex]=useState(0);
 const [roomPage,setRoomPage]=useState(0);
 const [perPage,setPerPage]=useState(3);
 const wheelLockRef=useRef(0);
 const vitrineWheelLockRef=useRef(0);
 const touchStartRef=useRef<{x:number;y:number}|null>(null);
 const vitrineTouchRef=useRef<{x:number;y:number}|null>(null);

 const [to,setTo]=useState(''),[message,setMessage]=useState(defaultMessage);
 const [phase,setPhase]=useState<'sealed'|'opening'|'revealed'|'detail'|'letter'|'full'>('sealed'),[recipientWork,setRecipientWork]=useState(works[0]),[saved,setSaved]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{if(!receive)return;try{const d=JSON.parse(sessionStorage.getItem('cryptogift-draft')||'null') as Draft|null;if(d){setRecipientWork(works.find(w=>w.id===d.art)||works[0]);setTo(d.to);setMessage(d.message);}setSaved(sessionStorage.getItem('cryptogift-saved')==='yes');}catch{} return ()=>{if(timer.current)clearTimeout(timer.current);};},[receive]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(t)},[notice]);
 function open(){if(phase!=='sealed')return;setPhase('opening');timer.current=setTimeout(()=>setPhase('revealed'),window.matchMedia('(prefers-reduced-motion: reduce)').matches?50:1900);}

 const featured=useMemo(()=>artworks.map(asWork),[artworks]);
 const vitrineCount=featured.length+Number(!!featuredSeries);
 const safeIndex=vitrineCount>0?activeIndex%vitrineCount:0;
 const isZodiacVitrine=featuredSeries?.slug===zodiacSeries.slug && safeIndex===0;
 const vitrineWork=isZodiacVitrine?null:featured[safeIndex-Number(!!featuredSeries)];

 // Sync initial hash (#gifts opens directly into the gallery room) & responsive items per full-screen wall
 useEffect(()=>{
  if(receive)return;
  const syncHash=()=>{
   const hash=window.location.hash;
   setView(hash==='#gifts'||hash==='#series'?'room':'vitrine');
   setRoomSection(hash==='#series'?'series':'permanent');
  };
  const syncPerPage=()=>{
   const w=window.innerWidth;
   setPerPage(w<=640?1:w<=1040?2:3);
  };
  syncHash();
  syncPerPage();
  window.addEventListener('hashchange',syncHash);
  window.addEventListener('resize',syncPerPage);
  return ()=>{
   window.removeEventListener('hashchange',syncHash);
   window.removeEventListener('resize',syncPerPage);
  };
 },[receive]);

 // Group artworks into full-screen horizontal walls (pages)
 const pages=useMemo(()=>{
  const result: Array<Array<{work: typeof featured[number]; globalIndex: number}>>=[];
  for(let i=0;i<featured.length;i+=perPage){
   result.push(featured.slice(i,i+perPage).map((work,offset)=>({work,globalIndex:i+offset})));
  }
  return result.length>0?result:[[]];
 },[featured,perPage]);

 const totalPages=pages.length;
 const safeRoomPage=Math.min(roomPage,Math.max(0,totalPages-1));

 const openRoom=useCallback((section: 'permanent'|'series')=>{
  setView('room');
  setRoomSection(section);
  const hash=section==='series'?'#series':'#gifts';
  if(location.hash!==hash)history.pushState(null,'',hash);
 },[]);
 const enterRoom=useCallback(()=>openRoom('permanent'),[openRoom]);

 const backToVitrine=useCallback(()=>{
  setView('vitrine');
  if(typeof window!=='undefined'&&window.location.hash){
   window.history.replaceState(null,'',window.location.pathname+window.location.search);
  }
 },[]);

 const stepVitrine=useCallback((delta: number)=>{
  if(vitrineCount<=1)return;
  setActiveIndex(prev=>(prev+delta+vitrineCount)%vitrineCount);
 },[vitrineCount]);

 const stepRoomPage=useCallback((delta: number)=>{
  if(totalPages<=1)return;
  setRoomPage(prev=>{
   const current=Math.min(prev,totalPages-1);
   const next=current+delta;
   if(next<0)return 0;
   if(next>=totalPages)return totalPages-1;
   return next;
  });
 },[totalPages]);

 // Keyboard navigation (Up/Down in vitrine, Left/Right in room, Escape back to vitrine)
 useEffect(()=>{
  if(receive)return;
  const onKeyDown=(event: KeyboardEvent)=>{
   if(event.defaultPrevented || (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable]'))) return;
   if(view==='vitrine'){
    if(event.key==='ArrowDown'){
     event.preventDefault();
     stepVitrine(1);
    }else if(event.key==='ArrowUp'){
     event.preventDefault();
     stepVitrine(-1);
    }
    return;
   }
   if(event.key==='Escape'){backToVitrine();return;}
   if(roomSection!=='permanent')return;
   if(event.key==='ArrowRight'||event.key==='PageDown'){
    event.preventDefault();
    stepRoomPage(1);
   }else if(event.key==='ArrowLeft'||event.key==='PageUp'){
    event.preventDefault();
    stepRoomPage(-1);
   }
  };
  window.addEventListener('keydown',onKeyDown);
  return ()=>window.removeEventListener('keydown',onKeyDown);
 },[receive,view,roomSection,stepVitrine,stepRoomPage,backToVitrine]);

 // Vertical wheel / swipe in vitrine cycles single showcase gift
 function handleVitrineWheel(event: WheelEvent<HTMLElement>){
  if(vitrineCount<=1)return;
  const now=Date.now();
  if(now-vitrineWheelLockRef.current<520)return;
  if(Math.abs(event.deltaY)<20)return;
  vitrineWheelLockRef.current=now;
  stepVitrine(event.deltaY>0?1:-1);
 }

 function handleVitrineTouchStart(event: TouchEvent<HTMLElement>){
  const touch=event.touches[0];
  if(!touch)return;
  vitrineTouchRef.current={x:touch.clientX,y:touch.clientY};
 }

 function handleVitrineTouchEnd(event: TouchEvent<HTMLElement>){
  if(!vitrineTouchRef.current||vitrineCount<=1)return;
  const touch=event.changedTouches[0];
  if(!touch)return;
  const dx=vitrineTouchRef.current.x-touch.clientX;
  const dy=vitrineTouchRef.current.y-touch.clientY;
  vitrineTouchRef.current=null;
  if(Math.abs(dy)>40&&Math.abs(dy)>Math.abs(dx)*1.2){
   stepVitrine(dy>0?1:-1);
  }
 }

 // Horizontal / wheel snap to next/prev full screen wall
 function handleRoomWheel(event: WheelEvent<HTMLElement>){
  if(roomSection!=='permanent'||totalPages<=1)return;
  const now=Date.now();
  if(now-wheelLockRef.current<620)return;
  const primary=Math.abs(event.deltaX)>=Math.abs(event.deltaY)?event.deltaX:event.deltaY;
  if(Math.abs(primary)<24)return;
  wheelLockRef.current=now;
  stepRoomPage(primary>0?1:-1);
 }

 function handleTouchStart(event: TouchEvent<HTMLElement>){
  const touch=event.touches[0];
  if(!touch)return;
  touchStartRef.current={x:touch.clientX,y:touch.clientY};
 }

 function handleTouchEnd(event: TouchEvent<HTMLElement>){
  if(roomSection!=='permanent'||!touchStartRef.current||totalPages<=1)return;
  const touch=event.changedTouches[0];
  if(!touch)return;
  const dx=touchStartRef.current.x-touch.clientX;
  const dy=touchStartRef.current.y-touch.clientY;
  touchStartRef.current=null;
  if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2){
   stepRoomPage(dx>0?1:-1);
  }
 }

 if(receive){
  return <>
   <a className="skip" href="#main">跳到内容</a>
   <header className="header"><Link className="brand" href="/" aria-label="Mement 首页"><span className="brand-star">✦</span> Mement</Link><div className="header-end"><Link className="demo-badge wallet-entry" href="/wallet">钱包登录 ↗</Link></div></header>
   <main id="main" className={'receive receive-'+phase}>
   <div className="receive-atmosphere"/><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="floor-glow"/>
   {phase==='sealed'||phase==='opening'?<section className="unboxing"><p className="eyebrow">SOMEONE THOUGHT OF YOU</p><div className={threeD?"present present-three":'present '+(phase==='opening'?'is-opening':'')}>{threeD?<GiftSculpture opening={phase==='opening'}/>:<><div className="present-light"/><img className="box-closed" src={A+'gift.png'} alt="等待打开的礼盒"/><img className="box-open" src={A+'gift-open.png'} alt="" aria-hidden="true"/></>}</div>{phase==='sealed'&&<button className="receive-mode" onClick={()=>setThreeD(!threeD)}>{threeD?'返回渲染图':'试试三维礼盒 · 拖动旋转'}</button>}<div className="unbox-copy" aria-live="polite"><h1>{phase==='opening'?'心意，正在展开…':'你收到了一份礼物'}</h1><p>From Jimu · 演示署名{to&&<span> / To {to}</span>}</p>{phase==='sealed'?<button className="button primary" onClick={open}>点击打开 <Arrow/></button>:<div className="opening-progress" role="status" aria-label="正在打开礼物"/>}<small>开箱为展示动画，无需连接钱包或领取资产。</small></div></section>:
   phase==='revealed'?<section className="unboxing reveal"><p className="eyebrow">A LITTLE CURIOSITY. A BIGGER WORLD.</p><div className="revealed-frame"><img src={A+recipientWork.image} className={recipientWork.cutout?'cutout':''} alt={recipientWork.cn}/></div><h1>一份为你挑选的心意</h1><p>{recipientWork.name} / {recipientWork.cn}</p><button className="button primary" onClick={()=>setPhase('detail')}>查看礼物 <Arrow/></button><small>演示礼物 · 尚未铸造或链上发送</small></section>:
   phase==='letter'?<section className="letter-view"><button className="back" onClick={()=>setPhase('detail')}>← 返回礼物</button><div className="letter"><span className="eyebrow">A NOTE, JUST FOR YOU</span><p>{message||'有些心意，不必用语言表达。'}</p><span className="signature">— Jimu</span></div><button className="button outline" onClick={()=>{try{sessionStorage.setItem('cryptogift-saved',saved?'no':'yes');setSaved(!saved)}catch{setNotice('浏览器无法保存收藏。')}}}>{saved?'已收藏这份心意 ♥':'收藏这份心意 ♡'}</button><small>收藏仅保存在本次浏览器会话中。</small></section>:
   phase==='full'?<section className="full-art"><button className="back" onClick={()=>setPhase('detail')}>← 返回详情</button><img src={A+recipientWork.image} alt={recipientWork.cn}/><div><h1>{recipientWork.name}</h1><p>{recipientWork.cn} · 二维作品预览</p></div></section>:
   <section className="gift-detail"><button className="back" onClick={()=>setPhase('revealed')}>← 返回</button><div className="detail-display"><div className="revealed-frame"><img src={A+recipientWork.image} className={recipientWork.cutout?'cutout':''} alt={recipientWork.cn}/></div><button className="text-link" onClick={()=>setPhase('full')}>完整欣赏 ↗</button></div><div className="detail-copy"><p className="eyebrow">A GIFT, JUST FOR YOU</p><h1>{recipientWork.name}</h1><h2>{recipientWork.cn}</h2><p>{recipientWork.desc}</p><dl><div><dt>From</dt><dd>Jimu（演示署名）</dd></div><div><dt>To</dt><dd>{to||'you.ai（示例）'}</dd></div><div><dt>状态</dt><dd>演示预览 · 未上链</dd></div><div><dt>作品类型</dt><dd>{recipientWork.tag}</dd></div><div><dt>发行规则</dt><dd>{describeArtworkPolicy(recipientWork.policy)}</dd></div></dl><button className="button primary" onClick={()=>setPhase('letter')}>读一读 TA 的留言 <Arrow/></button></div></section>}
   <Link className="receive-home" href="/">也为一个人挑选礼物 ↗</Link></main>
   <footer><Link className="brand" href="/"><span className="brand-star">✦</span> Mement</Link><span>A little more than a gift.</span><span><Link href="/creators/apply">创作者申请 ↗</Link><br/>设计演示 · 钱包与链上功能尚未接入</span></footer>
   {notice&&<div className="toast" role="status">{notice}</div>}
  </>;
 }

 return <div className="boutique-shell boutique-viewport">
  <a className="skip" href="#main">跳到内容</a>
  <header className="boutique-header">
   <button type="button" className="boutique-brand" onClick={backToVitrine} aria-label="Mement 街角橱窗">MEMENT</button>
   <nav className="boutique-nav" aria-label="主导航">
    <button type="button" className={view==='vitrine'?'is-active':''} onClick={backToVitrine}>橱窗</button>
    <button type="button" className={view==='room'?'is-active':''} onClick={enterRoom}>展厅</button>
    <Link href="/creators/apply">创作者</Link>
    <Link href="/wallet">钱包</Link>
   </nav>
  </header>

  <main id="main" className="boutique-screens">
   {/* Screen 1: Street-Corner Vitrine */}
   <section
    className={`boutique-screen boutique-vitrine ${view==='vitrine'?'is-visible':'is-hidden'}`}
    inert={view!=='vitrine'}
    aria-hidden={view!=='vitrine'}
    aria-label="街角橱窗"
    onWheel={handleVitrineWheel}
    onTouchStart={handleVitrineTouchStart}
    onTouchEnd={handleVitrineTouchEnd}
   >
    <div className="vitrine-ambient" aria-hidden="true"/>
    <div className="vitrine-stage">
     {isZodiacVitrine ? (
      <Link className="boutique-niche vitrine-niche vitrine-zodiac-niche" href={zodiacSeries.route} tabIndex={view==='vitrine'?0:-1} aria-label="探索十二生肖加密生日数字礼物">
       <span className="l-corner l-tl" aria-hidden="true"/>
       <span className="l-corner l-tr" aria-hidden="true"/>
       <span className="l-corner l-bl" aria-hidden="true"/>
       <span className="l-corner l-br" aria-hidden="true"/>
       <ZodiacStage sign="goat" mode="hero" filter="original" motionEnabled={true}/>
       <span className="vitrine-3d-badge" aria-hidden="true">3D VOXEL · 点击进入生肖专题 ↗</span>
      </Link>
     ) : vitrineWork ? (
      <Link className="boutique-niche vitrine-niche" href={'/gifts/'+vitrineWork.id} tabIndex={view==='vitrine'?0:-1} aria-label={'查看当期橱窗作品：'+vitrineWork.title}>
       <span className="niche-spill vitrine-fade" key={'spill-'+vitrineWork.id} aria-hidden="true"><img src={artworkImage(vitrineWork, true)} alt=""/></span>
       <span className="niche-media vitrine-fade" key={'media-'+vitrineWork.id}><img src={artworkImage(vitrineWork, true)} alt={vitrineWork.title} className={vitrineWork.cutout?'is-cutout':''}/></span>
      </Link>
     ) : null}
    </div>

    <div className="vitrine-plaque">
     {isZodiacVitrine ? <>
      <p className="vitrine-status"><span className="vitrine-dot" aria-hidden="true"/>GENESIS ZODIAC · 2027 丁未未羊</p>
      <h1>十二生肖 ·<br/>链上生日数字礼。</h1>
      <p className="vitrine-subtitle">Luminous Voxel · 未羊 / 午马 / 丑牛 / 辰龙实时 3D 赏玩与专属启封仪式。</p>
      <div className="vitrine-actions">
       <Link className="boutique-btn" href={zodiacSeries.route} tabIndex={view==='vitrine'?0:-1}>探索十二生肖 <span aria-hidden="true">→</span></Link>
       <button type="button" className="boutique-link" tabIndex={view==='vitrine'?0:-1} onClick={enterRoom}>步入精选展厅 <Arrow/></button>
      </div>
     </> : vitrineWork ? <>
      <p className="vitrine-status"><span className="vitrine-dot" aria-hidden="true"/>OPEN · CURATION {padIndex(safeIndex)}</p>
      <h1>值得郑重递出的<br/>数字礼物。</h1>
      <p className="vitrine-subtitle">Objects meant to be given. — {vitrineWork.title} / {vitrineWork.artist}</p>
      <div className="vitrine-actions">
       <button type="button" className="boutique-btn" tabIndex={view==='vitrine'?0:-1} onClick={enterRoom}>步入展厅 <span aria-hidden="true">→</span></button>
       <Link className="boutique-link" href={'/gifts/'+vitrineWork.id} tabIndex={view==='vitrine'?0:-1}>细看此作 <Arrow/></Link>
      </div>
     </> : null}
    </div>

    {vitrineCount > 1 && <aside className="vitrine-index" aria-label="切换橱窗展品">
     <button
      type="button"
      tabIndex={view==='vitrine'?0:-1}
      className={safeIndex === 0 ? 'is-current' : ''}
      aria-pressed={safeIndex === 0}
      aria-label="橱窗展示 01：十二生肖加密数字礼物"
      onClick={() => setActiveIndex(0)}
     >
      01
     </button>
     {featured.map((work, index) => (
      <button
       key={work.id}
       type="button"
       tabIndex={view==='vitrine'?0:-1}
       className={index + 1 === safeIndex ? 'is-current' : ''}
       aria-pressed={index + 1 === safeIndex}
       aria-label={'橱窗展示 ' + padIndex(index + 1) + '：' + work.title}
       onClick={() => setActiveIndex(index + 1)}
      >
       {padIndex(index + 1)}
      </button>
     ))}
     <span className="vitrine-scroll-hint" aria-hidden="true">↕ 上下滑切换</span>
    </aside>}
   </section>

   {/* Screen 2: Interior Gallery Room (Full-Screen Horizontal Paged Walls) */}
   <section
    className={`boutique-screen boutique-room-screen ${view==='room'?'is-visible':'is-hidden'}`}
    id="gifts"
    inert={view!=='room'}
    aria-hidden={view!=='room'}
    aria-labelledby="room-heading"
    onWheel={handleRoomWheel}
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
   >
    <div className="room-top-bar">
     <div>
      <p className="room-eyebrow">ROOM {padIndex(safeRoomPage)} · CURRENT SELECTION</p>
      <h2 id="room-heading">精选展厅</h2>
     </div>
     <nav className="room-section-nav" aria-label="展厅空间">
      <a href="#gifts" aria-current={roomSection==='permanent'?'page':undefined} onClick={event=>{event.preventDefault();openRoom('permanent');}}>常设陈列</a>
      <a href="#series" aria-current={roomSection==='series'?'page':undefined} onClick={event=>{event.preventDefault();openRoom('series');}}>主题特展</a>
     </nav>
     <div className="room-top-meta">
      <span className="room-count">{String(featured.length).padStart(2, '0')} OBJECTS</span>
      <button type="button" className="boutique-link" tabIndex={view==='room'?0:-1} onClick={backToVitrine}>← 回到街角橱窗</button>
     </div>
    </div>

    {roomSection==='series' ? <div className="room-exhibitions">
     {giftSeries.map(series => <article className="room-exhibition" key={series.slug}>
      <div className="boutique-niche room-exhibition-niche"><span className="niche-media"><img src={series.coverImage} alt="" /></span></div>
      <div className="room-exhibition-caption">
       <p className="room-eyebrow">{series.code} · {series.titleEn}</p>
       <h3>{series.titleCn}</h3>
       <p>{series.itemProgress} · {series.seasonTag}</p>
       {series.status !== 'upcoming' && <Link className="boutique-link" href={series.route}>步入特展 →</Link>}
      </div>
     </article>)}
    </div> : <div className="room-carousel-viewport">
     <div className="room-carousel-track" style={{transform:`translate3d(-${safeRoomPage * 100}%, 0, 0)`}}>
      {pages.map((pageItems, pageIdx) => (
       <div className="room-wall-page" key={pageIdx} aria-hidden={pageIdx!==safeRoomPage}>
        <div className={`boutique-wall wall-count-${pageItems.length}`}>
         {pageItems.map(({work, globalIndex}, slotIndex) => (
          <Link
           className={`boutique-piece piece-slot-${slotIndex % 3}`}
           href={'/gifts/' + work.id}
           key={work.id}
           tabIndex={view==='room'&&pageIdx===safeRoomPage?0:-1}
          >
           <div className="boutique-niche piece-niche">
            <span className="niche-spill" aria-hidden="true"><img src={artworkImage(work, true)} alt=""/></span>
            <span className="niche-media">
             <img src={artworkImage(work, true)} alt={work.title} className={work.cutout ? 'is-cutout' : ''} loading={pageIdx === 0 ? 'eager' : 'lazy'}/>
            </span>
           </div>
           <div className="boutique-plaque">
            <span className="plaque-index">{padIndex(globalIndex)}</span>
            <h3>{work.title}</h3>
            <p className="plaque-meta">{work.artist} · {work.editionLimit} eds</p>
            <p className="plaque-price">{work.price} BNB</p>
           </div>
          </Link>
         ))}
        </div>
       </div>
      ))}
     </div>
    </div>}

    <footer className="room-bottom-bar">
     {roomSection==='permanent' && <div className="room-pager">
      <button
       type="button"
       className="pager-arrow"
       disabled={safeRoomPage===0}
       tabIndex={view==='room'?0:-1}
       onClick={()=>stepRoomPage(-1)}
       aria-label="上一面展墙"
      >←</button>
      <div className="pager-dots" role="tablist" aria-label="展墙翻页">
       {pages.map((_, idx) => (
        <button
         key={idx}
         type="button"
         role="tab"
         aria-selected={idx===safeRoomPage}
         tabIndex={view==='room'?0:-1}
         className={idx===safeRoomPage?'is-current':''}
         onClick={()=>setRoomPage(idx)}
        >
         {padIndex(idx)}
        </button>
       ))}
      </div>
      <button
       type="button"
       className="pager-arrow"
       disabled={safeRoomPage>=totalPages-1}
       tabIndex={view==='room'?0:-1}
       onClick={()=>stepRoomPage(1)}
       aria-label="下一面展墙"
      >→</button>
      {totalPages>1&&<span className="pager-hint">左右滑动或按方向键切换整屏</span>}
     </div>}

     <div className="room-footer-links">
      <Link href="/receive" tabIndex={view==='room'?0:-1}>《计划之外》生日个例 ↗</Link>
      <span>演示与 BSC 测试网环境</span>
     </div>
    </footer>
   </section>
  </main>

  {notice&&<div className="toast" role="status">{notice}</div>}
 </div>;
}
