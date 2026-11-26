'use client';
import {useCallback,useEffect,useMemo,useRef,useState,type PointerEvent,type ReactNode,type TouchEvent,type WheelEvent} from 'react';
import WalletTrigger from './wallet-trigger';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {describeArtworkPolicy} from '../domain/artwork-policy';
import {catalog, artworkArtist, type Artwork} from '../domain/catalog';
import { giftSeries, zodiacSeries } from '../domain/series';
import { ACTIVE_ZODIAC_IDS, ZODIAC_LIST, getZodiacById, type ActiveZodiacId } from '../domain/zodiac';
import { LanguageSwitch, LocalText, useLanguage } from '../lib/i18n';
import ArtworkPresentation from './artwork-presentation';
const vitrineArtworks = ['snowflake', 'algorithmic-bond'].map(id => catalog.find(work => work.id === id)!);
const GiftSculpture=dynamic(()=>import('./gift-sculpture'),{ssr:false,loading:()=> <p className="three-loading"><LocalText en="Preparing the 3D preview…" zh="正在准备三维预览…"/></p>});
const A='/cryptogift/';
const asWork=(work: Artwork)=>({...work,cn:work.title,tag:work.media==='image'?'数字图像概念':'数字艺术',desc:work.description});
const works=catalog.map(asWork);
type Draft={art:string;to:string;message:string};
function Arrow(){return <span aria-hidden="true">↗</span>}
function padIndex(index: number){return String(index + 1).padStart(2, '0');}

function ZodiacDisplay({ live, sign = 'horse' }: { live: boolean; sign?: ActiveZodiacId }) {
 const { t } = useLanguage();
 const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 35 });
 const spec = getZodiacById(sign);
 const src = sign === 'horse' ? zodiacSeries.coverImage : (spec.previewUrl ?? zodiacSeries.coverImage);

 function onPointerMove(event: PointerEvent<HTMLDivElement>) {
  if (!live) return;
  const rect = event.currentTarget.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  setTilt({
   rx: (0.5 - y) * 8,
   ry: (x - 0.5) * 10,
   gx: Math.round(x * 100),
   gy: Math.round(y * 100),
  });
 }

 function onPointerLeave() {
  setTilt({ rx: 0, ry: 0, gx: 50, gy: 35 });
 }

 return (
  <div
   className="zodiac-living-card zodiac-poster-card"
   onPointerMove={onPointerMove}
   onPointerLeave={onPointerLeave}
   style={{
    transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
   }}
  >
   <img key={sign} className="zodiac-poster-img" src={src} alt={t(`Gilded Voxel Zodiac: ${spec.nameEn}`, `十二生肖 · 鎏金像素：${spec.nameCn}`)} />
   <span
    className="zodiac-poster-sheen"
    aria-hidden="true"
    style={{
     background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.16), transparent 58%)`,
    }}
   />
  </div>
 );
}

function DisplayCabinet({ className = '', objectKey, children }: {
 className?: string; objectKey?: number; children: ReactNode;
}) {
 return <div className={`cabinet-stage ${className}`}>
  <div className="cabinet-recess">
   <div className="cabinet-architecture" aria-hidden="true">
    <span className="cabinet-wall cabinet-wall-left"/>
    <span className="cabinet-wall cabinet-wall-right"/>
    <span className="cabinet-floor"/>
    <span className="cabinet-ceiling"><span className="cabinet-skylight"/></span>
    <span className="cabinet-refraction"/>
   </div>
   <div className={objectKey === undefined ? 'cabinet-object' : 'cabinet-object vitrine-fade'} key={objectKey}>
    {children}
   </div>
  </div>
 </div>;
}

export default function Mement({receive=false, artworks=catalog}:{receive?:boolean; artworks?:readonly Artwork[]}){
 const { language, locale, t } = useLanguage();
 const [notice,setNotice]=useState(''),[threeD,setThreeD]=useState(false);
 const [view,setView]=useState<'vitrine'|'room'>('vitrine');
 const [roomSection,setRoomSection]=useState<'permanent'|'series'>('permanent');
 const [selectedZodiac,setSelectedZodiac]=useState<ActiveZodiacId>('horse');
 const [ready,setReady]=useState(false);
 const [activeIndex,setActiveIndex]=useState(0);
 const [roomPage,setRoomPage]=useState(0);
 const [perPage,setPerPage]=useState(3);
 const wheelLockRef=useRef(0);
 const vitrineWheel=useRef({ delta: 0, last: 0, switched: 0 });
 const touchStartRef=useRef<{x:number;y:number}|null>(null);
 const vitrineTouchRef=useRef<{x:number;y:number}|null>(null);

 const [to,setTo]=useState(''),[message,setMessage]=useState<string>();
 const [phase,setPhase]=useState<'sealed'|'opening'|'revealed'|'detail'|'letter'|'full'>('sealed'),[recipientWork,setRecipientWork]=useState(works[0]),[saved,setSaved]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{if(!receive)return;try{const d=JSON.parse(sessionStorage.getItem('cryptogift-draft')||'null') as Draft|null;if(d){setRecipientWork(works.find(w=>w.id===d.art)||works[0]);setTo(d.to);setMessage(d.message);}setSaved(sessionStorage.getItem('cryptogift-saved')==='yes');}catch{} return ()=>{if(timer.current)clearTimeout(timer.current);};},[receive]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(t)},[notice]);
 function open(){if(phase!=='sealed')return;setPhase('opening');timer.current=setTimeout(()=>setPhase('revealed'),window.matchMedia('(prefers-reduced-motion: reduce)').matches?50:1900);}

 const featured=useMemo(()=>artworks.map(asWork),[artworks]);
 const vitrineCount=vitrineArtworks.length+1;
 const safeIndex=activeIndex%vitrineCount;
 const isZodiacVitrine=safeIndex===0;
 const vitrineWork=isZodiacVitrine?null:vitrineArtworks[safeIndex-1];

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
  setReady(true);
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
  const wheel=vitrineWheel.current;
  if(Math.abs(event.deltaY)<=Math.abs(event.deltaX) || now-wheel.switched<520)return;
  if(now-wheel.last>180)wheel.delta=0;
  wheel.last=now;
  wheel.delta+=event.deltaY*(event.deltaMode===0?1:event.deltaMode===1?16:window.innerHeight);
  if(Math.abs(wheel.delta)<28)return;
  stepVitrine(wheel.delta>0?1:-1);
  wheel.delta=0;
  wheel.switched=now;
 }

 function handleVitrineTouchStart(event: TouchEvent<HTMLElement>){
  if(event.target instanceof Element && event.target.closest('.bond-paper')){
   vitrineTouchRef.current=null;
   return;
  }
  const touch=event.touches.length===1?event.touches[0]:null;
  if(!touch){vitrineTouchRef.current=null;return;}
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
  const touch=event.touches.length===1?event.touches[0]:null;
  if(!touch){touchStartRef.current=null;return;}
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
  const recipientTitle = t(recipientWork.name, recipientWork.cn);
  const recipientDescription = t(recipientWork.descriptionEn ?? 'Curated digital art', recipientWork.desc);
  const letterMessage = message ?? t('A Space Cat for you. May you stay curious as your world grows bigger.', '送你一只宇航猫，\n愿你在更大的世界里，\n一直保持好奇。');
  return <div className="receive-demo" lang={locale}>
   <a className="skip" href="#main">{t('Skip to content', '跳到内容')}</a>
   <header className="header"><Link className="brand" href="/" aria-label={t('Mement home', 'Mement 首页')}><span className="brand-star">✦</span> Mement</Link><div className="header-end"><LanguageSwitch/><WalletTrigger/></div></header>
   <main id="main" className={'receive receive-'+phase}>
   <div className="receive-atmosphere"/><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="floor-glow"/>
   {phase==='sealed'||phase==='opening'?<section className="unboxing"><p className="eyebrow">SOMEONE THOUGHT OF YOU</p><div className={threeD?"present present-three":'present '+(phase==='opening'?'is-opening':'')}>{threeD?<GiftSculpture opening={phase==='opening'}/>:<><div className="present-light"/><img className="box-closed" src={A+'gift.png'} alt={t('Gift box ready to open', '等待打开的礼盒')}/><img className="box-open" src={A+'gift-open.png'} alt="" aria-hidden="true"/></>}</div>{phase==='sealed'&&<button className="receive-mode" onClick={()=>setThreeD(!threeD)}>{threeD ? t('Return to the image', '返回渲染图') : t('Try the 3D gift · Drag to rotate', '试试三维礼盒 · 拖动旋转')}</button>}<div className="unbox-copy" aria-live="polite"><h1>{phase==='opening' ? t('Your gift is opening…', '心意，正在展开…') : t('You received a gift', '你收到了一份礼物')}</h1><p>From Mement{to&&<span> / To {to}</span>}</p>{phase==='sealed'?<button className="button primary" onClick={open}>{t('Open gift ', '点击打开 ')}<Arrow/></button>:<div className="opening-progress" role="status" aria-label={t('Opening gift', '正在打开礼物')}/>}</div></section>:
   phase==='revealed'?<section className="unboxing reveal"><p className="eyebrow">A LITTLE CURIOSITY. A BIGGER WORLD.</p><div className="revealed-frame"><img src={A+recipientWork.image} className={recipientWork.cutout?'cutout':''} alt={recipientTitle}/></div><h1>{t('An artwork picked for you', '一份为你挑选的心意')}</h1><p>{recipientTitle}</p><button className="button primary" onClick={()=>setPhase('detail')}>{t('View gift ', '查看礼物 ')}<Arrow/></button></section>:
   phase==='letter'?<section className="letter-view"><button className="back" onClick={()=>setPhase('detail')}>{t('← Back to gift', '← 返回礼物')}</button><div className="letter"><span className="eyebrow">A NOTE, JUST FOR YOU</span><p>{letterMessage || t('Some things are better said with art.', '有些心意，不必用语言表达。')}</p><span className="signature">— Jimu</span></div><button className="button outline" onClick={()=>{try{sessionStorage.setItem('cryptogift-saved',saved?'no':'yes');setSaved(!saved)}catch{setNotice('save-failed')}}}>{saved ? t('Keepsake saved ♥', '已收藏这份心意 ♥') : t('Save keepsake ♡', '收藏这份心意 ♡')}</button><small>{t('This keepsake is saved for this browser session.', '收藏仅保存在本次浏览器会话中。')}</small></section>:
   phase==='full'?<section className="full-art"><button className="back" onClick={()=>setPhase('detail')}>{t('← Back to details', '← 返回详情')}</button><img src={A+recipientWork.image} alt={recipientTitle}/><div><h1>{recipientTitle}</h1><p>{t('2D artwork preview', '二维作品预览')}</p></div></section>:
   <section className="gift-detail"><button className="back" onClick={()=>setPhase('revealed')}>{t('← Back', '← 返回')}</button><div className="detail-display"><div className="revealed-frame"><img src={A+recipientWork.image} className={recipientWork.cutout?'cutout':''} alt={recipientTitle}/></div><button className="text-link" onClick={()=>setPhase('full')}>{t('View full artwork ↗', '完整欣赏 ↗')}</button></div><div className="detail-copy"><p className="eyebrow">A GIFT, JUST FOR YOU</p><h1>{recipientTitle}</h1><p>{recipientDescription}</p><dl><div><dt>From</dt><dd>Mement</dd></div><div><dt>To</dt><dd>{to || t('you.ai (sample)', 'you.ai（示例）')}</dd></div><div><dt>{t('Medium', '作品类型')}</dt><dd>{t(recipientWork.media === 'image' ? 'Digital image concept' : 'Digital art', recipientWork.tag)}</dd></div><div><dt>{t('Edition rules', '发行规则')}</dt><dd>{describeArtworkPolicy(recipientWork.policy, language)}</dd></div></dl><button className="button primary" onClick={()=>setPhase('letter')}>{t('Read their note ', '读一读 TA 的留言 ')}<Arrow/></button></div></section>}
   <Link className="receive-home" href="/">{t('Find a gift for someone ↗', '也为一个人挑选礼物 ↗')}</Link></main>
   <footer><Link className="brand" href="/"><span className="brand-star">✦</span> Mement</Link><span>A little more than a gift.</span><span><Link href="/creators/apply">{t('Apply as a creator ↗', '创作者申请 ↗')}</Link></span></footer>
   {notice&&<div className="toast" role="status">{t('This browser could not save the keepsake.', '浏览器无法保存收藏。')}</div>}
  </div>;
 }

 return <div className="boutique-shell boutique-viewport" lang={locale}>
  <a className="skip" href="#main">{t('Skip to content', '跳到内容')}</a>
  <header className="boutique-header">
   <button type="button" className="boutique-brand" onClick={backToVitrine} aria-label={t('Mement vitrine', 'Mement 街角橱窗')}>MEMENT</button>
   <nav className="boutique-nav" aria-label={t('Main navigation', '主导航')}>
    <button type="button" className={view==='vitrine'?'is-active':''} aria-current={view==='vitrine'?'page':undefined} onClick={backToVitrine}>{t('Vitrine', '橱窗')}</button>
    <button type="button" className={view==='room'?'is-active':''} aria-current={view==='room'?'page':undefined} onClick={enterRoom}>{t('Room', '展厅')}</button>
    <Link href="/creators/apply">{t('Creators', '创作者')}</Link>
    <WalletTrigger/>
    <LanguageSwitch/>
   </nav>
  </header>

  <main id="main" className="boutique-screens">
   {/* Screen 1: Street-Corner Vitrine */}
   <section
    className={`boutique-screen boutique-vitrine ${view==='vitrine'?'is-visible':'is-hidden'}`}
    inert={view!=='vitrine'}
    aria-hidden={view!=='vitrine'}
    aria-label={t('Showcase cabinet', '街角橱窗')}
    onWheel={handleVitrineWheel}
    onTouchStart={handleVitrineTouchStart}
    onTouchEnd={handleVitrineTouchEnd}
    onTouchCancel={()=>{vitrineTouchRef.current=null;}}
   >
    <div className="vitrine-cabinet">
     <div className="cabinet-top">
      <div className="cabinet-selection">
       <div className="cabinet-index" role="group" aria-label={t('Select a showcase', '切换橱窗展品')}>
        <button type="button" aria-pressed={safeIndex===0}
         aria-label={t('01 · Gilded Voxel Zodiac', '01 · 十二生肖 · 鎏金像素')} onClick={()=>setActiveIndex(0)}>01</button>
        {vitrineArtworks.map((work,index)=>{
         const position=index+1;
         return <button key={work.id} type="button" aria-pressed={safeIndex===position}
          aria-label={padIndex(position)+' · '+t(work.name,work.title)}
          onClick={()=>setActiveIndex(position)}>{padIndex(position)}</button>;
        })}
       </div>
       <span className="cabinet-current">{t('CURRENT VITRINE', '当期橱窗')}</span>
      </div>
      <div className="cabinet-meta">
       <span>{isZodiacVitrine?t('Gilded Voxel Zodiac · 0.06 BNB', '十二生肖特展 · 0.06 BNB'):vitrineWork && `${t('Permanent Collection', '常设陈列')} · ${vitrineWork.price} ${vitrineWork.currency}`}</span>
       <span>{isZodiacVitrine?t('2026 · Bingwu', '2026 · 丙午'):vitrineWork && `${artworkArtist(vitrineWork,language)} · ${vitrineWork.editionLimit} ${t('eds', '版')}`}</span>
      </div>
     </div>
     <DisplayCabinet objectKey={safeIndex}>
      {isZodiacVitrine ? <ZodiacDisplay live={ready&&view==='vitrine'}/>
       : vitrineWork && <ArtworkPresentation artwork={vitrineWork} cover active={view==='vitrine'}/>}
     </DisplayCabinet>
     <div className="cabinet-bottom">
      <div className="cabinet-caption" aria-live="polite">
       <h1>{isZodiacVitrine?t('Gilded Voxel Zodiac', '十二生肖 · 鎏金像素'):vitrineWork && t(vitrineWork.name,vitrineWork.title)}</h1>
       <p>{isZodiacVitrine?t('Luminous Voxel','流光体素'):vitrineWork && (language==='en' ? vitrineWork.descriptionEn ?? t('Curated Digital Art', '精选数字艺术') : vitrineWork.description)} · {padIndex(safeIndex)} / {String(vitrineCount).padStart(2,'0')}</p>
      </div>
      <div className="cabinet-actions">
       <a className="boutique-link" href="#gifts" onClick={event=>{event.preventDefault();enterRoom();requestAnimationFrame(()=>document.getElementById('room-heading')?.focus());}}>{t('Enter Room','步入展厅')} <Arrow/></a>
       {isZodiacVitrine?
        <Link className="boutique-btn cabinet-cta" href={zodiacSeries.route}>{t('Explore Zodiac','探索十二生肖')} <span aria-hidden="true">→</span></Link>:
        vitrineWork&&<Link className="boutique-btn cabinet-cta" href={'/gifts/'+vitrineWork.id}>{t('View & Gift','欣赏并赠礼')} <span aria-hidden="true">→</span></Link>}
      </div>
     </div>
    </div>
    {vitrineCount>1 && <div className="vitrine-swipe">
      <span className="vitrine-swipe-track" aria-hidden="true"/><span>{t('SCROLL TO SWITCH','上下滑动切换橱窗')}</span>
    </div>}
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
    onTouchCancel={()=>{touchStartRef.current=null;}}
   >
    <div className="room-top-bar">
     <div>
      <p className="room-eyebrow">{t('Room','展厅')} {padIndex(safeRoomPage)} · {t('Current Selection','当期精选')}</p>
      <h2 id="room-heading" tabIndex={-1}>{t('The Room','精选展厅')}</h2>
     </div>
     <nav className="room-section-nav" aria-label={t('Gallery rooms','展厅空间')}>
      <a href="#gifts" aria-current={roomSection==='permanent'?'page':undefined} onClick={event=>{event.preventDefault();openRoom('permanent');}}>{t('Permanent Collection','常设陈列')}</a>
      <a href="#series" aria-current={roomSection==='series'?'page':undefined} onClick={event=>{event.preventDefault();openRoom('series');}}>{t('Exhibitions','主题特展')}</a>
     </nav>
     <div className="room-top-meta">
      <span className="room-count">{roomSection === 'series' ? t('01 Exhibition', '01 场特展') : `${String(featured.length).padStart(2, '0')} ${t('Objects', '件展品')}`}</span>
      <button type="button" className="boutique-link" tabIndex={view==='room'?0:-1} onClick={backToVitrine}>{t('← Back to Vitrine','← 回到街角橱窗')}</button>
     </div>
    </div>

    {roomSection==='series' ? <div className="room-exhibitions">
     {giftSeries.map(series => {
      const activeSpec = getZodiacById(selectedZodiac);
      const liveZodiacs = ZODIAC_LIST.filter(item => item.available);
      const upcomingCount = ZODIAC_LIST.length - liveZodiacs.length;
      return <article className="room-exhibition room-exhibition-curated" key={series.slug}>
       <div className="room-exhibition-stage-col">
        <Link href={`${series.route}?sign=${selectedZodiac}`} className="room-exhibition-cabinet-link" aria-label={t(`Inspect ${activeSpec.nameEn} in 3D`, `在 3D 特展中赏玩 ${activeSpec.nameCn}`)}>
         <DisplayCabinet className="room-cabinet room-exhibition-niche">
          <ZodiacDisplay live={ready&&view==='room'} sign={selectedZodiac}/>
         </DisplayCabinet>
        </Link>
        <div className="room-exhibition-plaque">
         <span className="plaque-tag">{activeSpec.yearTag}</span>
         <strong>{t(activeSpec.nameEn, activeSpec.nameCn)}</strong>
         <span>{t(activeSpec.cryptoTheme, activeSpec.cryptoSubtitle)}</span>
        </div>
       </div>
       <div className="room-exhibition-caption">
        <p className="room-eyebrow">{t(series.code, series.code.replace('EXHIBITION', '主题特展'))} · {t('2026–2027 CURRENT', series.seasonTag)}</p>
        <h3>{t(series.titleEn,series.titleCn)}</h3>
        <p className="room-exhibition-lead">{t(
         'Twelve oriental zodiac sculptures reimagined in gilded 3D voxels—explore rotatable pieces, match by birthday, and switch 4 optical materials before sealing.',
         '以 3D 鎏金体素重塑东方十二地支。支持 360° 交互赏玩、按生辰匹配生肖与四重材质切换，现已开放 4 尊典藏预览。',
        )}</p>
        <div className="room-zodiac-grid" role="group" aria-label={t('Select a zodiac sculpture to preview', '选择生肖藏品预览')}>
         {liveZodiacs.map(item => {
          const isCurrent = item.id === selectedZodiac;
          return <button
           key={item.id}
           type="button"
           className={`room-zodiac-card ${isCurrent ? 'is-active' : ''}`}
           aria-pressed={isCurrent}
           onClick={() => setSelectedZodiac(item.id as ActiveZodiacId)}
          >
           <span className="room-zodiac-branch">{item.branch}</span>
           <span className="room-zodiac-info">
            <strong>{t(item.nameEn, item.nameCn)}</strong>
            <small>{t(item.cryptoTheme, item.cryptoSubtitle)}</small>
           </span>
          </button>;
         })}
        </div>
        <p className="room-zodiac-upcoming">{t(
         `${String(ACTIVE_ZODIAC_IDS.length).padStart(2,'0')} / ${ZODIAC_LIST.length} sculptures live · ${upcomingCount} more coming soon`,
         `已开放 ${String(ACTIVE_ZODIAC_IDS.length).padStart(2,'0')} / ${ZODIAC_LIST.length} 尊 3D 生肖 · 其余 ${upcomingCount} 尊预告中`,
        )}</p>
        <div className="room-exhibition-actions">
         <Link className="room-exhibition-cta" href={`${series.route}?sign=${selectedZodiac}`}>
          {t('Enter 3D Exhibition →', '步入 3D 生肖特展 →')}
         </Link>
         <Link className="boutique-link" href={`${series.route}?sign=${selectedZodiac}&checkout=1`}>
          {t(`Seal ${activeSpec.nameEn} ↗`, `直接封缄「${activeSpec.nameCn}」↗`)}
         </Link>
        </div>
       </div>
      </article>;
     })}
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
           <DisplayCabinet className="room-cabinet piece-niche">
            <ArtworkPresentation artwork={work} cover active={view==='room'&&pageIdx===safeRoomPage}/>
           </DisplayCabinet>
           <div className="boutique-plaque">
            <span className="plaque-index">{padIndex(globalIndex)}</span>
            <h3>{t(work.name,work.title)}</h3>
            <p className="plaque-meta">{artworkArtist(work,language)} · {work.editionLimit} {t('eds','版')}</p>
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
       aria-label={t('Previous gallery wall','上一面展墙')}
      >←</button>
      <span className="room-page-count" aria-live="polite"><span>{padIndex(safeRoomPage)}</span> / {String(totalPages).padStart(2, '0')}</span>
      <div className="pager-dots" role="group" aria-label={t('Gallery pages','展墙翻页')}>
       {pages.map((_, idx) => (
        <button
         key={idx}
         type="button"
         aria-pressed={idx===safeRoomPage}
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
       aria-label={t('Next gallery wall','下一面展墙')}
      >→</button>
      {totalPages>1&&<span className="pager-hint">{t('Swipe or use the arrow keys','左右滑动或按方向键切换整屏')}</span>}
     </div>}

     <div className="room-footer-links">
      <Link href="/receive" tabIndex={view==='room'?0:-1}>{t('Out of Plan · Birthday gift ↗','《计划之外》生日个例 ↗')}</Link>
     </div>
    </footer>
   </section>
  </main>

  {notice&&<div className="toast" role="status">{t('This browser could not save the keepsake.', '浏览器无法保存收藏。')}</div>}
 </div>;
}
