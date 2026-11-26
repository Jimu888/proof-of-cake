'use client';

import { useMemo, useRef, type PointerEvent } from 'react';
import { artBytes, bondPreviewHash, sampleRecipient, sampleSender, shortArtValue } from '../lib/generative-art';
import { useArtCanvas } from './art-canvas';

const width = 800;
const height = 450;
const sampleDate = '2026.11.25';
type Point = { x: number; y: number };
type Spring = Point & { vx: number; vy: number };

function threadDesign(sender: string, recipient: string, hash: string) {
  const bytes = artBytes(sender, recipient, hash);
  const ratio = (index: number) => bytes[index] / 255;
  const angle = (ratio(0) - 0.5) * 0.16;
  const scaleX = 5.15 + ratio(1) * 0.45;
  const scaleY = 5.05 + ratio(2) * 0.4;
  const center = { x: 400, y: 214 };

  // Smooth parametric calligraphic heart loop (starts and exits gracefully at the bottom tip)
  const heartSamples = 28;
  const loop: Point[] = [];
  for (let i = 0; i <= heartSamples; i++) {
    const t = -Math.PI + (i / heartSamples) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3) * scaleX;
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scaleY;
    // Slight graceful crossing at the bottom knot
    const cross = i === 0 ? -7 : i === heartSamples ? 7 : 0;
    const rx = (hx + cross) * Math.cos(angle) - hy * Math.sin(angle);
    const ry = (hx + cross) * Math.sin(angle) + hy * Math.cos(angle);
    loop.push({ x: center.x + rx, y: center.y + ry });
  }

  const leftEntry: Point[] = [
    { x: -12, y: 232 + (ratio(3) - 0.5) * 18 },
    { x: 96, y: 216 + (ratio(4) - 0.5) * 20 },
    { x: 205, y: 254 + (ratio(5) - 0.5) * 16 },
    { x: 306, y: 286 + (ratio(6) - 0.5) * 12 },
  ];
  const rightExit: Point[] = [
    { x: 494, y: 288 + (ratio(7) - 0.5) * 12 },
    { x: 598, y: 250 + (ratio(8) - 0.5) * 16 },
    { x: 704, y: 222 + (ratio(9) - 0.5) * 18 },
    { x: 812, y: 234 + (ratio(10) - 0.5) * 16 },
  ];

  const points = [...leftEntry, ...loop, ...rightExit];
  return {
    points,
    heartStart: leftEntry.length,
    heartEnd: leftEntry.length + loop.length - 1,
    center,
    frequency: 1.35 + ratio(5) * 0.45,
    wavelength: 0.014 + ratio(6) * 0.005,
    amplitude: 6.2 + ratio(7) * 3.0,
    ink: `rgb(${164 + Math.round(ratio(8) * 10)} 26 ${34 + Math.round(ratio(9) * 4)})`,
  };
}

function threadPath(points: Point[]) {
  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const before = points[i - 1] ?? points[i];
    const a = points[i];
    const b = points[i + 1];
    const after = points[i + 2] ?? b;
    path += `C${a.x + (b.x - before.x) / 6} ${a.y + (b.y - before.y) / 6} ${b.x - (after.x - a.x) / 6} ${b.y - (after.y - a.y) / 6} ${b.x} ${b.y}`;
  }
  return path;
}

export default function AlgorithmicBondArt({ sender, recipient, transaction, orderId, date, active }: {
  sender: string; recipient: string; transaction?: string; orderId?: string; date?: string; active: boolean;
}) {
  const hash = transaction ?? bondPreviewHash(sender, recipient, orderId);
  const design = useMemo(() => threadDesign(sender, recipient, hash), [sender, recipient, hash]);
  const springs = useRef<Spring[]>([]);
  const pointer = useRef<(Point & { at: number }) | null>(null);
  const canvas = useArtCanvas(width, height, active, (ctx, time, delta, reduced) => {
    const breeze = pointer.current;
    const strength = breeze ? Math.max(0, 1 - (performance.now() - breeze.at) / 480) : 0;
    const breathe = reduced ? 1 : 1 + 0.032 * Math.sin(time * 1.85);

    const computePoints = (phaseOffset: number, scaleFactor = 1) =>
      reduced ? design.points : design.points.map((point, index) => {
        const isHeart = index >= design.heartStart && index <= design.heartEnd;
        const baseX = isHeart ? design.center.x + (point.x - design.center.x) * breathe : point.x;
        const baseY = isHeart ? design.center.y + (point.y - design.center.y) * breathe : point.y;
        const waveWeight = isHeart ? 0.42 : 1;
        const waveY = (Math.sin(baseX * design.wavelength - (time + phaseOffset) * design.frequency) +
          0.38 * Math.sin(index * 0.55 + (time + phaseOffset) * 1.15)) * design.amplitude * waveWeight * scaleFactor;
        const waveX = Math.cos(baseX * design.wavelength * 0.7 + (time + phaseOffset) * 0.95) * 2.4 * waveWeight * scaleFactor;

        if (phaseOffset !== 0) {
          const spring = springs.current[index] ?? { x: 0, y: 0, vx: 0, vy: 0 };
          return { x: baseX + waveX + spring.x * 0.65, y: baseY + waveY + spring.y * 0.65 };
        }

        const spring = springs.current[index] ??= { x: 0, y: 0, vx: 0, vy: 0 };
        const y = baseY + waveY;
        const dx = baseX - (breeze?.x ?? -1000);
        const dy = y - (breeze?.y ?? -1000);
        const distance = Math.hypot(dx, dy);
        const gust = strength * Math.exp(-Math.pow(distance / 64, 2));
        spring.vx += (dx / Math.max(12, distance) * gust * 540 - 26 * spring.x - 6.5 * spring.vx) * delta;
        spring.vy += (dy / Math.max(12, distance) * gust * 720 - 26 * spring.y - 6.5 * spring.vy) * delta;
        spring.x += spring.vx * delta;
        spring.y += spring.vy * delta;
        return { x: baseX + waveX + spring.x, y: y + spring.y };
      });

    const points = computePoints(0, 1);
    const mainPath = new Path2D(threadPath(points));

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Delicate trailing gossamer silk echo for continuous depth
    if (!reduced) {
      const echoPath = new Path2D(threadPath(computePoints(-0.42, 0.85)));
      ctx.save();
      ctx.strokeStyle = 'rgba(166, 28, 36, 0.16)';
      ctx.lineWidth = 1.25;
      ctx.stroke(echoPath);
      ctx.restore();
    }

    // Primary crimson calligraphic silk thread
    ctx.save();
    ctx.strokeStyle = design.ink;
    ctx.lineWidth = 2.15;
    ctx.shadowColor = 'rgba(166, 28, 36, 0.22)';
    ctx.shadowBlur = 4;
    ctx.stroke(mainPath);
    ctx.restore();

    // Subtle gliding light pulse along the continuous thread
    if (!reduced && points.length > 2) {
      const progress = (time * 0.16) % 1;
      const idx = progress * (points.length - 1);
      const i0 = Math.floor(idx);
      const i1 = Math.min(points.length - 1, i0 + 1);
      const f = idx - i0;
      const gx = points[i0].x + (points[i1].x - points[i0].x) * f;
      const gy = points[i0].y + (points[i1].y - points[i0].y) * f;
      const glow = ctx.createRadialGradient(gx, gy, 0.5, gx, gy, 11);
      glow.addColorStop(0, 'rgba(242, 116, 58, 0.92)');
      glow.addColorStop(0.45, 'rgba(186, 36, 44, 0.42)');
      glow.addColorStop(1, 'rgba(186, 36, 44, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(gx, gy, 11, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const dateText = /^\d{4}-\d{2}-\d{2}/.test(date ?? '') ? date!.slice(0, 10).replaceAll('-', '.') : sampleDate;
  const senderLabel = sender.toLowerCase() === sampleSender ? 'jimu.ai' : shortArtValue(sender);
  const recipientLabel = recipient.toLowerCase() === sampleRecipient ? 'alice.ai' : shortArtValue(recipient);
  const blockNum = 48_200_000 + (parseInt(hash.slice(2, 8), 16) % 900_000);
  function brush(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: (event.clientX - rect.left) * width / rect.width,
      y: (event.clientY - rect.top) * height / rect.height,
      at: performance.now(),
    };
  }

  return <figure className="bond-paper" aria-label="Blockbound Thread / 区块红线" onPointerMove={brush}
    onPointerLeave={() => { pointer.current = null; }} onPointerCancel={() => { pointer.current = null; }}>
    <svg className="bond-guides" viewBox="0 0 800 450" aria-hidden="true">
      <g fill="none" stroke="#222222" strokeWidth=".65" opacity=".17">
        {Array.from({ length: 19 }, (_, i) => <path key={i} d={`M${40 * (i + 1)} 30V420`}/>)}
        {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M30 ${45 + 30 * i}H770`}/>)}
        {[48, 88, 128, 168].map(radius => <circle key={radius} cx="400" cy="225" r={radius}/>)}
      </g>
      <path d="M13 24H35M24 13V35M765 24H787M776 13V35M13 426H35M24 415V437M765 426H787M776 415V437" fill="none" stroke="#222222" strokeWidth=".8" opacity=".46"/>
    </svg>
    <div className="bond-thread" aria-hidden="true">
      <canvas ref={canvas}/>
      <svg className="art-first-paint" viewBox="0 0 800 450"><path d={threadPath(design.points)} fill="none" stroke={design.ink} strokeWidth="2.05"/></svg>
    </div>
    <span className="bond-sender" title={sender}>FROM // {senderLabel}</span>
    <span className="bond-recipient" title={recipient}>TO // {recipientLabel}</span>
    <figcaption className="bond-caption">
      <span>BNB BLOCK #{blockNum.toLocaleString('en-US')}</span>
      <span>TIMESTAMP // {dateText} UTC</span>
      <strong>BLOCKBOUND THREAD</strong>
    </figcaption>
  </figure>;
}
