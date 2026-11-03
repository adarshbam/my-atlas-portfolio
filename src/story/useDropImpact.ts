import { useCallback, useEffect, useRef, type RefObject } from "react";

// Original, short Foley-style thud: a damped low body and a filtered grit transient.
// Generated once after the first gesture; no download or sound on page entry.
function thud(context: AudioContext) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .28), context.sampleRate);
  const samples = buffer.getChannelData(0);
  let seed = 317, low = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / context.sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    const noise = seed / 2147483648;
    low += .12 * (noise - low);
    const attack = Math.min(1, t / .002);
    const body = Math.sin(2 * Math.PI * (50 * t + 45 * .026 * (1 - Math.exp(-t / .026))));
    samples[i] = attack * (body * .58 * Math.exp(-t * 25) + low * .5 * Math.exp(-t * 42) + noise * .07 * Math.exp(-t * 150));
  }
  return buffer;
}

export function useDropImpact(scene: RefObject<HTMLElement | null>) {
  const context = useRef<AudioContext | null>(null), buffer = useRef<AudioBuffer | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null), generation = useRef(0);
  const ready = useRef<Promise<void>>(Promise.resolve());
  const stop = useCallback(() => {
    generation.current++;
    source.current?.stop();
    source.current?.disconnect();
    source.current = null;
  }, []);
  const arm = useCallback(() => {
    stop();
    try {
      context.current ??= new AudioContext();
      buffer.current ??= thud(context.current);
      ready.current = context.current.resume().catch(() => {});
    } catch { /* The visual experiment remains usable when audio is unavailable. */ }
    return generation.current;
  }, [stop]);
  const play = useCallback(async (request: number) => {
    await ready.current;
    const ctx = context.current, rect = scene.current?.getBoundingClientRect();
    if (request !== generation.current || document.hidden || !rect || rect.bottom <= 0 || rect.top >= innerHeight || ctx?.state !== "running" || !buffer.current) return;
    const hit = ctx.createBufferSource(), gain = ctx.createGain();
    hit.buffer = buffer.current;
    gain.gain.value = .65;
    hit.connect(gain);gain.connect(ctx.destination);source.current = hit;
    hit.onended = () => { hit.disconnect();gain.disconnect();if (source.current === hit) source.current = null; };
    hit.start();
  }, [scene]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stop(); });
    if (scene.current) observer.observe(scene.current);
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", hide);
    document.addEventListener("story:native-play", stop);
    return () => {
      observer.disconnect();document.removeEventListener("visibilitychange", hide);document.removeEventListener("story:native-play", stop);stop();
      const ctx = context.current;context.current = null;buffer.current = null;
      if (ctx) void ctx.close();
    };
  }, [scene, stop]);
  return { arm, play };
}
