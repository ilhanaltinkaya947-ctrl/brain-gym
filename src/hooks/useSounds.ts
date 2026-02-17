import { useCallback, useRef } from 'react';
import { haptics } from '@/utils/despia';

type SoundType = 'correct' | 'wrong' | 'tick' | 'start' | 'complete' | 'lose' | 'milestone' | 'heartbeat' | 'countdownTick' | 'countdownGo' | 'timeBonus';

// Pentatonic scale incorporating 528Hz solfeggio
// Ascending minor 3rds from A3 for streak escalation
const PENTA = [220, 264, 330, 440, 528, 660];

const MASTER_GAIN = 0.32;

// Minimum time between same sound type (ms) to prevent overlap artifacts
const SOUND_COOLDOWN: Record<string, number> = {
  correct: 80,
  wrong: 150,
  tick: 60,
  heartbeat: 40,
  countdownTick: 200,
};

export const useSounds = (enabled: boolean = true) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const streakRef = useRef(0);
  const tickCountRef = useRef(0);
  // Sound instance cooldown tracking
  const lastPlayedRef = useRef<Record<string, number>>({});

  const getCtx = useCallback(() => {
    if (!audioContextRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(MASTER_GAIN, ctx.currentTime);
      master.connect(ctx.destination);
      masterGainRef.current = master;

      // Gentle compressor — let bowl transients bloom
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-18, ctx.currentTime);
      comp.knee.setValueAtTime(15, ctx.currentTime);
      comp.ratio.setValueAtTime(2.5, ctx.currentTime);
      comp.attack.setValueAtTime(0.015, ctx.currentTime);
      comp.release.setValueAtTime(0.4, ctx.currentTime);
      comp.connect(master);

      // Dry path — available immediately
      const dry = ctx.createGain();
      dry.gain.setValueAtTime(0.60, ctx.currentTime);
      dry.connect(comp);
      dryGainRef.current = dry;

      // Reverb impulse: 1.5s length with slower decay for richer tail
      setTimeout(() => {
        const sr = ctx.sampleRate;
        const len = Math.ceil(sr * 1.5);
        const impulse = ctx.createBuffer(2, len, sr);
        for (let ch = 0; ch < 2; ch++) {
          const d = impulse.getChannelData(ch);
          for (let i = 0; i < len; i++) {
            const progress = i / len;
            const decay = Math.exp(-progress * 2.0);
            const hfRolloff = 1 - progress * 0.8;
            d[i] = (Math.random() * 2 - 1) * decay * hfRolloff;
          }
        }
        const reverb = ctx.createConvolver();
        reverb.buffer = impulse;
        reverbRef.current = reverb;

        const wet = ctx.createGain();
        wet.gain.setValueAtTime(0.40, ctx.currentTime);
        reverb.connect(wet);
        wet.connect(comp);
      }, 50);
    }
    return audioContextRef.current;
  }, []);

  const dry = useCallback(() => { if (!dryGainRef.current) getCtx(); return dryGainRef.current!; }, [getCtx]);
  const rev = useCallback(() => { if (!reverbRef.current) return dry(); return reverbRef.current; }, [dry]);

  const setStreak = useCallback((s: number) => { streakRef.current = s; }, []);

  // Sound instance cooldown check
  const canPlay = useCallback((type: string): boolean => {
    const now = Date.now();
    const cooldown = SOUND_COOLDOWN[type] || 0;
    const last = lastPlayedRef.current[type] || 0;
    if (now - last < cooldown) return false;
    lastPlayedRef.current[type] = now;
    return true;
  }, []);

  // ===============================================
  // Tap -- Clean sine pip (1000-1200Hz, 100ms)
  // Minimal, felt more than heard. Neural UI feedback.
  // ===============================================
  const tap = useCallback((ctx: AudioContext, t: number, vol: number = 0.08) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(1100, t);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.003);    // 3ms attack
    g.gain.setTargetAtTime(0.0001, t + 0.003, 0.025);  // ~25ms decay constant

    o.connect(g);
    g.connect(dry());

    o.start(t);
    o.stop(t + 0.15); // 5+ time constants of decay = fully silent
  }, [dry]);

  // ===============================================
  // Mallet -- Rich binaural singing bowl tone
  // Multiple partials: fundamental, 2nd (freq*2), 3rd (freq*2.76),
  // 5th (freq*4.72), each with independent decay envelopes.
  // All partials through same low-pass filter.
  // ===============================================
  const mallet = useCallback((
    ctx: AudioContext,
    freq: number,
    vol: number,
    t: number,
    dur: number,
  ) => {
    // Warm low-pass shared by all partials
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * 3, t);
    lp.Q.setValueAtTime(0.5, t);
    lp.connect(dry()); lp.connect(rev());

    // Stop time: well after 5 time constants of longest decay
    const stopTime = t + dur + dur * 1.5;

    // --- Fundamental: binaural pair ---
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(freq, t);
    const pan1 = ctx.createStereoPanner();
    pan1.pan.setValueAtTime(-0.8, t);

    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(freq + 3, t);
    const pan2 = ctx.createStereoPanner();
    pan2.pan.setValueAtTime(0.8, t);

    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(vol, t + 0.015);
    g1.gain.setTargetAtTime(0.0001, t + 0.015, dur * 0.25); // longest decay for fundamental

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(vol, t + 0.015);
    g2.gain.setTargetAtTime(0.0001, t + 0.015, dur * 0.25);

    o1.connect(g1); g1.connect(pan1); pan1.connect(lp);
    o2.connect(g2); g2.connect(pan2); pan2.connect(lp);
    o1.start(t); o2.start(t);
    o1.stop(stopTime); o2.stop(stopTime);

    // --- 2nd partial at freq*2 ---
    const p2L = ctx.createOscillator();
    p2L.type = 'sine';
    p2L.frequency.setValueAtTime(freq * 2, t);
    const p2PanL = ctx.createStereoPanner();
    p2PanL.pan.setValueAtTime(-0.6, t);

    const p2R = ctx.createOscillator();
    p2R.type = 'sine';
    p2R.frequency.setValueAtTime(freq * 2 + 3, t);
    const p2PanR = ctx.createStereoPanner();
    p2PanR.pan.setValueAtTime(0.6, t);

    const p2gL = ctx.createGain();
    p2gL.gain.setValueAtTime(0, t);
    p2gL.gain.linearRampToValueAtTime(vol * 0.12, t + 0.015);
    p2gL.gain.setTargetAtTime(0.0001, t + 0.015, dur * 0.20); // shorter decay

    const p2gR = ctx.createGain();
    p2gR.gain.setValueAtTime(0, t);
    p2gR.gain.linearRampToValueAtTime(vol * 0.12, t + 0.015);
    p2gR.gain.setTargetAtTime(0.0001, t + 0.015, dur * 0.20);

    p2L.connect(p2gL); p2gL.connect(p2PanL); p2PanL.connect(lp);
    p2R.connect(p2gR); p2gR.connect(p2PanR); p2PanR.connect(lp);
    p2L.start(t); p2R.start(t);
    p2L.stop(stopTime); p2R.stop(stopTime);

    // --- 3rd partial at freq*2.76 (characteristic bowl partial) ---
    const p3L = ctx.createOscillator();
    p3L.type = 'sine';
    p3L.frequency.setValueAtTime(freq * 2.76, t);
    const p3PanL = ctx.createStereoPanner();
    p3PanL.pan.setValueAtTime(-0.4, t);

    const p3R = ctx.createOscillator();
    p3R.type = 'sine';
    p3R.frequency.setValueAtTime(freq * 2.76 + 3, t);
    const p3PanR = ctx.createStereoPanner();
    p3PanR.pan.setValueAtTime(0.4, t);

    const p3gL = ctx.createGain();
    p3gL.gain.setValueAtTime(0, t);
    p3gL.gain.linearRampToValueAtTime(vol * 0.15, t + 0.015);
    p3gL.gain.setTargetAtTime(0.0001, t + 0.015, dur * 0.18); // shorter decay

    const p3gR = ctx.createGain();
    p3gR.gain.setValueAtTime(0, t);
    p3gR.gain.linearRampToValueAtTime(vol * 0.15, t + 0.015);
    p3gR.gain.setTargetAtTime(0.0001, t + 0.015, dur * 0.18);

    p3L.connect(p3gL); p3gL.connect(p3PanL); p3PanL.connect(lp);
    p3R.connect(p3gR); p3gR.connect(p3PanR); p3PanR.connect(lp);
    p3L.start(t); p3R.start(t);
    p3L.stop(stopTime); p3R.stop(stopTime);

    // --- 5th partial at freq*4.72 ---
    const p5L = ctx.createOscillator();
    p5L.type = 'sine';
    p5L.frequency.setValueAtTime(freq * 4.72, t);
    const p5PanL = ctx.createStereoPanner();
    p5PanL.pan.setValueAtTime(-0.3, t);

    const p5R = ctx.createOscillator();
    p5R.type = 'sine';
    p5R.frequency.setValueAtTime(freq * 4.72 + 3, t);
    const p5PanR = ctx.createStereoPanner();
    p5PanR.pan.setValueAtTime(0.3, t);

    const p5gL = ctx.createGain();
    p5gL.gain.setValueAtTime(0, t);
    p5gL.gain.linearRampToValueAtTime(vol * 0.06, t + 0.015);
    p5gL.gain.setTargetAtTime(0.0001, t + 0.015, dur * 0.12); // shortest decay for highest partial

    const p5gR = ctx.createGain();
    p5gR.gain.setValueAtTime(0, t);
    p5gR.gain.linearRampToValueAtTime(vol * 0.06, t + 0.015);
    p5gR.gain.setTargetAtTime(0.0001, t + 0.015, dur * 0.12);

    p5L.connect(p5gL); p5gL.connect(p5PanL); p5PanL.connect(lp);
    p5R.connect(p5gR); p5gR.connect(p5PanR); p5PanR.connect(lp);
    p5L.start(t); p5R.start(t);
    p5L.stop(stopTime); p5R.stop(stopTime);
  }, [dry, rev]);

  // ===============================================
  // Shimmer -- Binaural sustained sine with slow vibrato
  // 2.5Hz LFO on frequency (+/-4 cents), second detuned
  // oscillator at freq+3Hz for binaural. Both through reverb.
  // ===============================================
  const shimmer = useCallback((
    ctx: AudioContext,
    freq: number,
    vol: number,
    t: number,
    dur: number,
  ) => {
    // Stop well after decay completes (5+ time constants)
    const stopTime = t + dur + dur * 1.5;

    // Left channel -- main oscillator with LFO vibrato
    const oL = ctx.createOscillator();
    oL.type = 'sine';
    oL.frequency.setValueAtTime(freq, t);
    const panL = ctx.createStereoPanner();
    panL.pan.setValueAtTime(-0.5, t);

    // Slow vibrato -- 2.5Hz LFO, +/-4 cent depth
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(2.5, t);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(4, t);
    lfo.connect(lfoGain);
    lfoGain.connect(oL.detune);
    lfo.start(t);
    lfo.stop(stopTime);

    // Right channel -- detuned +3Hz for binaural beat
    const oR = ctx.createOscillator();
    oR.type = 'sine';
    oR.frequency.setValueAtTime(freq + 3, t);
    const panR = ctx.createStereoPanner();
    panR.pan.setValueAtTime(0.5, t);

    // LFO on right channel too for coherent vibrato
    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.setValueAtTime(2.5, t);
    const lfoGain2 = ctx.createGain();
    lfoGain2.gain.setValueAtTime(4, t);
    lfo2.connect(lfoGain2);
    lfoGain2.connect(oR.detune);
    lfo2.start(t);
    lfo2.stop(stopTime);

    // Smooth envelope -- 10ms attack, exponential decay via setTargetAtTime
    const gL = ctx.createGain();
    gL.gain.setValueAtTime(0, t);
    gL.gain.linearRampToValueAtTime(vol, t + 0.010);
    gL.gain.setTargetAtTime(0.0001, t + 0.010, dur * 0.25);

    const gR = ctx.createGain();
    gR.gain.setValueAtTime(0, t);
    gR.gain.linearRampToValueAtTime(vol * 0.8, t + 0.010);
    gR.gain.setTargetAtTime(0.0001, t + 0.010, dur * 0.25);

    // Both go through reverb
    oL.connect(gL); gL.connect(panL); panL.connect(dry()); panL.connect(rev());
    oR.connect(gR); gR.connect(panR); panR.connect(dry()); panR.connect(rev());

    oL.start(t); oL.stop(stopTime);
    oR.start(t); oR.stop(stopTime);
  }, [dry, rev]);

  // ===============================================
  // Correct -- Rich singing bowl strike with blooming harmonics
  // Multiple partials (fundamental, octave, fifth) each with
  // their own binaural pair and independent decay envelopes.
  // 3Hz binaural on fundamental, 4Hz on octave, 2Hz on fifth.
  // 1.2s+ resonant tail. Tibetan singing bowl struck hard.
  // ===============================================
  const playCorrectNote = useCallback((ctx: AudioContext) => {
    const t = ctx.currentTime;
    const streak = streakRef.current;
    const f = PENTA[streak % 6];

    // Reset tick counter
    tickCountRef.current = 0;

    // 1. Clean sine pip transient
    tap(ctx, t, 0.10);

    // 2. Main singing bowl mallet -- full harmonic series, 1.2s+ decay
    mallet(ctx, f, 0.22, t + 0.002, 1.2);

    // 3. Fundamental binaural pad -- 3Hz Alpha offset, wide stereo
    const padFL = ctx.createOscillator();
    padFL.type = 'sine';
    padFL.frequency.setValueAtTime(f, t);
    const padFPanL = ctx.createStereoPanner();
    padFPanL.pan.setValueAtTime(-1, t);

    const padFR = ctx.createOscillator();
    padFR.type = 'sine';
    padFR.frequency.setValueAtTime(f + 3, t); // 3Hz Alpha
    const padFPanR = ctx.createStereoPanner();
    padFPanR.pan.setValueAtTime(1, t);

    const padFGL = ctx.createGain();
    padFGL.gain.setValueAtTime(0, t);
    padFGL.gain.linearRampToValueAtTime(0.05, t + 0.015);
    padFGL.gain.setTargetAtTime(0.0001, t + 0.015, 0.30); // long tail

    const padFGR = ctx.createGain();
    padFGR.gain.setValueAtTime(0, t);
    padFGR.gain.linearRampToValueAtTime(0.05, t + 0.015);
    padFGR.gain.setTargetAtTime(0.0001, t + 0.015, 0.30);

    padFL.connect(padFGL); padFGL.connect(padFPanL);
    padFPanL.connect(dry()); padFPanL.connect(rev());
    padFR.connect(padFGR); padFGR.connect(padFPanR);
    padFPanR.connect(dry()); padFPanR.connect(rev());

    padFL.start(t); padFR.start(t);
    padFL.stop(t + 2.0); padFR.stop(t + 2.0);

    // 4. Octave binaural pad -- 4Hz offset, slightly narrower stereo
    const padOL = ctx.createOscillator();
    padOL.type = 'sine';
    padOL.frequency.setValueAtTime(f * 2, t + 0.003);
    const padOPanL = ctx.createStereoPanner();
    padOPanL.pan.setValueAtTime(-0.8, t);

    const padOR = ctx.createOscillator();
    padOR.type = 'sine';
    padOR.frequency.setValueAtTime(f * 2 + 4, t + 0.003); // 4Hz binaural on octave
    const padOPanR = ctx.createStereoPanner();
    padOPanR.pan.setValueAtTime(0.8, t);

    const padOGL = ctx.createGain();
    padOGL.gain.setValueAtTime(0, t + 0.003);
    padOGL.gain.linearRampToValueAtTime(0.035, t + 0.018);
    padOGL.gain.setTargetAtTime(0.0001, t + 0.018, 0.25); // slightly shorter than fundamental

    const padOGR = ctx.createGain();
    padOGR.gain.setValueAtTime(0, t + 0.003);
    padOGR.gain.linearRampToValueAtTime(0.035, t + 0.018);
    padOGR.gain.setTargetAtTime(0.0001, t + 0.018, 0.25);

    padOL.connect(padOGL); padOGL.connect(padOPanL);
    padOPanL.connect(dry()); padOPanL.connect(rev());
    padOR.connect(padOGR); padOGR.connect(padOPanR);
    padOPanR.connect(dry()); padOPanR.connect(rev());

    padOL.start(t + 0.003); padOR.start(t + 0.003);
    padOL.stop(t + 1.8); padOR.stop(t + 1.8);

    // 5. Fifth binaural pad -- 2Hz offset (deep Alpha), gentle bloom
    const padVL = ctx.createOscillator();
    padVL.type = 'sine';
    padVL.frequency.setValueAtTime(f * 1.5, t + 0.005); // perfect fifth
    const padVPanL = ctx.createStereoPanner();
    padVPanL.pan.setValueAtTime(-0.6, t);

    const padVR = ctx.createOscillator();
    padVR.type = 'sine';
    padVR.frequency.setValueAtTime(f * 1.5 + 2, t + 0.005); // 2Hz binaural on fifth
    const padVPanR = ctx.createStereoPanner();
    padVPanR.pan.setValueAtTime(0.6, t);

    const padVGL = ctx.createGain();
    padVGL.gain.setValueAtTime(0, t + 0.005);
    padVGL.gain.linearRampToValueAtTime(0.028, t + 0.020);
    padVGL.gain.setTargetAtTime(0.0001, t + 0.020, 0.22);

    const padVGR = ctx.createGain();
    padVGR.gain.setValueAtTime(0, t + 0.005);
    padVGR.gain.linearRampToValueAtTime(0.028, t + 0.020);
    padVGR.gain.setTargetAtTime(0.0001, t + 0.020, 0.22);

    padVL.connect(padVGL); padVGL.connect(padVPanL);
    padVPanL.connect(dry()); padVPanL.connect(rev());
    padVR.connect(padVGR); padVGR.connect(padVPanR);
    padVPanR.connect(dry()); padVPanR.connect(rev());

    padVL.start(t + 0.005); padVR.start(t + 0.005);
    padVL.stop(t + 1.6); padVR.stop(t + 1.6);

    // 6. Bowl overtone shimmer -- blooms outward
    shimmer(ctx, f * 2.76, 0.025, t + 0.010, 0.8);

    // 7. Deep sub-tone at higher streaks
    if (streak > 8) {
      shimmer(ctx, f * 0.25, 0.015, t + 0.003, 0.5);
    }
  }, [tap, mallet, shimmer, dry, rev]);

  // ===============================================
  // Wrong -- FELT sub-bass throb
  // 55Hz fundamental with 3Hz binaural wobble, 110Hz second
  // harmonic, 220Hz presence. Low-pass at 250Hz.
  // 500ms envelope with slow 80ms attack swell.
  // Descending pitch sweep on harmonics (110->90Hz) for "sinking".
  // ===============================================
  const playWrongSound = useCallback((ctx: AudioContext) => {
    const t = ctx.currentTime;

    // Reset tick counter
    tickCountRef.current = 0;

    // Low-pass at 250Hz -- keep everything round and sub
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(250, t);
    lp.Q.setValueAtTime(0.7, t);
    lp.connect(dry()); lp.connect(rev());

    // --- Fundamental 55Hz: binaural pair with 3Hz wobble ---
    const subL = ctx.createOscillator();
    subL.type = 'sine';
    subL.frequency.setValueAtTime(55, t);
    const subPanL = ctx.createStereoPanner();
    subPanL.pan.setValueAtTime(-0.9, t);

    const subR = ctx.createOscillator();
    subR.type = 'sine';
    subR.frequency.setValueAtTime(58, t); // 55+3 = 3Hz binaural wobble
    const subPanR = ctx.createStereoPanner();
    subPanR.pan.setValueAtTime(0.9, t);

    // 80ms attack swell, NOT instant
    const subGL = ctx.createGain();
    subGL.gain.setValueAtTime(0, t);
    subGL.gain.linearRampToValueAtTime(0.20, t + 0.080); // 80ms swell
    subGL.gain.setTargetAtTime(0.0001, t + 0.080, 0.10); // ~500ms total

    const subGR = ctx.createGain();
    subGR.gain.setValueAtTime(0, t);
    subGR.gain.linearRampToValueAtTime(0.20, t + 0.080);
    subGR.gain.setTargetAtTime(0.0001, t + 0.080, 0.10);

    subL.connect(subGL); subGL.connect(subPanL); subPanL.connect(lp);
    subR.connect(subGR); subGR.connect(subPanR); subPanR.connect(lp);

    subL.start(t); subR.start(t);
    subL.stop(t + 0.8); subR.stop(t + 0.8); // well past 5 time constants (5*0.10=0.5)

    // --- 2nd harmonic 110Hz with descending sweep to 90Hz ---
    const h2L = ctx.createOscillator();
    h2L.type = 'sine';
    h2L.frequency.setValueAtTime(110, t);
    h2L.frequency.exponentialRampToValueAtTime(90, t + 0.400); // sinking sweep
    const h2PanL = ctx.createStereoPanner();
    h2PanL.pan.setValueAtTime(-0.6, t);

    const h2R = ctx.createOscillator();
    h2R.type = 'sine';
    h2R.frequency.setValueAtTime(113, t); // 3Hz offset
    h2R.frequency.exponentialRampToValueAtTime(93, t + 0.400);
    const h2PanR = ctx.createStereoPanner();
    h2PanR.pan.setValueAtTime(0.6, t);

    const h2GL = ctx.createGain();
    h2GL.gain.setValueAtTime(0, t);
    h2GL.gain.linearRampToValueAtTime(0.12, t + 0.080);
    h2GL.gain.setTargetAtTime(0.0001, t + 0.080, 0.08);

    const h2GR = ctx.createGain();
    h2GR.gain.setValueAtTime(0, t);
    h2GR.gain.linearRampToValueAtTime(0.12, t + 0.080);
    h2GR.gain.setTargetAtTime(0.0001, t + 0.080, 0.08);

    h2L.connect(h2GL); h2GL.connect(h2PanL); h2PanL.connect(lp);
    h2R.connect(h2GR); h2GR.connect(h2PanR); h2PanR.connect(lp);

    h2L.start(t); h2R.start(t);
    h2L.stop(t + 0.7); h2R.stop(t + 0.7);

    // --- 220Hz presence tone with descending sweep ---
    const h3 = ctx.createOscillator();
    h3.type = 'sine';
    h3.frequency.setValueAtTime(220, t);
    h3.frequency.exponentialRampToValueAtTime(180, t + 0.400); // sinking
    const h3g = ctx.createGain();
    h3g.gain.setValueAtTime(0, t);
    h3g.gain.linearRampToValueAtTime(0.06, t + 0.080);
    h3g.gain.setTargetAtTime(0.0001, t + 0.080, 0.06);
    h3.connect(h3g); h3g.connect(lp);
    h3.start(t);
    h3.stop(t + 0.6);
  }, [dry, rev]);

  // ===============================================
  // Tick -- Escalating urgency
  // 1200Hz->2400Hz base, 4Hz->20Hz binaural as tick count rises.
  // Crisp 2ms attack transient + 60ms resonant tail.
  // Sub-pulse at 80Hz that gets louder with each tick.
  // ===============================================
  const playTickSound = useCallback((ctx: AudioContext) => {
    const t = ctx.currentTime;

    // Escalating parameters
    tickCountRef.current += 1;
    const tc = tickCountRef.current;
    const maxTicks = 30;
    const progress = Math.min(tc / maxTicks, 1);

    // Base frequency: 1200Hz -> 2400Hz
    const baseFreq = 1200 + progress * 1200;

    // Binaural beat: 4Hz -> 20Hz
    const beatHz = 4 + progress * 16;

    // --- Main binaural tick pair ---
    const tickL = ctx.createOscillator();
    tickL.type = 'sine';
    tickL.frequency.setValueAtTime(baseFreq, t);
    const panL = ctx.createStereoPanner();
    panL.pan.setValueAtTime(-0.7, t);

    const tickR = ctx.createOscillator();
    tickR.type = 'sine';
    tickR.frequency.setValueAtTime(baseFreq + beatHz, t);
    const panR = ctx.createStereoPanner();
    panR.pan.setValueAtTime(0.7, t);

    // 2ms attack transient + 60ms resonant tail
    const tgL = ctx.createGain();
    tgL.gain.setValueAtTime(0, t);
    tgL.gain.linearRampToValueAtTime(0.035, t + 0.002); // crisp 2ms attack
    tgL.gain.setTargetAtTime(0.0001, t + 0.002, 0.015); // 60ms resonant tail (4 * 0.015 = 60ms)

    const tgR = ctx.createGain();
    tgR.gain.setValueAtTime(0, t);
    tgR.gain.linearRampToValueAtTime(0.035, t + 0.002);
    tgR.gain.setTargetAtTime(0.0001, t + 0.002, 0.015);

    tickL.connect(tgL); tgL.connect(panL);
    panL.connect(dry()); panL.connect(rev());
    tickR.connect(tgR); tgR.connect(panR);
    panR.connect(dry()); panR.connect(rev());

    tickL.start(t); tickR.start(t);
    tickL.stop(t + 0.12); tickR.stop(t + 0.12); // 5+ time constants

    // --- Sub-pulse at 80Hz, gets louder with each tick ---
    const subVol = 0.01 + progress * 0.06; // louder as urgency builds
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, t);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0, t);
    sg.gain.linearRampToValueAtTime(subVol, t + 0.002);
    sg.gain.setTargetAtTime(0.0001, t + 0.002, 0.012);
    sub.connect(sg); sg.connect(dry());
    sub.start(t);
    sub.stop(t + 0.10);
  }, [dry, rev]);

  // ===============================================
  // Start -- Dramatic activation
  // 3 staggered bowl strikes (220, 330, 440Hz) each 250ms apart
  // with full harmonic series (fundamental + 2.76x + 4.72x).
  // Deep 55Hz drone that swells over 1s. 3.5Hz delta binaural
  // on all layers. Total 2.5s. Meditation chamber feel.
  // ===============================================
  const playStartSound = useCallback((ctx: AudioContext) => {
    const t = ctx.currentTime;
    const freqs = [220, 330, 440];

    freqs.forEach((f, i) => {
      const nt = t + i * 0.250; // 250ms apart

      // Clean transient
      tap(ctx, nt, 0.06);

      // Full mallet strike with all partials (fundamental + 2.76x + 4.72x)
      mallet(ctx, f, 0.10, nt, 1.0);

      // Binaural grounding -- 3.5Hz delta on each strike
      const bL = ctx.createOscillator();
      bL.type = 'sine';
      bL.frequency.setValueAtTime(f, nt);
      const bPanL = ctx.createStereoPanner();
      bPanL.pan.setValueAtTime(-1, nt);

      const bR = ctx.createOscillator();
      bR.type = 'sine';
      bR.frequency.setValueAtTime(f + 3.5, nt);
      const bPanR = ctx.createStereoPanner();
      bPanR.pan.setValueAtTime(1, nt);

      const bGL = ctx.createGain();
      bGL.gain.setValueAtTime(0, nt);
      bGL.gain.linearRampToValueAtTime(0.04, nt + 0.015);
      bGL.gain.setTargetAtTime(0.0001, nt + 0.015, 0.35);

      const bGR = ctx.createGain();
      bGR.gain.setValueAtTime(0, nt);
      bGR.gain.linearRampToValueAtTime(0.04, nt + 0.015);
      bGR.gain.setTargetAtTime(0.0001, nt + 0.015, 0.35);

      bL.connect(bGL); bGL.connect(bPanL);
      bPanL.connect(dry()); bPanL.connect(rev());
      bR.connect(bGR); bGR.connect(bPanR);
      bPanR.connect(dry()); bPanR.connect(rev());

      bL.start(nt); bR.start(nt);
      bL.stop(nt + 2.5); bR.stop(nt + 2.5);
    });

    // Deep 55Hz drone with 3.5Hz delta binaural -- swells over 1s
    const droneL = ctx.createOscillator();
    droneL.type = 'sine';
    droneL.frequency.setValueAtTime(55, t);
    const dronePanL = ctx.createStereoPanner();
    dronePanL.pan.setValueAtTime(-0.9, t);

    const droneR = ctx.createOscillator();
    droneR.type = 'sine';
    droneR.frequency.setValueAtTime(58.5, t); // 55+3.5 delta
    const dronePanR = ctx.createStereoPanner();
    dronePanR.pan.setValueAtTime(0.9, t);

    // Swell envelope: 1s attack, then decay
    const dgL = ctx.createGain();
    dgL.gain.setValueAtTime(0, t);
    dgL.gain.linearRampToValueAtTime(0.04, t + 1.0); // 1s swell
    dgL.gain.setTargetAtTime(0.0001, t + 1.0, 0.40);

    const dgR = ctx.createGain();
    dgR.gain.setValueAtTime(0, t);
    dgR.gain.linearRampToValueAtTime(0.04, t + 1.0);
    dgR.gain.setTargetAtTime(0.0001, t + 1.0, 0.40);

    droneL.connect(dgL); dgL.connect(dronePanL);
    dronePanL.connect(dry()); dronePanL.connect(rev());
    droneR.connect(dgR); dgR.connect(dronePanR);
    dronePanR.connect(dry()); dronePanR.connect(rev());

    droneL.start(t); droneR.start(t);
    droneL.stop(t + 3.5); droneR.stop(t + 3.5); // well past decay
  }, [tap, mallet, dry, rev]);

  // ===============================================
  // Complete -- Session close: building harmonic chord
  // ===============================================
  const playCompleteSound = useCallback((ctx: AudioContext) => {
    const t = ctx.currentTime;
    const freqs = [220, 330, 440, 528];

    freqs.forEach((f, i) => {
      tap(ctx, t + i * 0.30, 0.07);
      mallet(ctx, f, 0.09, t + i * 0.30, 1.2);
      shimmer(ctx, f * 2.76, 0.018, t + i * 0.30 + 0.01, 1.0);
    });

    // Warm shimmer
    shimmer(ctx, 660, 0.012, t + 1.3, 0.6);

    // Final "Om" resolution at 110Hz
    const om = ctx.createOscillator();
    om.type = 'sine';
    om.frequency.setValueAtTime(110, t + 1.2);
    const omg = ctx.createGain();
    omg.gain.setValueAtTime(0, t + 1.2);
    omg.gain.linearRampToValueAtTime(0.03, t + 1.25);
    omg.gain.setTargetAtTime(0.0001, t + 1.25, 0.5);
    om.connect(omg);
    omg.connect(dry()); omg.connect(rev());
    om.start(t + 1.2);
    om.stop(t + 4.0);
  }, [tap, mallet, shimmer, dry, rev]);

  // ===============================================
  // Lose -- 2s descending binaural sweep
  // Fundamental descends 330->82Hz (two octaves).
  // Beat decelerates 14Hz Beta -> 2Hz Delta.
  // Low-pass filter tracks fundamental (800->200Hz).
  // Sub-harmonic at half fundamental frequency.
  // Slow 50ms attack, long 0.5s decay constant.
  // ===============================================
  const playLoseSound = useCallback((ctx: AudioContext) => {
    const t = ctx.currentTime;

    // Low-pass that descends with the tone: 800Hz -> 200Hz
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(800, t);
    lp.frequency.exponentialRampToValueAtTime(200, t + 2.0);
    lp.Q.setValueAtTime(0.5, t);
    lp.connect(dry()); lp.connect(rev());

    // --- Main descending binaural pair: 330->82Hz ---
    const oL = ctx.createOscillator();
    oL.type = 'sine';
    oL.frequency.setValueAtTime(330, t);
    oL.frequency.exponentialRampToValueAtTime(82, t + 2.0); // two octaves down
    const panL = ctx.createStereoPanner();
    panL.pan.setValueAtTime(-0.8, t);

    const oR = ctx.createOscillator();
    oR.type = 'sine';
    // Beat decelerates: 14Hz Beta -> 2Hz Delta over 2s
    oR.frequency.setValueAtTime(344, t);      // 330+14
    oR.frequency.exponentialRampToValueAtTime(84, t + 2.0); // 82+2
    const panR = ctx.createStereoPanner();
    panR.pan.setValueAtTime(0.8, t);

    // 50ms attack swell, 0.5s decay constant
    const gL = ctx.createGain();
    gL.gain.setValueAtTime(0, t);
    gL.gain.linearRampToValueAtTime(0.12, t + 0.050); // 50ms attack
    gL.gain.setTargetAtTime(0.0001, t + 0.050, 0.50); // 0.5s decay constant

    const gR = ctx.createGain();
    gR.gain.setValueAtTime(0, t);
    gR.gain.linearRampToValueAtTime(0.12, t + 0.050);
    gR.gain.setTargetAtTime(0.0001, t + 0.050, 0.50);

    oL.connect(gL); gL.connect(panL); panL.connect(lp);
    oR.connect(gR); gR.connect(panR); panR.connect(lp);

    oL.start(t); oR.start(t);
    oL.stop(t + 3.5); oR.stop(t + 3.5); // well past 5 time constants (5*0.5=2.5)

    // --- Sub-harmonic at half the fundamental ---
    const subL = ctx.createOscillator();
    subL.type = 'sine';
    subL.frequency.setValueAtTime(165, t); // 330/2
    subL.frequency.exponentialRampToValueAtTime(41, t + 2.0); // 82/2
    const subPanL = ctx.createStereoPanner();
    subPanL.pan.setValueAtTime(-0.5, t);

    const subR = ctx.createOscillator();
    subR.type = 'sine';
    subR.frequency.setValueAtTime(172, t); // 344/2
    subR.frequency.exponentialRampToValueAtTime(42, t + 2.0); // 84/2
    const subPanR = ctx.createStereoPanner();
    subPanR.pan.setValueAtTime(0.5, t);

    const subGL = ctx.createGain();
    subGL.gain.setValueAtTime(0, t);
    subGL.gain.linearRampToValueAtTime(0.06, t + 0.050);
    subGL.gain.setTargetAtTime(0.0001, t + 0.050, 0.50);

    const subGR = ctx.createGain();
    subGR.gain.setValueAtTime(0, t);
    subGR.gain.linearRampToValueAtTime(0.06, t + 0.050);
    subGR.gain.setTargetAtTime(0.0001, t + 0.050, 0.50);

    subL.connect(subGL); subGL.connect(subPanL); subPanL.connect(lp);
    subR.connect(subGR); subGR.connect(subPanR); subPanR.connect(lp);

    subL.start(t); subR.start(t);
    subL.stop(t + 3.5); subR.stop(t + 3.5);
  }, [dry, rev]);

  // ===============================================
  // Milestone -- Binaural bowl strikes with escalating beat
  // 8Hz@5, 12Hz@10, 16Hz@20 per streak
  // ===============================================
  const playMilestoneChord = useCallback((ctx: AudioContext) => {
    const t = ctx.currentTime;
    const streak = streakRef.current;

    let beatHz = 8;
    if (streak >= 20) beatHz = 16;
    else if (streak >= 10) beatHz = 12;

    const freqs = [330, 440, 660];
    freqs.forEach((f, i) => {
      const nt = t + i * 0.15;
      tap(ctx, nt, 0.07);
      mallet(ctx, f, 0.08, nt, 0.6);

      // Binaural entrainment layer
      const bL = ctx.createOscillator();
      bL.type = 'sine';
      bL.frequency.setValueAtTime(f, nt);
      const bPanL = ctx.createStereoPanner();
      bPanL.pan.setValueAtTime(-1, nt);

      const bR = ctx.createOscillator();
      bR.type = 'sine';
      bR.frequency.setValueAtTime(f + beatHz, nt);
      const bPanR = ctx.createStereoPanner();
      bPanR.pan.setValueAtTime(1, nt);

      const bGL = ctx.createGain();
      bGL.gain.setValueAtTime(0, nt);
      bGL.gain.linearRampToValueAtTime(0.03, nt + 0.010);
      bGL.gain.setTargetAtTime(0.0001, nt + 0.010, 0.15);

      const bGR = ctx.createGain();
      bGR.gain.setValueAtTime(0, nt);
      bGR.gain.linearRampToValueAtTime(0.03, nt + 0.010);
      bGR.gain.setTargetAtTime(0.0001, nt + 0.010, 0.15);

      bL.connect(bGL); bGL.connect(bPanL); bPanL.connect(dry());
      bR.connect(bGR); bGR.connect(bPanR); bPanR.connect(dry());

      bL.start(nt); bR.start(nt);
      bL.stop(nt + 1.0); bR.stop(nt + 1.0);
    });

    shimmer(ctx, 660, 0.02, t + 0.35, 0.8);
    shimmer(ctx, 110, 0.025, t + 0.05, 0.6);
  }, [tap, mallet, shimmer, dry]);

  // ===============================================
  // Heartbeat -- Subtle bowl pulse with harmonic
  // ===============================================
  const playHeartbeatSound = useCallback((ctx: AudioContext) => {
    const t = ctx.currentTime;

    // Main pulse -- 65Hz for phone audibility
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(65, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.008);
    g.gain.setTargetAtTime(0.0001, t + 0.008, 0.015);
    o.connect(g); g.connect(dry());
    o.start(t);
    o.stop(t + 0.12); // 5+ time constants past peak

    // Harmonic at 130Hz
    const h = ctx.createOscillator();
    h.type = 'sine';
    h.frequency.setValueAtTime(130, t);
    const hg = ctx.createGain();
    hg.gain.setValueAtTime(0, t);
    hg.gain.linearRampToValueAtTime(0.01, t + 0.008);
    hg.gain.setTargetAtTime(0.0001, t + 0.008, 0.012);
    h.connect(hg); hg.connect(dry());
    h.start(t);
    h.stop(t + 0.12);

    // Soft ting at 880Hz
    const ting = ctx.createOscillator();
    ting.type = 'sine';
    ting.frequency.setValueAtTime(880, t);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0, t);
    tg.gain.linearRampToValueAtTime(0.008, t + 0.003);
    tg.gain.setTargetAtTime(0.0001, t + 0.005, 0.008);
    ting.connect(tg); tg.connect(dry());
    ting.start(t);
    ting.stop(t + 0.06);
  }, [dry]);

  // ===============================================
  // Countdown tick -- Deep resonant bell at 528Hz (solfeggio)
  // Binaural 14Hz Beta pair. Rich 3rd harmonic at 1584Hz
  // and 5th harmonic at 2640Hz. 400ms decay tail. Reverb-heavy.
  // ===============================================
  const playCountdownTick = useCallback((ctx: AudioContext) => {
    const t = ctx.currentTime;

    // --- Binaural 528Hz pair -- 14Hz Beta ---
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(528, t);
    const pan1 = ctx.createStereoPanner();
    pan1.pan.setValueAtTime(-0.7, t);

    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(542, t); // 528+14
    const pan2 = ctx.createStereoPanner();
    pan2.pan.setValueAtTime(0.7, t);

    // 400ms decay tail
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.005);
    g.gain.setTargetAtTime(0.0001, t + 0.005, 0.08); // ~400ms tail (5*0.08)

    o1.connect(pan1); pan1.connect(g);
    o2.connect(pan2); pan2.connect(g);
    // Reverb-heavy: connect to both dry and rev
    g.connect(dry()); g.connect(rev());

    o1.start(t); o2.start(t);
    o1.stop(t + 0.6); o2.stop(t + 0.6);

    // --- 3rd harmonic at 1584Hz ---
    const h3L = ctx.createOscillator();
    h3L.type = 'sine';
    h3L.frequency.setValueAtTime(1584, t);
    const h3PanL = ctx.createStereoPanner();
    h3PanL.pan.setValueAtTime(-0.5, t);

    const h3R = ctx.createOscillator();
    h3R.type = 'sine';
    h3R.frequency.setValueAtTime(1584 + 14, t); // binaural on harmonic too
    const h3PanR = ctx.createStereoPanner();
    h3PanR.pan.setValueAtTime(0.5, t);

    const h3g = ctx.createGain();
    h3g.gain.setValueAtTime(0, t);
    h3g.gain.linearRampToValueAtTime(0.04, t + 0.003);
    h3g.gain.setTargetAtTime(0.0001, t + 0.003, 0.06); // shorter decay for higher harmonic
    h3L.connect(h3PanL); h3PanL.connect(h3g);
    h3R.connect(h3PanR); h3PanR.connect(h3g);
    h3g.connect(dry()); h3g.connect(rev());
    h3L.start(t); h3R.start(t);
    h3L.stop(t + 0.5); h3R.stop(t + 0.5);

    // --- 5th harmonic at 2640Hz ---
    const h5L = ctx.createOscillator();
    h5L.type = 'sine';
    h5L.frequency.setValueAtTime(2640, t);
    const h5PanL = ctx.createStereoPanner();
    h5PanL.pan.setValueAtTime(-0.3, t);

    const h5R = ctx.createOscillator();
    h5R.type = 'sine';
    h5R.frequency.setValueAtTime(2640 + 14, t);
    const h5PanR = ctx.createStereoPanner();
    h5PanR.pan.setValueAtTime(0.3, t);

    const h5g = ctx.createGain();
    h5g.gain.setValueAtTime(0, t);
    h5g.gain.linearRampToValueAtTime(0.02, t + 0.003);
    h5g.gain.setTargetAtTime(0.0001, t + 0.003, 0.04); // shortest decay
    h5L.connect(h5PanL); h5PanL.connect(h5g);
    h5R.connect(h5PanR); h5PanR.connect(h5g);
    h5g.connect(dry()); h5g.connect(rev());
    h5L.start(t); h5R.start(t);
    h5L.stop(t + 0.4); h5R.stop(t + 0.4);
  }, [dry, rev]);

  // ===============================================
  // Countdown GO -- Decisive bowl strike motif
  // ===============================================
  const playCountdownGo = useCallback((ctx: AudioContext) => {
    const t = ctx.currentTime;

    const motif = [330, 440, 660];
    motif.forEach((freq, i) => {
      const nt = t + i * 0.06;

      // Binaural pair
      const o1 = ctx.createOscillator();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(freq, nt);
      const pan1 = ctx.createStereoPanner();
      pan1.pan.setValueAtTime(-0.7, nt);

      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(freq + 14, nt);
      const pan2 = ctx.createStereoPanner();
      pan2.pan.setValueAtTime(0.7, nt);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, nt);
      g.gain.linearRampToValueAtTime(0.16, nt + 0.008);
      g.gain.setTargetAtTime(0.0001, nt + 0.008, 0.10);

      o1.connect(pan1); pan1.connect(g);
      o2.connect(pan2); pan2.connect(g);
      g.connect(dry()); g.connect(rev());

      o1.start(nt); o2.start(nt);
      o1.stop(nt + 0.7); o2.stop(nt + 0.7);

      // Bowl overtone
      const ot = ctx.createOscillator();
      ot.type = 'sine';
      ot.frequency.setValueAtTime(freq * 2.76, nt);
      const otg = ctx.createGain();
      otg.gain.setValueAtTime(0, nt);
      otg.gain.linearRampToValueAtTime(0.025, nt + 0.008);
      otg.gain.setTargetAtTime(0.0001, nt + 0.008, 0.06);
      ot.connect(otg);
      otg.connect(dry()); otg.connect(rev());
      ot.start(nt);
      ot.stop(nt + 0.5);

      // Second overtone
      const ot2 = ctx.createOscillator();
      ot2.type = 'sine';
      ot2.frequency.setValueAtTime(freq * 4.72, nt);
      const ot2g = ctx.createGain();
      ot2g.gain.setValueAtTime(0, nt);
      ot2g.gain.linearRampToValueAtTime(0.012, nt + 0.008);
      ot2g.gain.setTargetAtTime(0.0001, nt + 0.008, 0.04);
      ot2.connect(ot2g);
      ot2g.connect(dry()); ot2g.connect(rev());
      ot2.start(nt);
      ot2.stop(nt + 0.4);
    });
  }, [dry, rev]);

  // ===============================================
  // Time Bonus -- Ascending crystalline sweep
  // 200->1200Hz over 250ms with 10Hz binaural.
  // Sparkle layer: 3 rapid micro-chimes at 1200, 1600, 2000Hz
  // staggered 30ms apart after the sweep peaks.
  // ===============================================
  const playTimeBonusSound = useCallback((ctx: AudioContext) => {
    const t = ctx.currentTime;
    const dur = 0.250; // 250ms sweep

    // --- Left ear: 200->1200Hz ---
    const oL = ctx.createOscillator();
    oL.type = 'sine';
    oL.frequency.setValueAtTime(200, t);
    oL.frequency.exponentialRampToValueAtTime(1200, t + dur);
    const panL = ctx.createStereoPanner();
    panL.pan.setValueAtTime(-1, t);

    // --- Right ear: 210->1210Hz (10Hz constant binaural beat) ---
    const oR = ctx.createOscillator();
    oR.type = 'sine';
    oR.frequency.setValueAtTime(210, t);
    oR.frequency.exponentialRampToValueAtTime(1210, t + dur);
    const panR = ctx.createStereoPanner();
    panR.pan.setValueAtTime(1, t);

    const gL = ctx.createGain();
    gL.gain.setValueAtTime(0, t);
    gL.gain.linearRampToValueAtTime(0.12, t + 0.010);
    gL.gain.setTargetAtTime(0.0001, t + dur, 0.05);

    const gR = ctx.createGain();
    gR.gain.setValueAtTime(0, t);
    gR.gain.linearRampToValueAtTime(0.12, t + 0.010);
    gR.gain.setTargetAtTime(0.0001, t + dur, 0.05);

    oL.connect(gL); gL.connect(panL);
    panL.connect(dry()); panL.connect(rev());
    oR.connect(gR); gR.connect(panR);
    panR.connect(dry()); panR.connect(rev());

    oL.start(t); oR.start(t);
    oL.stop(t + dur + 0.4); oR.stop(t + dur + 0.4);

    // --- Sparkle layer: 3 micro-chimes after sweep peaks ---
    const sparkleFreqs = [1200, 1600, 2000];
    sparkleFreqs.forEach((sf, i) => {
      const st = t + dur + i * 0.030; // 30ms apart

      const sL = ctx.createOscillator();
      sL.type = 'sine';
      sL.frequency.setValueAtTime(sf, st);
      const sPanL = ctx.createStereoPanner();
      sPanL.pan.setValueAtTime(-0.5 + i * 0.3, st); // spread across stereo

      const sR = ctx.createOscillator();
      sR.type = 'sine';
      sR.frequency.setValueAtTime(sf + 10, st); // 10Hz binaural on sparkles too
      const sPanR = ctx.createStereoPanner();
      sPanR.pan.setValueAtTime(0.5 - i * 0.3, st);

      const sgL = ctx.createGain();
      sgL.gain.setValueAtTime(0, st);
      sgL.gain.linearRampToValueAtTime(0.04, st + 0.002); // crisp 2ms transient
      sgL.gain.setTargetAtTime(0.0001, st + 0.002, 0.015); // short sparkle tail

      const sgR = ctx.createGain();
      sgR.gain.setValueAtTime(0, st);
      sgR.gain.linearRampToValueAtTime(0.04, st + 0.002);
      sgR.gain.setTargetAtTime(0.0001, st + 0.002, 0.015);

      sL.connect(sgL); sgL.connect(sPanL);
      sPanL.connect(dry()); sPanL.connect(rev());
      sR.connect(sgR); sgR.connect(sPanR);
      sPanR.connect(dry()); sPanR.connect(rev());

      sL.start(st); sR.start(st);
      sL.stop(st + 0.12); sR.stop(st + 0.12);
    });

    // Crystalline ring-out shimmer after sweep
    shimmer(ctx, 1200, 0.02, t + dur * 0.8, 0.3);
  }, [dry, rev, shimmer]);

  // ===============================================
  const playSound = useCallback((type: SoundType, _tier: number = 1) => {
    if (!enabled) return;
    if (!canPlay(type)) return; // Instance cooldown

    const ctx = getCtx();
    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') ctx.resume();

    switch (type) {
      case 'correct': {
        playCorrectNote(ctx);
        if (streakRef.current > 0 && streakRef.current % 10 === 0) {
          setTimeout(() => playMilestoneChord(ctx), 180);
        }
        break;
      }
      case 'wrong': playWrongSound(ctx); break;
      case 'tick': playTickSound(ctx); break;
      case 'start': playStartSound(ctx); break;
      case 'complete': playCompleteSound(ctx); break;
      case 'lose': playLoseSound(ctx); break;
      case 'milestone': playMilestoneChord(ctx); break;
      case 'heartbeat': playHeartbeatSound(ctx); break;
      case 'countdownTick': playCountdownTick(ctx); break;
      case 'countdownGo': playCountdownGo(ctx); break;
      case 'timeBonus': playTimeBonusSound(ctx); break;
    }
  }, [enabled, canPlay, getCtx, playCorrectNote, playWrongSound, playTickSound, playStartSound, playCompleteSound, playLoseSound, playMilestoneChord, playHeartbeatSound, playCountdownTick, playCountdownGo, playTimeBonusSound]);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    switch (type) {
      case 'light': haptics.light(); break;
      case 'medium': haptics.medium(); break;
      case 'heavy': haptics.heavy(); break;
      case 'success': haptics.success(); break;
      case 'error': haptics.error(); break;
    }
  }, []);

  // Pre-warm audio context
  const warmup = useCallback(() => {
    const ctx = getCtx();
    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') ctx.resume();
  }, [getCtx]);

  return { playSound, triggerHaptic, setStreak, warmup };
};
