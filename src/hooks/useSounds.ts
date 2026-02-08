import { useCallback, useRef } from 'react';
import { haptics } from '@/utils/despia';

type SoundType = 'correct' | 'wrong' | 'tick' | 'start' | 'complete' | 'lose' | 'milestone' | 'heartbeat';

// Pentatonic Scale - Always sounds pleasant and harmonious
const PENTATONIC_SCALE = [
  523.25,  // C5
  587.33,  // D5
  659.25,  // E5
  783.99,  // G5
  880.00,  // A5
  1046.50, // C6 (octave)
];

// Master volume (0.6 as requested for overall softness)
const MASTER_GAIN = 0.6;

export const useSounds = (enabled: boolean = true) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const streakRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Create master gain node
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.gain.setValueAtTime(MASTER_GAIN, audioContextRef.current.currentTime);
      masterGainRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, []);

  const getMasterGain = useCallback(() => {
    if (!masterGainRef.current) {
      getAudioContext();
    }
    return masterGainRef.current!;
  }, [getAudioContext]);

  const setStreak = useCallback((streak: number) => {
    streakRef.current = streak;
  }, []);

  // Create a low-pass filtered sine tone for warmth
  const createWarmTone = useCallback((
    ctx: AudioContext,
    frequency: number,
    volume: number,
    startTime: number,
    duration: number,
    attackTime: number = 0.02,
    filterFreq: number = 2000
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Pure sine wave for warmth
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);
    
    // Low-pass filter to remove harsh frequencies
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.Q.setValueAtTime(0.7, startTime); // Gentle resonance
    
    // Soft envelope: gentle attack, smooth exponential decay
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + attackTime);
    gain.gain.exponentialRampToValueAtTime(volume * 0.3, startTime + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    // Connect through filter to master gain
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getMasterGain());
    
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
    
    return { osc, gain, filter };
  }, [getMasterGain]);

  // Soft pentatonic note for correct answers
  const playCorrectNote = useCallback((ctx: AudioContext, tier: number) => {
    const time = ctx.currentTime;
    
    // Get note from pentatonic scale based on streak (always sounds good)
    const noteIndex = streakRef.current % PENTATONIC_SCALE.length;
    const baseFrequency = PENTATONIC_SCALE[noteIndex];
    
    // Subtler tier-based pitch adjustment (smaller shifts)
    const tierPitchMultiplier = 1 + (tier - 1) * 0.05; // Tier 1: 1x, Tier 5: 1.2x
    const frequency = baseFrequency * tierPitchMultiplier;
    
    // Warm sine wave with low-pass filter
    createWarmTone(ctx, frequency, 0.15, time, 0.2, 0.02, 2000);
    
    // Add very subtle octave harmonic for richness
    createWarmTone(ctx, frequency * 2, 0.03, time, 0.15, 0.02, 1500);
  }, [createWarmTone]);

  // Soft "boop" for wrong answers - gentle, not jarring
  const playWrongSound = useCallback((ctx: AudioContext) => {
    const time = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Low sine wave - soft boop
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, time);
    
    // Low-pass to keep it mellow
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, time);
    filter.Q.setValueAtTime(0.5, time);
    
    // Quick, gentle envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getMasterGain());
    
    osc.start(time);
    osc.stop(time + 0.2);
  }, [getMasterGain]);

  // Pentatonic ascending arpeggio for milestones
  const playMilestoneChord = useCallback((ctx: AudioContext) => {
    const time = ctx.currentTime;
    // Pentatonic chord: C5, E5, G5, C6 - always sounds harmonious
    const chordFreqs = [523.25, 659.25, 783.99, 1046.50];
    
    chordFreqs.forEach((freq, i) => {
      // 100ms spacing between notes for musical feel
      const noteTime = time + i * 0.1;
      createWarmTone(ctx, freq, 0.12, noteTime, 0.5, 0.025, 3000);
    });
  }, [createWarmTone]);

  // Melancholic descending tone for losing
  const playLoseSound = useCallback((ctx: AudioContext) => {
    const time = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Descending sine wave
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, time);
    osc.frequency.exponentialRampToValueAtTime(200, time + 0.4);
    
    // Low-pass filter for warmth
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.Q.setValueAtTime(0.5, time);
    
    // Gentle envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getMasterGain());
    
    osc.start(time);
    osc.stop(time + 0.45);
  }, [getMasterGain]);

  // Very subtle tick sound
  const playTickSound = useCallback((ctx: AudioContext, tier: number) => {
    const time = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    // Subtle tier adjustment
    const tierMultiplier = 1 + (tier - 1) * 0.03;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 * tierMultiplier, time);
    
    // Filter to soften
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, time);
    
    // Very quiet and short
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getMasterGain());
    
    osc.start(time);
    osc.stop(time + 0.04);
  }, [getMasterGain]);

  // Gentle start sound - ascending pentatonic
  const playStartSound = useCallback((ctx: AudioContext) => {
    const time = ctx.currentTime;
    const notes = [523.25, 587.33, 659.25, 783.99]; // C5, D5, E5, G5
    
    notes.forEach((freq, i) => {
      createWarmTone(ctx, freq, 0.12, time + i * 0.08, 0.25, 0.02, 2500);
    });
  }, [createWarmTone]);

  // Complete sound - triumphant but soft
  const playCompleteSound = useCallback((ctx: AudioContext) => {
    const time = ctx.currentTime;
    
    // Play milestone chord
    const chordFreqs = [523.25, 659.25, 783.99, 1046.50];
    chordFreqs.forEach((freq, i) => {
      createWarmTone(ctx, freq, 0.1, time + i * 0.08, 0.6, 0.025, 2500);
    });
    
    // Final flourish - high pentatonic note
    setTimeout(() => {
      const ctx2 = getAudioContext();
      createWarmTone(ctx2, 1046.50, 0.12, ctx2.currentTime, 0.4, 0.02, 3000);
    }, 350);
  }, [createWarmTone, getAudioContext]);

  // Soft heartbeat for tension
  const playHeartbeatSound = useCallback((ctx: AudioContext, tier: number) => {
    const time = ctx.currentTime;
    
    // Subtler tier adjustment for heartbeat
    const tierMultiplier = 1 - (tier - 1) * 0.03; // Lower pitch at higher tiers
    
    const createBeat = (startTime: number, freq: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * tierMultiplier, startTime);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(getMasterGain());
      
      osc.start(startTime);
      osc.stop(startTime + 0.1);
    };
    
    // Two-beat pattern (lub-dub)
    createBeat(time, 55, 0.08);
    createBeat(time + 0.1, 50, 0.05);
  }, [getMasterGain]);

  const playSound = useCallback((type: SoundType, tier: number = 1) => {
    if (!enabled) return;
    
    const ctx = getAudioContext();
    
    // Resume audio context if suspended (mobile browser policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    switch (type) {
      case 'correct': {
        playCorrectNote(ctx, tier);
        
        // Milestone chord every 10th correct
        if (streakRef.current > 0 && streakRef.current % 10 === 0) {
          setTimeout(() => playMilestoneChord(ctx), 100);
        }
        break;
      }

      case 'wrong': {
        playWrongSound(ctx);
        break;
      }

      case 'tick': {
        playTickSound(ctx, tier);
        break;
      }

      case 'start': {
        playStartSound(ctx);
        break;
      }

      case 'complete': {
        playCompleteSound(ctx);
        break;
      }

      case 'lose': {
        playLoseSound(ctx);
        break;
      }

      case 'milestone': {
        playMilestoneChord(ctx);
        break;
      }

      case 'heartbeat': {
        playHeartbeatSound(ctx, tier);
        break;
      }
    }
  }, [enabled, getAudioContext, playCorrectNote, playWrongSound, playTickSound, playStartSound, playCompleteSound, playLoseSound, playMilestoneChord, playHeartbeatSound]);

  /**
   * Trigger haptic feedback - uses native Despia haptics when available,
   * falls back to Vibration API for web
   */
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    switch (type) {
      case 'light':
        haptics.light();
        break;
      case 'medium':
        haptics.medium();
        break;
      case 'heavy':
        haptics.heavy();
        break;
      case 'success':
        haptics.success();
        break;
      case 'error':
        haptics.error();
        break;
    }
  }, []);

  return { playSound, triggerHaptic, setStreak };
};
