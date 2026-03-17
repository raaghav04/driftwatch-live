export class ClassicSfx {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastAt = 0;
    this.ambient = null;
    this.ambientGain = null;
    this.noiseBuffer = null;
  }

  ensure() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  tone({ type = "sine", freq = 440, dur = 0.06, vol = 0.018, slide = 0, delay = 0 } = {}) {
    const ctx = this.ensure();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, now + dur);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  tone2(
    a = { type: "triangle", freq: 420, dur: 0.05, vol: 0.01, slide: 0, delay: 0 },
    b = { type: "sine", freq: 620, dur: 0.05, vol: 0.008, slide: 0, delay: 0.01 }
  ) {
    this.tone(a);
    this.tone(b);
  }

  staticBurst(vol = 0.0035, dur = 0.06) {
    const ctx = this.ensure();
    if (!ctx) return;
    if (!this.noiseBuffer) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buffer;
    }
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.Q.setValueAtTime(0.8, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.buffer = this.noiseBuffer;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + dur + 0.02);
  }

  startAmbient() {
    const ctx = this.ensure();
    if (!ctx || this.ambient) return;
    if (!this.noiseBuffer) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.4;
      this.noiseBuffer = buffer;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(180, ctx.currentTime);
    filter.Q.setValueAtTime(0.45, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0032, ctx.currentTime + 0.8);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    this.ambient = src;
    this.ambientGain = gain;
  }

  stopAmbient() {
    if (!this.ambient || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.ambientGain?.gain.cancelScheduledValues(now);
    this.ambientGain?.gain.setValueAtTime(this.ambientGain.gain.value, now);
    this.ambientGain?.gain.linearRampToValueAtTime(0.0001, now + 0.35);
    const src = this.ambient;
    window.setTimeout(() => {
      try {
        src.stop();
      } catch {}
    }, 380);
    this.ambient = null;
    this.ambientGain = null;
  }

  play(kind = "click") {
    const t = performance.now();
    if (t - this.lastAt < 32) return;
    this.lastAt = t;

    if (kind === "hover") {
      this.tone2(
        { type: "triangle", freq: 620, dur: 0.03, vol: 0.01, slide: 30 },
        { type: "sine", freq: 820, dur: 0.025, vol: 0.007, delay: 0.004, slide: -20 }
      );
      return;
    }
    if (kind === "open") {
      this.tone2(
        { type: "triangle", freq: 280, dur: 0.07, vol: 0.015, slide: 70 },
        { type: "sine", freq: 560, dur: 0.08, vol: 0.012, delay: 0.04, slide: 40 }
      );
      this.staticBurst(0.0022, 0.05);
      return;
    }
    if (kind === "send") {
      this.tone2(
        { type: "triangle", freq: 380, dur: 0.06, vol: 0.015, slide: 100 },
        { type: "square", freq: 700, dur: 0.04, vol: 0.008, delay: 0.05, slide: 25 }
      );
      return;
    }
    if (kind === "toggle") {
      this.tone2(
        { type: "square", freq: 240, dur: 0.04, vol: 0.009 },
        { type: "triangle", freq: 300, dur: 0.045, vol: 0.008, delay: 0.03 }
      );
      return;
    }
    if (kind === "confirm") {
      this.tone2(
        { type: "triangle", freq: 310, dur: 0.05, vol: 0.014, slide: 95 },
        { type: "sine", freq: 630, dur: 0.06, vol: 0.01, delay: 0.03, slide: 45 }
      );
      return;
    }
    if (kind === "warp") {
      this.tone2(
        { type: "sawtooth", freq: 190, dur: 0.09, vol: 0.012, slide: 420 },
        { type: "triangle", freq: 420, dur: 0.1, vol: 0.01, delay: 0.02, slide: 280 }
      );
      this.staticBurst(0.0028, 0.08);
      return;
    }
    if (kind === "alarm") {
      this.tone({ type: "square", freq: 220, dur: 0.07, vol: 0.010, slide: 0 });
      this.tone({ type: "square", freq: 180, dur: 0.06, vol: 0.009, delay: 0.08, slide: 0 });
      return;
    }
    if (kind === "glitch") {
      this.staticBurst(0.0038, 0.07);
      this.tone({ type: "square", freq: 980, dur: 0.03, vol: 0.006, slide: -120 });
      return;
    }
    this.tone2(
      { type: "triangle", freq: 300, dur: 0.045, vol: 0.012, slide: 30 },
      { type: "sine", freq: 470, dur: 0.03, vol: 0.007, delay: 0.01, slide: 20 }
    );
  }
}
