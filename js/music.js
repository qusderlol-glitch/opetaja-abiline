/* Õpetaja Abiline – gentle generative music (Web Audio).
   Everything is synthesised live in the browser: no audio files, no copyright. */
(function () {
  'use strict';

  var TRACK_IDS = ['lofi', 'rain', 'garden', 'stars'];

  var ctx = null, master, comp, dry, convolver, noiseBuf;
  var timer = null, playing = false, trackIdx = 0, step = 0, nextTime = 0;
  var volume = 0.5, rainNode = null;
  var ownEl = null, ownUrl = null, ownName = '', useOwn = false;
  var listeners = [];

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function emit() { listeners.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } }); }

  /* ---------- audio graph ---------- */
  function makeImpulse(seconds, decay) {
    var rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    var buf = ctx.createBuffer(2, len, rate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function ensure() {
    if (ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);
    dry = ctx.createGain(); dry.gain.value = 1; dry.connect(master);
    convolver = ctx.createConvolver(); convolver.buffer = makeImpulse(2.8, 2.6);
    var wetOut = ctx.createGain(); wetOut.gain.value = 0.55;
    convolver.connect(wetOut); wetOut.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var nd = noiseBuf.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }

  function route(node, wet) {
    node.connect(dry);
    if (wet > 0) { var s = ctx.createGain(); s.gain.value = wet; node.connect(s); s.connect(convolver); }
  }

  /* ---------- instruments ---------- */
  function tone(o) {
    var t = o.t, dur = o.dur, vel = o.vel === undefined ? 0.5 : o.vel;
    var g = ctx.createGain();
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.cutoff || 3000;
    var atk = o.attack === undefined ? 0.01 : o.attack;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vel, t + atk);
    if (o.sustain) {
      g.gain.setValueAtTime(vel, t + Math.max(atk, dur - (o.release || 0.8)));
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    var parts = o.parts || [{ type: 'sine', mult: 1, gain: 1 }];
    var oscs = parts.map(function (p) {
      var os = ctx.createOscillator(); os.type = p.type || 'sine';
      os.frequency.value = o.freq * (p.mult || 1);
      if (p.detune) os.detune.value = p.detune;
      var pg = ctx.createGain(); pg.gain.value = p.gain === undefined ? 1 : p.gain;
      os.connect(pg); pg.connect(f);
      os.start(t); os.stop(t + dur + 0.1);
      return os;
    });
    f.connect(g); route(g, o.wet === undefined ? 0.3 : o.wet);
    oscs[0].onended = function () { try { g.disconnect(); f.disconnect(); } catch (e) { /* ignore */ } };
  }

  function epiano(m, t, dur, vel, wet) {
    tone({ freq: mtof(m), t: t, dur: dur, vel: vel * 0.22, attack: 0.008, cutoff: 2600, wet: wet === undefined ? 0.35 : wet,
      parts: [{ type: 'sine', mult: 1, gain: 1 }, { type: 'sine', mult: 2, gain: 0.32 }, { type: 'triangle', mult: 0.5, gain: 0.25 }, { type: 'sine', mult: 7, gain: 0.04 }] });
  }
  function musicbox(m, t, vel, wet) {
    tone({ freq: mtof(m), t: t, dur: 2.2, vel: vel * 0.16, attack: 0.003, cutoff: 7000, wet: wet === undefined ? 0.6 : wet,
      parts: [{ type: 'sine', mult: 1, gain: 1 }, { type: 'sine', mult: 4.1, gain: 0.18 }, { type: 'sine', mult: 6.3, gain: 0.07 }] });
  }
  function pad(notes, t, dur, vel, wet) {
    notes.forEach(function (m) {
      tone({ freq: mtof(m), t: t, dur: dur, vel: (vel || 0.5) * 0.07, attack: Math.min(1.6, dur * 0.35), sustain: true, release: Math.min(2.2, dur * 0.5),
        cutoff: 1400, wet: wet === undefined ? 0.6 : wet,
        parts: [{ type: 'triangle', mult: 1, gain: 1, detune: -6 }, { type: 'triangle', mult: 1, gain: 0.8, detune: 7 }, { type: 'sine', mult: 2, gain: 0.25 }] });
    });
  }
  function bass(m, t, dur, vel) {
    tone({ freq: mtof(m), t: t, dur: dur, vel: vel * 0.3, attack: 0.012, cutoff: 500, wet: 0.05, parts: [{ type: 'sine', mult: 1, gain: 1 }, { type: 'triangle', mult: 2, gain: 0.15 }] });
  }
  function noiseHit(t, dur, hp, lp, vel, wet) {
    var src = ctx.createBufferSource(); src.buffer = noiseBuf;
    var f1 = ctx.createBiquadFilter(); f1.type = 'highpass'; f1.frequency.value = hp;
    var f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lp;
    var g = ctx.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f1); f1.connect(f2); f2.connect(g); route(g, wet || 0);
    src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
  }
  function kick(t, vel) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(vel * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); route(g, 0); o.start(t); o.stop(t + 0.3);
  }
  function snare(t, vel) { noiseHit(t, 0.16, 1200, 6500, vel * 0.16, 0.25); }
  function hat(t, vel) { noiseHit(t, 0.045, 6500, 14000, vel * 0.05, 0); }
  function crackle(t) { noiseHit(t, 0.012, 2500, 9000, 0.03 + Math.random() * 0.03, 0); }

  function startRain() {
    if (rainNode) return;
    var src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.35;
    var g = ctx.createGain(); g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(0.085, ctx.currentTime + 2);
    src.connect(hp); hp.connect(bp); bp.connect(g); g.connect(dry); src.start();
    rainNode = { src: src, g: g };
  }
  function stopRain() {
    if (!rainNode) return;
    var r = rainNode; rainNode = null;
    try { r.g.gain.cancelScheduledValues(ctx.currentTime); r.g.gain.setValueAtTime(r.g.gain.value, ctx.currentTime); r.g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6); r.src.stop(ctx.currentTime + 0.7); } catch (e) { /* ignore */ }
  }

  /* ---------- tracks (16 steps per bar) ---------- */
  var TRACKS = {
    lofi: {
      bpm: 76, swing: 0.28,
      chords: [[48, 55, 59, 64], [45, 55, 60, 64], [50, 57, 60, 65], [43, 53, 59, 62]],
      pent: [72, 74, 76, 79, 81],
      step: function (s, t, sd) {
        var bar = Math.floor(s / 16) % 4, k = s % 16, ch = this.chords[bar];
        if (k === 0 || k === 7 || k === 10) {
          ch.forEach(function (m, i) { epiano(m, t + i * 0.014, k === 0 ? sd * 6 : sd * 3, k === 0 ? 0.8 : 0.5); });
        }
        if ([2, 4, 8, 12, 14].indexOf(k) >= 0 && Math.random() < 0.38) epiano(rnd(this.pent), t, sd * 3, 0.55, 0.5);
        if (k === 0) bass(ch[0] - 12, t, sd * 6, 0.9);
        if (k === 10) bass(ch[0] - 12 + 7, t, sd * 3, 0.6);
        if (k === 0 || k === 10) kick(t, 0.8);
        if (k === 4 || k === 12) snare(t, 0.8);
        if (k % 2 === 0) hat(t, k % 4 === 0 ? 1 : 0.6);
        if (Math.random() < 0.3) crackle(t + Math.random() * sd);
      }
    },
    rain: {
      bpm: 58, swing: 0, rain: true,
      chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 57, 60, 64], [48, 55, 59, 64]],
      pent: [65, 67, 69, 72, 74, 77],
      step: function (s, t, sd) {
        var bar = Math.floor(s / 16) % 4, k = s % 16, ch = this.chords[bar];
        if (k === 0) { pad(ch, t, sd * 16.5, 0.9, 0.7); bass(ch[0] - 12, t, sd * 8, 0.6); }
        if (k % 2 === 0 && Math.random() < 0.22) epiano(rnd(this.pent), t, sd * 5, 0.55, 0.7);
      }
    },
    garden: {
      bpm: 82, swing: 0,
      chords: [[60, 64, 67, 72], [59, 62, 67, 71], [57, 60, 64, 69], [59, 64, 67, 71], [57, 60, 65, 69], [60, 64, 67, 72], [57, 60, 65, 69], [59, 62, 67, 71]],
      pattern: [0, 1, 2, 3, 2, 1, 2, 1],
      step: function (s, t, sd) {
        var bar = Math.floor(s / 16) % 8, k = s % 16, ch = this.chords[bar];
        if (k % 2 === 0) { var idx = this.pattern[k / 2]; musicbox(ch[idx] + (k === 6 ? 12 : 0), t, k === 0 ? 1 : 0.7); }
        if (k === 0) { pad([ch[0] - 12, ch[1] - 12, ch[2] - 12], t, sd * 16.5, 0.6, 0.6); bass(ch[0] - 24, t, sd * 8, 0.55); }
        if (k === 8 && Math.random() < 0.5) musicbox(ch[3] + 12, t, 0.5, 0.8);
      }
    },
    stars: {
      bpm: 46, swing: 0,
      chords: [[50, 54, 57, 61, 64], [47, 54, 57, 62, 66], [43, 50, 55, 59, 66], [45, 52, 57, 61, 64]],
      pent: [74, 76, 78, 81, 83, 86],
      step: function (s, t, sd) {
        var bar = Math.floor(s / 16) % 4, k = s % 16, ch = this.chords[bar];
        if (k === 0) pad(ch, t, sd * 16.8, 1, 0.8);
        if (Math.random() < 0.16) musicbox(rnd(this.pent), t, 0.55, 0.9);
      }
    }
  };

  /* ---------- scheduler ---------- */
  function schedule() {
    if (!ctx || !playing || useOwn) return;
    var tr = TRACKS[TRACK_IDS[trackIdx]];
    var sd = 60 / tr.bpm / 4;
    while (nextTime < ctx.currentTime + 0.6) {
      var t = nextTime + ((step % 2 === 1) ? sd * (tr.swing || 0) : 0);
      try { tr.step(step, t, sd); } catch (e) { /* keep going */ }
      nextTime += sd; step++;
    }
  }

  function fadeTo(v, secs) {
    if (!ctx) return;
    var now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(v, now + secs);
  }

  function resetTrack() {
    stopRain();
    step = 0;
    if (ctx) nextTime = ctx.currentTime + 0.15;
    if (ctx && playing && !useOwn && TRACKS[TRACK_IDS[trackIdx]].rain) startRain();
  }

  /* ---------- public api ---------- */
  var Music = {
    ids: TRACK_IDS,
    get playing() { return playing; },
    get trackIndex() { return trackIdx; },
    get trackId() { return useOwn ? 'own' : TRACK_IDS[trackIdx]; },
    get hasOwn() { return !!ownUrl; },
    get ownName() { return ownName; },
    get volume() { return volume; },
    supported: !!(window.AudioContext || window.webkitAudioContext),

    onChange: function (fn) { listeners.push(fn); },

    play: function () {
      if (playing) return;
      if (useOwn && ownEl) {
        playing = true; ownEl.volume = volume; ownEl.play().catch(function () { playing = false; emit(); });
        emit(); return;
      }
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      playing = true;
      resetTrack();
      clearInterval(timer); timer = setInterval(schedule, 90);
      fadeTo(volume * 0.9, 1.6);
      emit();
    },

    pause: function (fadeSecs) {
      if (!playing) return;
      playing = false;
      if (useOwn && ownEl) { ownEl.pause(); emit(); return; }
      var f = fadeSecs === undefined ? 0.8 : fadeSecs;
      fadeTo(0, f);
      clearInterval(timer); timer = null;
      stopRain();
      emit();
    },

    toggle: function () { if (playing) Music.pause(); else Music.play(); },

    next: function () {
      var total = TRACK_IDS.length + (ownUrl ? 1 : 0);
      var cur = useOwn ? TRACK_IDS.length : trackIdx;
      var nx = (cur + 1) % total;
      Music.setTrack(nx);
    },

    /* index 0..3 = generated, 4 = own file */
    setTrack: function (i) {
      var wasPlaying = playing;
      if (wasPlaying) { if (useOwn && ownEl) ownEl.pause(); }
      playing = false; clearInterval(timer); timer = null; stopRain();
      if (i >= TRACK_IDS.length && ownUrl) { useOwn = true; }
      else { useOwn = false; trackIdx = Math.max(0, Math.min(TRACK_IDS.length - 1, i)); }
      if (ctx) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0, ctx.currentTime); }
      emit();
      if (wasPlaying) Music.play();
    },

    setVolume: function (v) {
      volume = Math.max(0, Math.min(1, v));
      if (ctx && playing && !useOwn) fadeTo(volume * 0.9, 0.15);
      if (ownEl) ownEl.volume = volume;
      emit();
    },

    setOwnFile: function (file) {
      if (!file) return;
      if (ownUrl) URL.revokeObjectURL(ownUrl);
      if (ownEl) { ownEl.pause(); }
      ownUrl = URL.createObjectURL(file);
      ownName = file.name;
      ownEl = new Audio(ownUrl); ownEl.loop = true; ownEl.volume = volume;
      Music.setTrack(TRACK_IDS.length);
    },

    clearOwn: function () {
      if (ownEl) ownEl.pause();
      if (ownUrl) URL.revokeObjectURL(ownUrl);
      ownEl = null; ownUrl = null; ownName = ''; useOwn = false; emit();
    }
  };

  window.Music = Music;
})();
