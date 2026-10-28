/**
 * Pure Web Audio procedural soundscape synthesizer.
 * Zero external audio files or network requests (100% zero-404).
 */

class TerrariumSoundscape {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private masterGain: GainNode | null = null;
  
  // Rain layer
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  // Wind layer
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windOsc: OscillatorNode | null = null;

  // Crickets layer
  private cricketGain: GainNode | null = null;
  private cricketInterval: number | null = null;

  // State
  private isMuted: boolean = true;
  private volume: number = 0.5;
  private rainLevel: number = 0;
  private windLevel: number = 0.2;
  private nightLevel: number = 0;

  private initContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.setupRainLayer();
    this.setupWindLayer();
    this.setupCricketsLayer();
    this.isInitialized = true;
  }

  private setupRainLayer() {
    if (!this.ctx || !this.masterGain) return;

    // Generate 4-second pink-like noise buffer for rain
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = buffer;
    this.rainSource.loop = true;

    // Filter rain to sound like soft indoor drops on glass
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(this.rainLevel, this.ctx.currentTime);

    this.rainSource.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    this.rainSource.start();
  }

  private setupWindLayer() {
    if (!this.ctx || !this.masterGain) return;

    // Procedural gentle air breath
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 0.8;
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = buffer;
    windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // LFO to gently modulate wind frequency
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime); // 0.15 Hz slow swell
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(180, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.windFilter.frequency);
    lfo.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(this.windLevel * 0.4, this.ctx.currentTime);

    windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    windSource.start();
  }

  private setupCricketsLayer() {
    if (!this.ctx || !this.masterGain) return;

    this.cricketGain = this.ctx.createGain();
    this.cricketGain.gain.setValueAtTime(this.nightLevel * 0.18, this.ctx.currentTime);
    this.cricketGain.connect(this.masterGain);

    // Occasional subtle chirps
    this.cricketInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted || this.nightLevel < 0.2) return;
      this.playCricketChirp();
    }, 2800);
  }

  private playCricketChirp() {
    if (!this.ctx || !this.cricketGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(4500, now);
    osc.frequency.exponentialRampToValueAtTime(4900, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(4500, now + 0.08);

    chirpGain.gain.setValueAtTime(0, now);
    chirpGain.gain.linearRampToValueAtTime(0.06 * this.nightLevel, now + 0.02);
    chirpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    osc.connect(chirpGain);
    chirpGain.connect(this.cricketGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Plays a relaxing meditative chime / crystal singing bowl harmonic resonance
   */
  public playSingingBowlChime(pitch: number = 528) {
    this.ensureRunning();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const fundamental = pitch;
    // Harmonic series with slight detune for crystalline shimmer
    const harmonics = [1, 2.01, 2.99, 4.02];
    const gains = [0.35, 0.18, 0.09, 0.04];

    harmonics.forEach((ratio, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(fundamental * ratio, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(gains[idx] * (this.isMuted ? 0 : 1), now + 0.06);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 4.6);
    });
  }

  public ensureRunning() {
    if (!this.isInitialized) {
      this.initContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      this.ensureRunning();
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public updateEnvironment(rainIntensity: number, windSpeed: number, hour: number) {
    this.rainLevel = rainIntensity;
    this.windLevel = windSpeed;
    const isNight = hour >= 20 || hour <= 5;
    this.nightLevel = isNight ? 1.0 : 0.0;

    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.rainGain) {
        this.rainGain.gain.setTargetAtTime(this.rainLevel * 0.45, now, 0.2);
      }
      if (this.windGain) {
        this.windGain.gain.setTargetAtTime(0.05 + this.windLevel * 0.2, now, 0.2);
      }
      if (this.cricketGain) {
        this.cricketGain.gain.setTargetAtTime(this.nightLevel * 0.16, now, 0.5);
      }
    }
  }

  public dispose() {
    if (this.cricketInterval) {
      clearInterval(this.cricketInterval);
      this.cricketInterval = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isInitialized = false;
  }
}

export const soundscape = new TerrariumSoundscape();
