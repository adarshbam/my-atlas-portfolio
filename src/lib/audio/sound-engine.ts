/** Recorded foley, driven by deliberate interaction lifecycles. */
export type Interaction = {
  id: string;
  kind: "cover-open" | "cover-close" | "page";
  phase: "start" | "update" | "commit" | "cancel";
  from: number;
  to: number;
  progress?: number;
  velocity?: number;
};
const config = {
  preference: "atlas.sound.enabled.v1",
  master: 0.3,
  voices: 3,
  fade: 0.025,
  movement: 0.3,
  landing: 0.22,
  brush: 0.12,
  openingMovement: 0.16,
  openingAttack: 0.18,
  openingSmoothing: 0.12,
  openingLanding: 0.1,
  accent: 0.018,
  accentDuration: 0.42,
  accentFrequencies: [293.66, 440],
  files: ["cover-open", "cover-close", "page-move", "page-land", "brush"],
} as const;
type Voice = {
  source: AudioBufferSourceNode | OscillatorNode;
  gain: GainNode;
  id: string;
  priority: number;
};
class SoundEngine {
  private enabled = false;
  private reduced = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private voices = new Set<Voice>();
  private interactions = new Map<string, Interaction>();
  private listeners = new Set<() => void>();
  constructor() {
    try {
      this.enabled = localStorage.getItem(config.preference) === "true";
    } catch {
      /* Silent if storage unavailable. */
    }
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getMuted = () => !this.enabled;
  getSnapshot = () => this.enabled;
  setReduced(value: boolean) {
    this.reduced = value;
    if (value) this.cancelAll();
  }
  toggle = () => {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(config.preference, String(this.enabled));
    } catch {
      /* Keep session preference. */
    }
    if (this.enabled) void this.prepare();
    else this.cancelAll();
    this.listeners.forEach((listener) => listener());
  };
  /** Gesture unlock only: never queue interactions for late playback. */
  async prepare() {
    if (!this.enabled || document.hidden) return;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = config.master;
        this.master.connect(this.ctx.destination);
      }
      await this.ctx.resume();
      if (!this.loading)
        this.loading = Promise.all(
          config.files.map(async (name) => {
            try {
              const response = await fetch(`/audio/${name}.mp3`);
              if (!response.ok) return;
              const buffer = await this.ctx!.decodeAudioData(
                await response.arrayBuffer(),
              );
              let peak = 0;
              for (let c = 0; c < buffer.numberOfChannels; c++)
                for (const v of buffer.getChannelData(c))
                  peak = Math.max(peak, Math.abs(v));
              if (peak > 0)
                for (let c = 0; c < buffer.numberOfChannels; c++) {
                  const data = buffer.getChannelData(c);
                  for (let i = 0; i < data.length; i++) data[i] *= 0.7 / peak;
                }
              this.buffers.set(name, buffer);
            } catch {
              /* Missing or blocked audio never blocks the portfolio. */
            }
          }),
        ).then(() => {});
      await this.loading;
    } catch {
      /* Autoplay denial or unavailable Web Audio: silent fallback. */
    }
  }
  private available() {
    return (
      this.enabled &&
      !this.reduced &&
      !document.hidden &&
      this.ctx?.state === "running"
    );
  }
  private stop(voice: Voice) {
    this.voices.delete(voice);
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0, now, config.fade / 3);
    try {
      voice.source.stop(now + config.fade);
    } catch {
      /* Already ended. */
    }
  }
  private allocate(
    source: Voice["source"],
    gain: GainNode,
    id: string,
    priority: number,
  ) {
    if (this.voices.size >= config.voices) {
      const oldest = [...this.voices].sort(
        (a, b) => a.priority - b.priority,
      )[0];
      if (oldest.priority > priority) return false;
      this.stop(oldest);
    }
    const voice = { source, gain, id, priority };
    this.voices.add(voice);
    source.onended = () => {
      this.voices.delete(voice);
      source.disconnect();
      gain.disconnect();
    };
    source.connect(gain);
    gain.connect(this.master!);
    return true;
  }
  private sample(
    name: string,
    id: string,
    volume: number,
    priority = 1,
    loop = false,
    attack: number = config.fade,
  ) {
    if (!this.available() || !this.buffers.has(name)) return;
    const ctx = this.ctx!,
      source = ctx.createBufferSource(),
      gain = ctx.createGain();
    source.buffer = this.buffers.get(name)!;
    source.loop = loop;
    if (loop) {
      source.loopStart = config.fade;
      source.loopEnd = Math.max(
        config.fade * 2,
        source.buffer.duration - config.fade,
      );
    }
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
    if (!this.allocate(source, gain, id, priority)) return;
    source.start();
  }
  dispatch(event: Interaction) {
    if (event.phase === "start") {
      if (this.interactions.has(event.id)) return;
      this.cancelAll();
      this.interactions.set(event.id, event);
      this.sample(
        event.kind === "cover-open" ? "cover-open" : "page-move",
        event.id,
        event.kind === "cover-open" ? config.openingMovement : config.movement,
        3,
        true,
        event.kind === "cover-open" ? config.openingAttack : config.fade,
      );
      return;
    }
    if (!this.interactions.has(event.id)) return;
    if (event.phase === "update") {
      const speed = Math.min(1, Math.max(0, Math.abs(event.velocity ?? 0)));
      const opening = this.interactions.get(event.id)?.kind === "cover-open";
      this.voices.forEach((voice) => {
        if (
          voice.id === event.id &&
          this.ctx &&
          voice.source instanceof AudioBufferSourceNode &&
          voice.source.loop
        ) {
          voice.gain.gain.setTargetAtTime(
            (opening ? config.openingMovement : config.movement) * speed,
            this.ctx.currentTime,
            opening ? config.openingSmoothing : config.fade,
          );
          voice.source.playbackRate.setTargetAtTime(
            0.8 + speed * 0.4,
            this.ctx.currentTime,
            config.fade,
          );
        }
      });
      return;
    }
    this.voices.forEach((voice) => {
      if (voice.id === event.id) this.stop(voice);
    });
    this.interactions.delete(event.id);
    if (event.phase === "cancel") return;
    this.sample(
      event.kind === "cover-close" ? "cover-close" : "page-land",
      event.id,
      event.kind === "cover-open" ? config.openingLanding : config.landing,
      3,
    );
  }
  authorSelected() {
    this.sample("brush", "author", config.brush);
  }
  accent() {
    if (!this.available()) return;
    const ctx = this.ctx!;
    config.accentFrequencies.forEach((frequency) => {
      const source = ctx.createOscillator(),
        gain = ctx.createGain();
      source.frequency.value = frequency;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(
        config.accent,
        ctx.currentTime + config.fade,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + config.accentDuration,
      );
      if (!this.allocate(source, gain, "accent", 0)) return;
      source.start();
      source.stop(ctx.currentTime + config.accentDuration);
    });
  }
  cancelAll() {
    this.interactions.clear();
    this.voices.forEach((voice) => this.stop(voice));
  }
  hide() {
    this.cancelAll();
    void this.ctx?.suspend().catch(() => {});
  }
}
export const soundEngine = new SoundEngine();
