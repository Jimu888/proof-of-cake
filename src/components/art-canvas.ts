'use client';

import { useLayoutEffect, useRef } from 'react';

export function useArtCanvas(
  width: number, height: number, active: boolean,
  paint: (ctx: CanvasRenderingContext2D, seconds: number, delta: number, reduced: boolean) => void,
) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const painter = useRef(paint);
  useLayoutEffect(() => { painter.current = paint; }, [paint]);

  useLayoutEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext('2d');
    if (!element || !ctx) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let start: number | undefined;
    let previous: number | undefined;
    function render(now: number) {
      if (!element || !ctx) return;
      start ??= now;
      ctx.setTransform(element.width / width, 0, 0, element.height / height, 0, 0);
      ctx.clearRect(0, 0, width, height);
      painter.current(ctx, (now - start) / 1000, Math.min(0.033, (now - (previous ?? now)) / 1000), motion.matches || !active);
      element.dataset.painted = '';
      previous = now;
      if (active && !motion.matches) frame = requestAnimationFrame(render);
    }
    function resize() {
      if (!element) return;
      cancelAnimationFrame(frame);
      const { width: cssWidth, height: cssHeight } = element.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 3);
      element.width = Math.max(1, Math.round(cssWidth * dpr));
      element.height = Math.max(1, Math.round(cssHeight * dpr));
      render(performance.now());
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    motion.addEventListener('change', resize);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener('change', resize);
    };
  }, [width, height, active]);

  // Repaint stationary previews when their inputs change.
  useLayoutEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext('2d');
    if (!element || !ctx || (active && !matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    ctx.clearRect(0, 0, width, height);
    paint(ctx, 0, 0, true);
  }, [active, height, paint, width]);
  return canvas;
}
