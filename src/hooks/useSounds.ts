import { useCallback, useRef } from 'react';

type SoundType = 'correct' | 'wrong' | 'tick' | 'start' | 'complete' | 'milestone' | 'heartbeat';

// C Major Pentatonic Scale - pleasant, never harsh
const PENTATONIC_SCALE = [
  261.63,  // C4
  293.66,  // D4
  329.63,  // E4
  392.00,  // G4
  440.00,  // A4
  523.25,  // C5
  587.33,  // D5
  659.25,  // E5
  783.99,  // G5
  880.00,  // A5
];

// Volume reduction for higher notes (ear-friendly)
const NOTE_VOLUMES = [0.35, 0.33, 0.31, 0.29, 0.27, 0.25, 0.23, 0.21, 0.19, 0.17];

export const useSounds = () => {
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

  // Crystal Glass sound - soft sine/triangle with fast attack, gentle decay
  const playCrystalNote = useCallback((ctx: AudioContext, frequency: number, volume: number, startTime: number) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Use triangle wave for softer, crystal-like timbre
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    
    // Add subtle vibrato for richness
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.setValueAtTime(5, startTime); // 5Hz vibrato
    vibratoGain.gain.setValueAtTime(2, startTime); // subtle pitch variation
    vibrato.connect(vibratoGain);
    vibratoGain.connect(oscillator.frequency);
    
    // Crystal glass envelope: fast attack, soft decay
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01); // 10ms attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.6, startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4); // 400ms decay
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(startTime);
    vibrato.start(startTime);
    oscillator.stop(startTime + 0.5);
    vibrato.stop(startTime + 0.5);
  }, []);

  // Play a rich chord for milestones
  const playMilestoneChord = useCallback((ctx: AudioContext) => {
    const time = ctx.currentTime;
    // C Major chord with slight spread for richness
    const chordFreqs = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C5
    
    chordFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      // Stagger the notes slightly for a richer sound
      const noteTime = time + i * 0.02;
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.15, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.08, noteTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + 1);
    });
  }, []);

  const playSound = useCallback((type: SoundType) => {
    const ctx = getAudioContext();
    const time = ctx.currentTime;

    switch (type) {
      case 'correct': {
        // Get note from pentatonic scale based on streak (loops back)
        const noteIndex = streakRef.current % PENTATONIC_SCALE.length;
        const frequency = PENTATONIC_SCALE[noteIndex];
        const volume = NOTE_VOLUMES[noteIndex];
        
        playCrystalNote(ctx, frequency, volume, time);
        
        // Check for milestone (every 10th correct)
        if (streakRef.current > 0 && streakRef.current % 10 === 0) {
          setTimeout(() => playMilestoneChord(ctx), 100);
        }
        break;
      }

      case 'wrong': {
        // Soft, low "thud" - not harsh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.15);
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + 0.25);
        break;
      }

      case 'tick': {
        // Soft tick - like a gentle tap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, time);
        
        gain.gain.setValueAtTime(0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + 0.05);
        break;
      }

      case 'start': {
        // Rising arpeggio - exciting but pleasant
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, i) => {
          playCrystalNote(ctx, freq, 0.25, time + i * 0.08);
        });
        break;
      }

      case 'complete': {
        // Triumphant chord sequence
        const sequence = [
          { notes: [261.63, 329.63, 392.00], delay: 0 },
          { notes: [293.66, 392.00, 493.88], delay: 0.2 },
          { notes: [329.63, 440.00, 523.25], delay: 0.4 },
        ];
        
        sequence.forEach(({ notes, delay }) => {
          notes.forEach((freq, i) => {
            playCrystalNote(ctx, freq, 0.2 - i * 0.03, time + delay + i * 0.01);
          });
        });
        break;
      }

      case 'milestone': {
        playMilestoneChord(ctx);
        break;
      }

      case 'heartbeat': {
        // Deep, subtle heartbeat for tension in endless mode
        const beat1 = ctx.createOscillator();
        const beat2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        
        beat1.type = 'sine';
        beat2.type = 'sine';
        beat1.frequency.setValueAtTime(60, time);
        beat2.frequency.setValueAtTime(55, time + 0.12);
        
        // First thump (louder)
        gain1.gain.setValueAtTime(0.12, time);
        gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        // Second thump (softer, delayed)
        gain2.gain.setValueAtTime(0, time);
        gain2.gain.setValueAtTime(0.08, time + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
        
        beat1.connect(gain1);
        beat2.connect(gain2);
        gain1.connect(ctx.destination);
        gain2.connect(ctx.destination);
        
        beat1.start(time);
        beat2.start(time + 0.12);
        beat1.stop(time + 0.15);
        beat2.stop(time + 0.3);
        break;
      }
    }
  }, [getAudioContext, playCrystalNote, playMilestoneChord]);

  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30],
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  return { playSound, triggerHaptic, setStreak };
};
