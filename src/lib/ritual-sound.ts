let context: AudioContext | undefined;

export function unlockRitualSound() {
  try {
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume().catch(() => {});
  } catch { /* Audio is optional. */ }
}

function tone(hz: number, end: number, duration: number, volume: number, delay = 0) {
  if (!context || context.state === 'closed') return;
  const at = context.currentTime + delay;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.frequency.setValueAtTime(hz, at);
  osc.frequency.exponentialRampToValueAtTime(end, at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain).connect(context.destination);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  osc.start(at);
  osc.stop(at + duration);
}

export function playSealStamp() { tone(115, 52, 0.23, 0.055); }
export function playUnsealSlide() { tone(630, 280, 0.2, 0.019); }
export function playLightReveal() {
  tone(440, 439, 0.42, 0.017);
  tone(660, 659, 0.47, 0.01, 0.05);
}
