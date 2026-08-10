'use strict'; window.AUDIO = {};
(function () {
   let AC = null, sfxG, musG, track = 'menu', stepIdx = 0, nextT = 0;
   const irnd = n => Math.floor(Math.random() * n);
   const TRACKS = {
      menu: { step: .5, root: 110, bass: [0, null, null, null, 7, null, 5, null, 0, null, null, null, 3, null, 5, null], drum: 0, scale: [0, 3, 5, 7, 10], mel: .22, pad: 1 },
      combat: { step: .25, root: 110, bass: [0, 0, 12, 0, 0, 0, 10, 0, 0, 0, 12, 0, 7, 0, 5, 3], drum: 1, scale: [0, 3, 5, 7, 10, 12], mel: .5, pad: 0 },
      boss: { step: .21, root: 98, bass: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 12, 1, 3, 1], drum: 2, scale: [0, 1, 3, 5, 7, 8, 10], mel: .6, pad: 0 }
   };
   function init() {
      if (AC) return; try {
         AC = new (window.AudioContext || window.webkitAudioContext)();
         const m = AC.createGain(); m.connect(AC.destination);
         sfxG = AC.createGain(); sfxG.connect(m); musG = AC.createGain(); musG.connect(m);
         nextT = AC.currentTime + .1; applyVol();
      } catch (e) { }
   }
   function applyVol() {
      if (!AC) return; sfxG.gain.value = SAVE.set.sfx / 100 * .5;
      musG.gain.value = SAVE.set.music ? SAVE.set.mus / 100 * .16 : 0
   }
   function setTrack(t) { if (track !== t) { track = t; stepIdx = 0; if (AC) nextT = AC.currentTime + .05 } }
   const hz = (r, s) => r * Math.pow(2, s / 12);
   function osc(f, d = .1, type = 'sine', v = .2, slide = 0, when) {
      if (!AC) return; const t = when !== undefined ? when : AC.currentTime;
      const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(sfxG); o.start(t); o.stop(t + d + .03)
   }
   function mosc(f, d, type, v, when) {
      if (!AC) return; const o = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
      o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 900;
      g.gain.setValueAtTime(v, when); g.gain.exponentialRampToValueAtTime(.0001, when + d);
      o.connect(fl); fl.connect(g); g.connect(musG); o.start(when); o.stop(when + d + .03)
   }
   function nz(d = .1, v = .15, fq = 1200, when) {
      if (!AC) return; const t = when !== undefined ? when : AC.currentTime;
      const len = AC.sampleRate * d, buf = AC.createBuffer(1, len, AC.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++)ch[i] = Math.random() * 2 - 1;
      const s = AC.createBufferSource(); s.buffer = buf; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fq;
      const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      s.connect(f); f.connect(g); g.connect(sfxG); s.start(t); s.stop(t + d)
   }
   /* drums */
   const kick = t => mosc(150, .14, 'sine', .5, t), hat = (t, v) => { if (AC) nzAt(.03, v, 6000, t) }, snare = t => nzAt(.12, .22, 1800, t);
   function nzAt(d, v, fq, t) {
      if (!AC) return; const len = AC.sampleRate * d, buf = AC.createBuffer(1, len, AC.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++)ch[i] = Math.random() * 2 - 1;
      const s = AC.createBufferSource(); s.buffer = buf; const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = fq;
      const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      s.connect(f); f.connect(g); g.connect(musG); s.start(t); s.stop(t + d)
   }
   function sched(T, i, t) {
      const b = T.bass[i % T.bass.length];
      if (b != null) mosc(hz(T.root, b), T.step * 1.6, 'sawtooth', .16, t);
      if (T.drum === 1) { if (i % 4 === 0) kick(t); if (i % 2 === 1) hat(t, .05); if (i % 8 === 4) snare(t) }
      else if (T.drum === 2) { if (i % 2 === 0) kick(t); hat(t, .07); if (i % 8 === 4 || i % 8 === 0) snare(t) }
      if (T.pad && i % 16 === 0) [0, 3, 7].forEach(s => mosc(hz(T.root, s), T.step * 8, 'sine', .05, t));
      if (Math.random() < T.mel) { const s = T.scale[irnd(T.scale.length)]; mosc(hz(T.root * 2, s), .18, 'square', .05, t) }
   }
   setInterval(() => {
      if (!AC || !SAVE.set.music || !SAVE.set.mus) return; const T = TRACKS[track];
      while (nextT < AC.currentTime + .3) { sched(T, stepIdx, nextT); nextT += T.step; stepIdx++ }
   }, 100);
   const SFX = {
      click() { osc(760, .06, 'square', .1); osc(1140, .05, 'square', .06, 0, AC && AC.currentTime + .03) },
      hover() { osc(1500, .03, 'sine', .03) },
      shoot(p = 0) { osc(460 + p * 30 + Math.random() * 30, .06, 'square', .045, -200); osc(900, .04, 'sawtooth', .02, -400); nz(.03, .02, 3000) },
      hit() { nz(.04, .06, 2200) },
      kill() { osc(240, .12, 'sawtooth', .09, -140); nz(.08, .05, 900); osc(90, .15, 'sine', .12, -40) },
      explosion() { nz(.4, .2, 700); osc(70, .4, 'sine', .25, -30); nz(.2, .12, 2000, AC && AC.currentTime + .05) },
      coin() { osc(988, .06, 'sine', .08); osc(1319, .09, 'sine', .08, 0, AC && AC.currentTime + .05); osc(1976, .08, 'sine', .05, 0, AC && AC.currentTime + .1) },
      xp() { osc(700 + Math.random() * 80, .04, 'sine', .03) },
      dash() { nz(.14, .08, 2400); osc(300, .12, 'sine', .05, 400) },
      hurt() { osc(110, .2, 'sawtooth', .16, -40); nz(.12, .09, 700) },
      level() { [523, 659, 784, 1046, 1319].forEach((f, i) => osc(f, .16, 'triangle', .09, 0, AC && AC.currentTime + i * .06)); nz(.3, .03, 5000, AC && AC.currentTime + .1) },
      boss() { osc(55, .9, 'sawtooth', .16); osc(58, .9, 'sawtooth', .13); nz(.5, .06, 300); osc(40, .8, 'sine', .2, -15, AC && AC.currentTime + .1) },
      error() { osc(160, .16, 'square', .12, -70); osc(110, .2, 'square', .1, -40, AC && AC.currentTime + .08) },
      synth() { [262, 330, 392, 523].forEach((f, i) => osc(f, .4, 'triangle', .07, 0, AC && AC.currentTime + i * .05)); nz(.3, .03, 5000, AC && AC.currentTime + .1) },
      unlock() { osc(660, .08, 'triangle', .1); osc(880, .1, 'triangle', .1, 0, AC && AC.currentTime + .07); osc(1320, .14, 'triangle', .1, 0, AC && AC.currentTime + .14) },
      wave() { osc(196, .3, 'sawtooth', .07, 100); osc(294, .25, 'sawtooth', .05, 0, AC && AC.currentTime + .12) },
      active() { osc(392, .2, 'sawtooth', .1, 200); nz(.2, .06, 1500) },
      revive() { [392, 523, 659, 784].forEach((f, i) => osc(f, .2, 'triangle', .1, 0, AC && AC.currentTime + i * .09)) }
   };
   function resume() { if (AC && AC.state === 'suspended') AC.resume() }
   window.addEventListener('pointerdown', () => { init(); resume() });
   window.addEventListener('keydown', () => { init(); resume() });
   Object.assign(AUDIO, { init, applyVol, setTrack, SFX, resume });
})();