/* Groove sketches: simplified, synthesized rhythm demos so beginners can hear
 * what a genre's beat feels like. Everything is generated with Web Audio; no samples.
 *
 * Pattern strings: 'x' = hit, '.' = rest. Bass/808/log/cowbell/arp strings use digits
 * 0-7 as scale degrees relative to the current chord root ('.' = rest).
 */
(function () {
  const P = {
    four:      { k: 'x...x...x...x...', c: '....x.......x...', h: '..x...x...x...x.', b: '..0...0...0...0.', pad: 1, mode: 'minor' },
    techno:    { k: 'x...x...x...x...', h: '..x...x...x...x.', r: '...x.......x..x.', b: '.0.0.0.0.0.0.0.0', mode: 'minor' },
    boombap:   { k: 'x.........x.x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', b: '0.....3...0.....', swing: 0.14, pad: 1, mode: 'minor' },
    lofi:      { k: 'x.........x.x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', b: '0.......2.......', swing: 0.2, pad: 1, vinyl: 1, mode: 'major7' },
    trap:      { k: 'x......x..x.....', s: '........x.......', h: 'x.x.x.x.xxx.x.xx', e: '0......0..3.....', pad: 1, mode: 'minor' },
    drill:     { k: 'x.....x...x.....', s: '........x.....x.', h: 'x..x..x.x..x..x.', e: '0.....5...0..3..', glide: 1, pad: 1, mode: 'minor' },
    phonk:     { k: 'x......x..x.....', s: '........x.......', h: 'x.x.x.x.x.x.x.x.', w: '0..3..0..5..3.0.', e: '0.......0.......', mode: 'minor' },
    dnb:       { k: 'x.........x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', b: '0.......0..3....', pad: 1, mode: 'minor' },
    halftime:  { k: 'x.........x.....', s: '........x.......', h: '..x...x...x...x.', b: '0.0.0.0.3.3.0.0.', wob: 1, pad: 1, mode: 'minor' },
    garage:    { k: 'x......x..x.....', s: '....x.......x...', h: '..x...x.xx.x..x.', b: '0..0...3..0..5..', swing: 0.12, pad: 1, mode: 'minor' },
    rock:      { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', b: '0.0.0.0.0.0.0.0.', pad: 1, mode: 'major' },
    punk:      { k: 'x...x...x...x...', s: '..x...x...x...x.', h: 'x.x.x.x.x.x.x.x.', b: '0.0.0.0.0.0.0.0.', pad: 1, mode: 'major' },
    metal:     { k: 'xxxxxxxxxxxxxxxx', s: '....x.......x...', h: 'x...x...x...x...', b: '0000000000000000', pad: 1, mode: 'minor' },
    ballad:    { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', b: '0.......0.......', soft: 1, pad: 1, mode: 'major' },
    reggae:    { k: '........x.......', r: '........x.......', h: 'x.x.x.x.x.x.x.x.', q: '..x...x...x...x.', b: '0...0.3...5.3...', mode: 'minor' },
    dancehall: { k: 'x......xx.......', s: '....x.......x...', r: '..x..x....x..x..', b: '0......0........', mode: 'minor' },
    dembow:    { k: 'x...x...x...x...', s: '...x..x....x..x.', h: 'x.x.x.x.x.x.x.x.', e: '0.......0.......', pad: 1, mode: 'minor' },
    afro:      { k: 'x.......x.x.....', c: '....x.......x...', r: '..x..x...x..x...', h: 'xxxxxxxxxxxxxxxx', b: '0...3.....0.5...', soft: 1, pad: 1, mode: 'major' },
    amapiano:  { k: 'x...x...x...x...', c: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', l: '..0...0..0.3..0.', soft: 1, pad: 1, mode: 'minor' },
    funk:      { k: 'x..x..x...x.....', s: '....x..x.x..x...', h: 'xxxxxxxxxxxxxxxx', b: '0..0..3.5..0.7.5', soft: 1, mode: 'minor' },
    disco:     { k: 'x...x...x...x...', s: '....x.......x...', o: '..x...x...x...x.', b: '0707070707070707', pad: 1, mode: 'minor' },
    swing:     { steps: 12, y: 'x..x.xx..x.x', k: 'x..x..x..x..', h: '...x.....x..', b: '0..2..4..5..', soft: 1, pad: 1, mode: 'major7' },
    sixeight:  { steps: 12, k: 'x.....x..x..', s: '...x.....x..', h: 'xxxxxxxxxxxx', b: '0..2..4..5..', soft: 1, pad: 1, mode: 'major' },
    bossa:     { k: 'x..xx..xx..xx..x', r: 'x..x..x...x..x..', h: 'xxxxxxxxxxxxxxxx', b: '0..4..0.0..4..0.', soft: 1, pad: 1, mode: 'major7' },
    train:     { k: 'x...x...x...x...', s: '..x...x...x...x.', h: 'xxxxxxxxxxxxxxxx', b: '0...4...0...4...', soft: 1, pad: 1, mode: 'major' },
    ambient:   { pad: 1, drone: 1, a: 'x.....x.....x...', mode: 'major7' },
    cinematic: { t: 'x..x..x...x.x...', k: 'x.......x.......', b: '0...............', pad: 1, mode: 'minor' },
    chip:      { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', a: '0.2.4.7.0.2.4.7.', b: '0...0...0...0...', square: 1, mode: 'major' }
  };

  const TRACK_LABELS = { k: 'Kick', s: 'Snare', c: 'Clap', h: 'Hi-hat', o: 'Open hat', r: 'Rim', y: 'Ride', t: 'Toms',
    q: 'Skank', b: 'Bass', e: '808', l: 'Log drum', w: 'Cowbell', a: 'Melody' };

  const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10],
    major: [0, 2, 4, 5, 7, 9, 11],
    major7: [0, 2, 4, 5, 7, 9, 11]
  };
  const PROGRESSIONS = { minor: [0, 5, 2, 6], major: [0, 4, 5, 3], major7: [1, 4, 0, 0] }; // i-VI-III-VII / I-V-vi-IV / ii-V-I-I
  const ROOT_HZ = 55; // A1

  function degreeToSemis(scale, deg) {
    const oct = Math.floor(deg / 7);
    return scale[((deg % 7) + 7) % 7] + 12 * oct;
  }
  const hz = (semis) => ROOT_HZ * Math.pow(2, semis / 12);

  class GroovePlayer {
    constructor() {
      this.ctx = null; this.timer = null; this.playing = false;
      this.listeners = new Set();
      this.step = 0; this.bar = 0; this.nextTime = 0; this.queue = [];
    }

    onStep(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    static patterns() { return P; }
    static labels() { return TRACK_LABELS; }

    ensureCtx() {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.7;
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -14; comp.ratio.value = 4;
        this.master.connect(comp).connect(this.ctx.destination);
        const len = this.ctx.sampleRate;
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    play(patternId, bpm) {
      this.stop();
      this.ensureCtx();
      this.pattern = P[patternId] || P.four;
      this.patternId = patternId;
      this.bpm = Math.max(40, Math.min(220, bpm || 100));
      // Very fast genres are sketched at half-time so the grid stays readable.
      this.steps = this.pattern.steps || 16;
      this.step = 0; this.bar = 0;
      this.nextTime = this.ctx.currentTime + 0.06;
      this.playing = true;
      if (this.pattern.vinyl) this.startVinyl();
      if (this.pattern.drone) this.startDrone();
      this.timer = setInterval(() => this.schedule(), 25);
      this.raf = requestAnimationFrame(() => this.draw());
    }

    stop() {
      this.playing = false;
      clearInterval(this.timer); this.timer = null;
      cancelAnimationFrame(this.raf);
      if (this.vinylSrc) { try { this.vinylSrc.stop(); } catch (_) {} this.vinylSrc = null; }
      if (this.droneNodes) { this.droneNodes.forEach((n) => { try { n.stop(); } catch (_) {} }); this.droneNodes = null; }
      this.queue = [];
      this.listeners.forEach((fn) => fn(-1, null));
    }

    stepDur() {
      const beatsPerBar = 4;
      return (60 / this.bpm) * beatsPerBar / this.steps;
    }

    schedule() {
      while (this.nextTime < this.ctx.currentTime + 0.12) {
        let t = this.nextTime;
        const swing = this.pattern.swing || 0;
        if (swing && this.step % 2 === 1) t += swing * this.stepDur();
        this.playStep(this.step, t);
        this.queue.push({ step: this.step, time: t });
        this.nextTime += this.stepDur();
        this.step++;
        if (this.step >= this.steps) { this.step = 0; this.bar = (this.bar + 1) % 4; }
      }
    }

    draw() {
      if (!this.playing) return;
      const now = this.ctx.currentTime;
      while (this.queue.length && this.queue[0].time <= now) {
        const q = this.queue.shift();
        this.listeners.forEach((fn) => fn(q.step, this.patternId));
      }
      this.raf = requestAnimationFrame(() => this.draw());
    }

    chordRoot() {
      const mode = this.pattern.mode || 'minor';
      const prog = PROGRESSIONS[mode];
      return degreeToSemis(SCALES[mode], prog[this.bar % prog.length]);
    }

    noteSemis(deg) {
      const mode = this.pattern.mode || 'minor';
      const prog = PROGRESSIONS[mode];
      const rootDeg = prog[this.bar % prog.length];
      if (deg === 7) return degreeToSemis(SCALES[mode], rootDeg) + 12;
      return degreeToSemis(SCALES[mode], rootDeg + deg);
    }

    playStep(i, t) {
      const p = this.pattern;
      const on = (key) => p[key] && p[key][i] && p[key][i] !== '.';
      const soft = p.soft ? 0.7 : 1;
      if (on('k')) this.kick(t, p === P.metal ? 0.6 : 1);
      if (on('s')) this.snare(t, soft);
      if (on('c')) this.clap(t, soft);
      if (on('h')) this.hat(t, 0.045, (p.h.length === p.h.replace(/\./g, '').length ? 0.18 : 0.3) * soft);
      if (on('o')) this.hat(t, 0.22, 0.3);
      if (on('r')) this.rim(t);
      if (on('y')) this.ride(t);
      if (on('t')) this.tom(t);
      if (on('q')) this.stab(t, this.chordRoot());
      ['b', 'e', 'l', 'w', 'a'].forEach((key) => {
        if (!on(key)) return;
        const deg = parseInt(p[key][i], 10);
        const semis = this.noteSemis(deg);
        if (key === 'b') this.bass(t, semis, !!p.wob);
        if (key === 'e') this.eight08(t, semis, !!p.glide);
        if (key === 'l') this.logDrum(t, semis);
        if (key === 'w') this.cowbell(t, semis);
        if (key === 'a') this.lead(t, semis + 24, !!p.square);
      });
      if (p.pad && i === 0) this.pad(t, this.chordRoot(), this.stepDur() * this.steps);
    }

    // ---------- instruments ----------
    env(g, t, peak, attack, decay) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    }
    kick(t, lvl = 1) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      this.env(g, t, 0.95 * lvl, 0.002, 0.34);
      o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.4);
    }
    noiseHit(t, type, freq, q, peak, decay) {
      const s = this.ctx.createBufferSource(); s.buffer = this.noise;
      const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = this.ctx.createGain(); this.env(g, t, peak, 0.001, decay);
      s.connect(f).connect(g).connect(this.master); s.start(t); s.stop(t + decay + 0.05);
    }
    snare(t, lvl = 1) {
      this.noiseHit(t, 'bandpass', 1900, 0.8, 0.5 * lvl, 0.16);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(190, t);
      this.env(g, t, 0.3 * lvl, 0.001, 0.08); o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.12);
    }
    clap(t, lvl = 1) {
      [0, 0.011, 0.023].forEach((d) => this.noiseHit(t + d, 'bandpass', 1300, 1.2, 0.35 * lvl, 0.09));
    }
    hat(t, decay, peak) { this.noiseHit(t, 'highpass', 7500, 0.7, peak, decay); }
    ride(t) { this.noiseHit(t, 'highpass', 5000, 0.5, 0.14, 0.35); }
    rim(t) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'square'; o.frequency.value = 820;
      this.env(g, t, 0.14, 0.001, 0.03); o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.06);
    }
    tom(t) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.3);
      this.env(g, t, 0.8, 0.002, 0.45); o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.5);
      this.noiseHit(t, 'lowpass', 900, 0.5, 0.2, 0.2);
    }
    bass(t, semis, wob) {
      const o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = hz(semis);
      f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 4;
      const dur = this.stepDur() * 1.8;
      if (wob) {
        const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
        lfo.frequency.value = (this.bpm / 60) * 2; lg.gain.value = 420;
        lfo.connect(lg).connect(f.frequency); lfo.start(t); lfo.stop(t + dur * 2);
      }
      this.env(g, t, 0.32, 0.005, wob ? dur * 2 : dur);
      o.connect(f).connect(g).connect(this.master); o.start(t); o.stop(t + dur * 2 + 0.05);
    }
    eight08(t, semis, glide) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(), sh = this.ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(2.2 * x); }
      sh.curve = curve;
      const f = hz(semis);
      o.frequency.setValueAtTime(glide ? f * 1.5 : f * 1.05, t);
      o.frequency.exponentialRampToValueAtTime(f, t + (glide ? 0.12 : 0.03));
      this.env(g, t, 0.8, 0.004, 0.9);
      o.connect(sh).connect(g).connect(this.master); o.start(t); o.stop(t + 1);
    }
    logDrum(t, semis) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
      o.type = 'triangle'; const fr = hz(semis + 12);
      o.frequency.setValueAtTime(fr * 1.35, t); o.frequency.exponentialRampToValueAtTime(fr, t + 0.06);
      f.type = 'lowpass'; f.frequency.value = 700;
      this.env(g, t, 0.75, 0.003, 0.32);
      o.connect(f).connect(g).connect(this.master); o.start(t); o.stop(t + 0.4);
    }
    cowbell(t, semis) {
      const base = hz(semis + 36);
      const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = base * 1.3; bp.Q.value = 2;
      const g = this.ctx.createGain(); this.env(g, t, 0.25, 0.001, 0.22);
      [1, 1.48].forEach((r) => {
        const o = this.ctx.createOscillator(); o.type = 'square'; o.frequency.value = base * r;
        o.connect(bp); o.start(t); o.stop(t + 0.3);
      });
      bp.connect(g).connect(this.master);
    }
    lead(t, semis, square) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = square ? 'square' : 'sine'; o.frequency.value = hz(semis);
      this.env(g, t, square ? 0.08 : 0.18, 0.004, square ? 0.12 : 0.6);
      o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.7);
    }
    stab(t, rootSemis) {
      const mode = this.pattern.mode || 'minor';
      const g = this.ctx.createGain(); this.env(g, t, 0.1, 0.002, 0.09);
      const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 400;
      [0, 2, 4].forEach((d) => {
        const o = this.ctx.createOscillator(); o.type = 'square';
        o.frequency.value = hz(rootSemis + 24 + degreeToSemis(SCALES[mode], d)); o.connect(f); o.start(t); o.stop(t + 0.12);
      });
      f.connect(g).connect(this.master);
    }
    pad(t, rootSemis, dur) {
      const mode = this.pattern.mode || 'minor';
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.05, t + Math.min(0.4, dur * 0.25));
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
      const tones = mode === 'major7' ? [0, 2, 4, 6] : [0, 2, 4];
      const rootDeg = PROGRESSIONS[mode][this.bar % 4];
      tones.forEach((d, idx) => {
        [-6, 6].forEach((det) => {
          const o = this.ctx.createOscillator(); o.type = 'triangle'; o.detune.value = det;
          o.frequency.value = hz(degreeToSemis(SCALES[mode], rootDeg + d) + 24 + (idx === 0 ? 0 : 0));
          o.connect(f); o.start(t); o.stop(t + dur + 0.05);
        });
      });
      f.connect(g).connect(this.master);
    }
    startVinyl() {
      const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 0.4;
      const g = this.ctx.createGain(); g.gain.value = 0.018;
      s.connect(f).connect(g).connect(this.master); s.start(); this.vinylSrc = s;
    }
    startDrone() {
      const nodes = [];
      [0, 7].forEach((s) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = hz(s + 12); g.gain.value = 0.06;
        o.connect(g).connect(this.master); o.start(); nodes.push(o);
      });
      this.droneNodes = nodes;
    }
  }

  window.GroovePlayer = GroovePlayer;
  window.groove = new GroovePlayer();
})();
