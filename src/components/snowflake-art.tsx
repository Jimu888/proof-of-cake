'use client';

import { useMemo } from 'react';
import { artBytes, sampleRecipient, shortArtValue } from '../lib/generative-art';
import { useArtCanvas } from './art-canvas';

const sectorAngle = Math.PI / 3;
const size = 320;
type Segment = [number, number, number, number];
type Plate = { x: number; y: number; rx: number; ry: number; rot?: number };
type Bokeh = { x: number; y: number; r: number; phase: number; speed: number; warm: boolean };

function crystal(seed: string) {
  const bytes = artBytes(seed);
  const ratio = (i: number) => bytes[i % bytes.length] / 255;

  // 1. Primary dendritic arm with central crystal spine, 5–6 tiered fern branches, secondary needles & faceted plates
  const branches: Segment[] = [[0, -14, 0, -124]];
  const fineNeedles: Segment[] = [];
  const plates: Plate[] = [];

  const tierCount = 5 + (bytes[0] % 2);
  for (let i = 0; i < tierCount; i++) {
    const t = i / (tierCount - 1);
    const y = 26 + t * 84;
    const spread = 0.72 + ratio(2 + i) * 0.28;
    const envelope = Math.sin(t * Math.PI * 0.88 + 0.22);
    const len = (18 + envelope * 36) * (0.88 + ratio(8 + i) * 0.24);
    const x = Math.sin(spread) * len;
    const tipY = y + Math.cos(spread) * len;

    for (const side of [-1, 1]) {
      branches.push([0, -y, side * x, -tipY]);
      // Secondary feathery frost sub-branches
      const subCount = len > 28 ? 3 : 2;
      for (let s = 1; s <= subCount; s++) {
        const st = s / (subCount + 0.65);
        const bx = side * x * st;
        const by = -(y + (tipY - y) * st);
        const subLen = len * (0.34 - st * 0.12) * (0.85 + ratio(14 + i + s) * 0.3);
        const a1 = spread - 0.52;
        const a2 = spread + 0.48;
        fineNeedles.push([bx, by, bx + side * Math.sin(a1) * subLen, by - Math.cos(a1) * subLen]);
        if (s < subCount) {
          fineNeedles.push([bx, by, bx + side * Math.sin(a2) * subLen * 0.72, by - Math.cos(a2) * subLen * 0.72]);
        }
      }
      // Tiny crystal frost buds at branch tips
      if (i >= 1 && i <= tierCount - 2) {
        plates.push({ x: side * x, y: -tipY, rx: 2.2, ry: 4.0, rot: side * spread * 0.5 });
      }
    }
  }

  // Faceted diamond crystal collar & ornate spearhead tip on main arm
  const spinePath =
    'M0 -18 L4.5 -32 L0 -46 L-4.5 -32 Z ' +
    'M0 -62 L3.4 -76 L0 -88 L-3.4 -76 Z ' +
    'M0 -136 L6.2 -124 L0 -111 L-6.2 -124 Z';

  // Interstitial 30-degree secondary lance between main arms (creates lush 12-point silhouette)
  const midLen = 48 + ratio(19) * 18;
  const subArmPath =
    `M0 -16 L0 -${midLen.toFixed(1)} ` +
    `M0 -${(midLen * 0.52).toFixed(1)} L-8 -${(midLen * 0.74).toFixed(1)} ` +
    `M0 -${(midLen * 0.52).toFixed(1)} L8 -${(midLen * 0.74).toFixed(1)} ` +
    `M0 -${(midLen + 9).toFixed(1)} L3.8 -${(midLen + 2).toFixed(1)} L0 -${(midLen - 5).toFixed(1)} L-3.8 -${(midLen + 2).toFixed(1)} Z`;

  const sector = branches.map(([a, b, c, d]) => `M${a.toFixed(1)} ${b.toFixed(1)}L${c.toFixed(1)} ${d.toFixed(1)}`).join('');
  const needles = fineNeedles.map(([a, b, c, d]) => `M${a.toFixed(1)} ${b.toFixed(1)}L${c.toFixed(1)} ${d.toFixed(1)}`).join('');

  const polygon = (sides: number, radius: number, inner = radius) =>
    Array.from({ length: sides }, (_, index) => {
      const a = index * 2 * Math.PI / sides - Math.PI / 2;
      const r = index % 2 ? inner : radius;
      return `${index ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
    }).join('') + 'Z';

  // Nested hexagonal ice core + delicate inner star rosette
  const outerHex = polygon(6, 28);
  const midHex = polygon(6, 17);
  const innerStar = polygon(12, 22, 10);

  // Subtle Christmas starlight bokeh & winter snowdust around the crystal
  const bokeh: Bokeh[] = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2 + ratio(i + 3) * 0.45;
    const dist = 62 + ratio(i + 11) * 86;
    return {
      x: Math.cos(a) * dist,
      y: Math.sin(a) * dist,
      r: 1.1 + ratio(i + 21) * 2.4,
      phase: ratio(i + 5) * Math.PI * 2,
      speed: 0.9 + ratio(i + 9) * 1.4,
      warm: i % 3 === 0,
    };
  });

  const palette = bytes[20] % 3;
  const palettes = [
    { color: '#ffeaf2', rim: '#ff8fb8', glow: '#ff9ec4', haloInner: 'rgba(255, 214, 130, 0.24)', haloMid: 'rgba(255, 138, 184, 0.16)', orbA: '#4adeb0', orbB: '#ff6b8b' },
    { color: '#e2fff8', rim: '#6ee7d8', glow: '#7ef0e0', haloInner: 'rgba(255, 216, 132, 0.24)', haloMid: 'rgba(94, 234, 212, 0.16)', orbA: '#ff738f', orbB: '#ffd479' },
    { color: '#f1e8ff', rim: '#c4a6ff', glow: '#cbb0ff', haloInner: 'rgba(255, 214, 130, 0.24)', haloMid: 'rgba(186, 148, 255, 0.17)', orbA: '#64e8c4', orbB: '#ff7e9d' },
  ][palette];
  return {
    sector,
    needles,
    spinePath,
    subArmPath,
    plates,
    outerHex,
    midHex,
    innerStar,
    bokeh,
    weight: 1.08 + ratio(19) * 0.35,
    color: palettes.color,
    rimColor: palettes.rim,
    glowColor: palettes.glow,
    haloInner: palettes.haloInner,
    haloMid: palettes.haloMid,
    orbA: palettes.orbA,
    orbB: palettes.orbB,
    warmAccent: '#ffd882',
  };
}

function drawFourPointStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.14, -r * 0.14, r, 0);
  ctx.quadraticCurveTo(r * 0.14, r * 0.14, 0, r);
  ctx.quadraticCurveTo(-r * 0.14, r * 0.14, -r, 0);
  ctx.quadraticCurveTo(-r * 0.14, -r * 0.14, 0, -r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function paintCrystal(
  ctx: CanvasRenderingContext2D,
  design: ReturnType<typeof crystal>,
  growth: number,
  glow: number,
  time = 0,
  reduced = false,
) {
  ctx.save();
  const floatY = reduced ? 0 : 4.2 * Math.sin(time * 1.15);
  const spin = reduced ? 0 : time * 0.14;
  const tiltX = reduced ? 1 : 0.94 + 0.06 * Math.cos(time * 0.72);
  ctx.translate(size / 2, size / 2 + floatY);

  // 1. Festive Christmas aurora ambiance: champagne-gold stars + emerald/crimson bokeh
  for (let i = 0; i < design.bokeh.length; i++) {
    const b = design.bokeh[i];
    const pulse = reduced ? 0.55 : 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(time * b.speed + b.phase));
    const driftY = reduced ? 0 : Math.sin(time * 0.55 + b.phase) * 4;
    if (b.warm) {
      drawFourPointStar(ctx, b.x, b.y + driftY, b.r * 2.7, design.warmAccent, 0.58 * pulse);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.36 * pulse;
      ctx.fillStyle = i % 2 === 0 ? design.orbA : design.orbB;
      ctx.beginPath();
      ctx.arc(b.x, b.y + driftY, b.r * 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Soft radiant festive aurora halo behind crystal
  const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 136);
  halo.addColorStop(0, design.haloInner);
  halo.addColorStop(0.42, design.haloMid);
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 136, 0, Math.PI * 2);
  ctx.fill();

  ctx.scale(tiltX, 1);
  ctx.rotate(spin);
  ctx.strokeStyle = design.color;
  ctx.fillStyle = design.rimColor;
  ctx.shadowColor = design.glowColor;
  ctx.shadowBlur = glow;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const outerHex = new Path2D(design.outerHex);
  const midHex = new Path2D(design.midHex);
  const innerStar = new Path2D(design.innerStar);
  const sector = new Path2D(design.sector);
  const needles = new Path2D(design.needles);
  const spine = new Path2D(design.spinePath);
  const subArm = new Path2D(design.subArmPath);

  const drawFullSnowflake = () => {
    // Faceted translucent hexagonal ice core
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fill(outerHex);
    ctx.globalAlpha = 0.24;
    ctx.fill(innerStar);
    ctx.restore();

    ctx.lineWidth = design.weight * 0.9;
    ctx.stroke(outerHex);
    ctx.lineWidth = design.weight * 0.7;
    ctx.stroke(midHex);
    ctx.stroke(innerStar);

    // 6 interstitial secondary crystal lances (30° offset)
    ctx.save();
    ctx.rotate(sectorAngle / 2);
    ctx.globalAlpha = 0.68;
    ctx.lineWidth = design.weight * 0.72;
    for (let i = 0; i < 6; i++) {
      ctx.stroke(subArm);
      ctx.rotate(sectorAngle);
    }
    ctx.restore();

    // 6 main dendritic crystal arms + fine frost needles + faceted diamond plates
    for (let i = 0; i < 6; i++) {
      ctx.lineWidth = design.weight * 1.15;
      ctx.stroke(sector);
      ctx.save();
      ctx.globalAlpha = 0.26;
      ctx.fill(spine);
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = design.weight * 0.85;
      ctx.stroke(spine);
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = design.weight * 0.56;
      ctx.stroke(needles);
      ctx.globalAlpha = 0.34;
      for (const p of design.plates) {
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rot) ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -p.ry);
        ctx.lineTo(p.rx, 0);
        ctx.lineTo(0, p.ry);
        ctx.lineTo(-p.rx, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      ctx.rotate(sectorAngle);
    }
  };

  if (growth < 1) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.shadowBlur = 0;
    drawFullSnowflake();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, 18 + 136 * growth, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = 0.35 + 0.65 * growth;
    drawFullSnowflake();
    ctx.restore();
  } else {
    drawFullSnowflake();
  }

  // Warm Christmas starlight crest gently glowing at the crystal heart
  const heartPulse = reduced ? 0.85 : 0.68 + 0.32 * Math.sin(time * 2.1);
  ctx.shadowColor = design.warmAccent;
  ctx.shadowBlur = 14;
  drawFourPointStar(ctx, 0, 0, 13.5 * heartPulse, design.warmAccent, 0.92);
  drawFourPointStar(ctx, 0, 0, 7, '#ffffff', 0.95);

  ctx.restore();
}

/** Transparent browser-side texture. Cache one returned canvas per seed and size in the particle scene. */
export function renderSnowflakeSprite(seed: string, pixels: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = pixels;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(pixels / size, pixels / size);
    paintCrystal(ctx, crystal(seed), 1, 8 * pixels / size, 0, true);
  }
  return canvas;
}

export default function SnowflakeArt({ address, active, crystallize = true }: { address: string; active: boolean; crystallize?: boolean }) {
  const design = useMemo(() => crystal(address), [address]);
  const canvas = useArtCanvas(size, size, active, (ctx, time, _, reduced) => {
    const growth = reduced || !crystallize ? 1 : 1 - Math.pow(1 - Math.min(1, time / 1.25), 3);
    const glow = reduced ? 9 : 9 + 2.5 * Math.sin(time * 1.2);
    paintCrystal(ctx, design, growth, glow * ctx.canvas.width / size, time, reduced);
  });
  const displayAddr = address.toLowerCase() === sampleRecipient ? 'alice.ai' : shortArtValue(address);
  return <figure className="snowflake-art">
    <div className="snowflake-image" role="img" aria-label="First Snow / 初雪">
      <canvas ref={canvas} aria-hidden="true"/>
      <svg className="art-first-paint" viewBox="0 0 320 320" aria-hidden="true">
        <g transform="translate(160 160)" stroke={design.color} fill="none" strokeWidth={design.weight} strokeLinecap="round" strokeLinejoin="round">
          <path d={design.outerHex} fill={design.color} fillOpacity=".12"/>
          <path d={design.innerStar} fill={design.color} fillOpacity=".2"/>
          {[0, 60, 120, 180, 240, 300].map(angle => <g className={active && crystallize ? "snowflake-growing-branch" : undefined} key={angle} transform={`rotate(${angle})`}>
            <path d={design.sector}/>
            <path d={design.spinePath} fill={design.color} fillOpacity=".24"/>
            <path d={design.needles} strokeOpacity=".7" strokeWidth={design.weight * 0.56}/>
          </g>)}
        </g>
      </svg>
    </div>
    <div className="snowflake-pedestal" aria-hidden="true">
      <span className="snowflake-pedestal-glow"/>
      <span className="snowflake-pedestal-cap"/>
      <span className="snowflake-pedestal-body"/>
    </div>
    <figcaption><span>CHRISTMAS EDITION · 2026</span><span>{displayAddr}</span></figcaption>
  </figure>;
}
