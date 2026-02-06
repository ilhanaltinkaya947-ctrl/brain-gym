// Low-latency audio manager using Web Audio API with HTML5 Audio fallback
type SoundType = 'correct' | 'wrong' | 'tick' | 'heatup' | 'win' | 'heartbeat';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private buffers: Map<SoundType, AudioBuffer> = new Map();
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Defer initialization until user interaction (browser autoplay policy)
    if (typeof window !== 'undefined') {
      this.initOnInteraction();
    }
  }

  private initOnInteraction() {
    const initAudio = () => {
      if (!this.isInitialized) {
        this.initializeAudioContext();
        this.preloadSounds();
        this.isInitialized = true;
      }
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('click', initAudio);
    };
    
    document.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('click', initAudio, { once: true });
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported, falling back to HTML5 Audio');
    }
  }

  private preloadSounds() {
    // Synthesize sounds using Web Audio API for zero-latency
    const soundConfigs: Record<SoundType, { frequency: number; duration: number; type: OscillatorType; envelope: 'pluck' | 'sustain' }> = {
      correct: { frequency: 880, duration: 0.15, type: 'triangle', envelope: 'pluck' },
      wrong: { frequency: 220, duration: 0.3, type: 'sawtooth', envelope: 'sustain' },
      tick: { frequency: 1200, duration: 0.05, type: 'sine', envelope: 'pluck' },
      heatup: { frequency: 440, duration: 0.4, type: 'triangle', envelope: 'sustain' },
      win: { frequency: 660, duration: 0.5, type: 'triangle', envelope: 'pluck' },
      heartbeat: { frequency: 60, duration: 0.2, type: 'sine', envelope: 'sustain' },
    };

    // Pre-create audio buffers for each sound
    if (this.audioContext) {
      Object.entries(soundConfigs).forEach(([key, config]) => {
        this.createSoundBuffer(key as SoundType, config);
      });
    }
  }

  private createSoundBuffer(
    type: SoundType, 
    config: { frequency: number; duration: number; type: OscillatorType; envelope: 'pluck' | 'sustain' }
  ) {
    if (!this.audioContext) return;
    
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * config.duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Generate waveform
      switch (config.type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * config.frequency * t);
          break;
        case 'triangle':
          sample = Math.abs((4 * config.frequency * t % 4) - 2) - 1;
          break;
        case 'sawtooth':
          sample = 2 * (config.frequency * t % 1) - 1;
          break;
        default:
          sample = Math.sin(2 * Math.PI * config.frequency * t);
      }

      // Apply envelope
      const progress = i / length;
      let envelope = 1;
      if (config.envelope === 'pluck') {
        envelope = Math.exp(-progress * 8);
      } else {
        envelope = progress < 0.1 ? progress * 10 : Math.exp(-(progress - 0.1) * 3);
      }

      data[i] = sample * envelope * 0.3; // Volume scaling
    }

    this.buffers.set(type, buffer);
  }

  play(type: SoundType) {
    if (this.isMuted) return;

    // Initialize on first play if not already done
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.initializeAudioContext();
      this.preloadSounds();
      this.isInitialized = true;
    }

    if (this.audioContext && this.buffers.has(type)) {
      try {
        // Resume context if suspended (mobile browser policy)
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = this.buffers.get(type)!;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Rapid-fire support: each play creates new source node
        source.start(0);
      } catch (e) {
        console.warn('Audio playback failed:', e);
      }
    }
  }

  // Play ascending note based on streak (C Major scale)
  playStreakNote(streak: number) {
    if (this.isMuted || !this.audioContext) return;
    
    const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C4 to C5
    const noteIndex = streak % scale.length;
    const octaveMultiplier = Math.floor(streak / scale.length) + 1;
    const frequency = scale[noteIndex] * (octaveMultiplier > 2 ? 2 : octaveMultiplier);

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'triangle';
    osc.frequency.value = frequency;
    
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.4);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  get muted() {
    return this.isMuted;
  }
}

// Singleton instance
export const soundManager = new SoundManager();
