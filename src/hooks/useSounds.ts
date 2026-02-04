import { useCallback, useRef } from 'react';

type SoundType = 'correct' | 'wrong' | 'tick' | 'start' | 'complete' | 'lose' | 'milestone' | 'heartbeat';

// C Major Scale - Do Re Mi Fa Sol La Si Do (ascending)
const C_MAJOR_SCALE = [
  261.63,  // C4 - Do
  293.66,  // D4 - Re
  329.63,  // E4 - Mi
  349.23,  // F4 - Fa
  392.00,  // G4 - Sol
  440.00,  // A4 - La
  493.88,  // B4 - Si
  523.25,  // C5 - Do (octave)
];

// Volume reduction for higher notes (ear-friendly)
const NOTE_VOLUMES = [0.32, 0.30, 0.28, 0.26, 0.24, 0.22, 0.20, 0.18];

export const useSounds = (enabled: boolean = true) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streakRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const setStreak = useCallback((streak: number) => {
    streakRef.current = streak;
  }, []);

  // Crystal clear piano-like note
  const playPianoNote = useCallback((ctx: AudioContext, frequency: number, volume: number, startTime: number) => {
    // Main tone (sine for purity)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, startTime);
    
    // Subtle harmonic (one octave up, quieter)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, startTime);
    
    // Piano-like envelope: fast attack, medium decay, no sustain
    gain1.gain.setValueAtTime(0, startTime);
    gain1.gain.linearRampToValueAtTime(volume, startTime + 0.008); // 8ms attack
    gain1.gain.exponentialRampToValueAtTime(volume * 0.5, startTime + 0.08);
    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
    
    // Harmonic envelope (faster decay)
    gain2.gain.setValueAtTime(0, startTime);
    gain2.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);
    
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + 0.4);
    osc2.stop(startTime + 0.25);
  }, []);

  // Dissonant "wrong" chord - minor second clash
  const playDissonantChord = useCallback((ctx: AudioContext, startTime: number) => {
    // Play two clashing notes (minor second interval = maximum dissonance)
    const baseFreq = 220; // A3
    const clashFreq = 233.08; // Bb3 (minor second above)
    
    [baseFreq, clashFreq].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle'; // Softer than square but still "off"
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Slightly offset for even more "clang"
      const noteTime = startTime + i * 0.015;
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.18, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
    
    // Add a low "thud" for impact
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(80, startTime);
    thud.frequency.exponentialRampToValueAtTime(40, startTime + 0.15);
    thudGain.gain.setValueAtTime(0.2, startTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(startTime);
    thud.stop(startTime + 0.2);
  }, []);

  // Triumphant ascending chord for milestones
  const playMilestoneChord = useCallback((ctx: AudioContext) => {
    const time = ctx.currentTime;
    // C Major chord ascending arpeggio
    const chordFreqs = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C5
    
    chordFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      const noteTime = time + i * 0.04;
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.06, noteTime + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.7);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.8);
    });
  }, []);

  // Sad descending arpeggio for losing
  const playLoseSound = useCallback((ctx: AudioContext) => {
    const time = ctx.currentTime;
    // Descending minor arpeggio
    const notes = [392.00, 349.23, 311.13, 261.63]; // G, F, Eb, C (C minor feeling)
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      
      const noteTime = time + i * 0.12;
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.15, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
    });
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!enabled) return;
    
    const ctx = getAudioContext();
    const time = ctx.currentTime;

    switch (type) {
      case 'correct': {
        // Get note from C major scale based on streak (loops through octave)
        const noteIndex = streakRef.current % C_MAJOR_SCALE.length;
        const frequency = C_MAJOR_SCALE[noteIndex];
        const volume = NOTE_VOLUMES[noteIndex];
        
        playPianoNote(ctx, frequency, volume, time);
        
        // Milestone chord every 10th correct
        if (streakRef.current > 0 && streakRef.current % 10 === 0) {
          setTimeout(() => playMilestoneChord(ctx), 80);
        }
        break;
      }

      case 'wrong': {
        // Dissonant piano chord - sounds "off"
        playDissonantChord(ctx, time);
        break;
      }

      case 'tick': {
        // Soft tick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, time);
        gain.gain.setValueAtTime(0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.05);
        break;
      }

      case 'start': {
        // Rising arpeggio - Do Re Mi
        const notes = [261.63, 293.66, 329.63, 392.00];
        notes.forEach((freq, i) => {
          playPianoNote(ctx, freq, 0.22, time + i * 0.08);
        });
        break;
      }

      case 'complete': {
        // Triumphant chord progression
        playMilestoneChord(ctx);
        setTimeout(() => {
          const ctx2 = getAudioContext();
          // Final flourish - high C
          playPianoNote(ctx2, 523.25, 0.2, ctx2.currentTime);
        }, 300);
        break;
      }

      case 'lose': {
        // Sad descending sound
        playLoseSound(ctx);
        break;
      }

      case 'milestone': {
        playMilestoneChord(ctx);
        break;
      }

      case 'heartbeat': {
        // Deep heartbeat for tension
        const beat1 = ctx.createOscillator();
        const beat2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        
        beat1.type = 'sine';
        beat2.type = 'sine';
        beat1.frequency.setValueAtTime(55, time);
        beat2.frequency.setValueAtTime(50, time + 0.1);
        
        gain1.gain.setValueAtTime(0.1, time);
        gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        
        gain2.gain.setValueAtTime(0, time);
        gain2.gain.setValueAtTime(0.06, time + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
        
        beat1.connect(gain1);
        beat2.connect(gain2);
        gain1.connect(ctx.destination);
        gain2.connect(ctx.destination);
        
        beat1.start(time);
        beat2.start(time + 0.1);
        beat1.stop(time + 0.12);
        beat2.stop(time + 0.25);
        break;
      }
    }
  }, [enabled, getAudioContext, playPianoNote, playDissonantChord, playMilestoneChord, playLoseSound]);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [8],
        medium: [15],
        heavy: [25, 8, 25],
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  return { playSound, triggerHaptic, setStreak };
};
