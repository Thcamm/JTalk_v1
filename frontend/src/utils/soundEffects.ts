/**
 * Web Audio API Sound Effects Synthesizer for JTalk
 *
 * Zero external audio files required, zero latency, 100% reliable across all browsers.
 * Synthesizes cheerful dopamine-triggering feedback similar to Duolingo & ELSA Speak.
 */

class SoundEffectsManager {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("jtalk_sfx_enabled");
      this.enabled = stored !== null ? stored === "true" : true;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (typeof window !== "undefined") {
      localStorage.setItem("jtalk_sfx_enabled", String(val));
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return null;
      if (!this.audioCtx || this.audioCtx.state === "closed") {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (err) {
      console.debug("AudioContext not accessible:", err);
      return null;
    }
  }

  /**
   * Play a clean sine tone at a given frequency, duration and timing
   */
  private playTone(
    freq: number,
    startTime: number,
    duration: number,
    gainLevel: number = 0.15,
    type: OscillatorType = "sine"
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(gainLevel, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  /**
   * 1. Success Fanfare (Duolingo-style Perfect Chime):
   * Triggered when overallScore >= 80 (C5 -> E5 -> G5 -> C6 Arpeggio + Shimmer)
   */
  public playSuccess(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Arpeggio notes: C5, E5, G5, C6
      this.playTone(523.25, now + 0.0, 0.15, 0.22, "sine");
      this.playTone(659.25, now + 0.08, 0.15, 0.24, "sine");
      this.playTone(783.99, now + 0.16, 0.18, 0.26, "sine");
      this.playTone(1046.5, now + 0.24, 0.45, 0.3, "triangle");

      // High harmonic sparkle shimmer
      this.playTone(2093.0, now + 0.32, 0.35, 0.1, "sine");
    } catch (err) {
      console.debug("SFX playSuccess error:", err);
    }
  }

  /**
   * 2. Good Effort Chime:
   * Triggered when overallScore between 60 and 79 (Warm major chord)
   */
  public playGood(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Warm chord: E5 -> G5
      this.playTone(659.25, now + 0.0, 0.2, 0.2, "sine");
      this.playTone(783.99, now + 0.1, 0.35, 0.25, "triangle");
      this.playTone(987.77, now + 0.18, 0.3, 0.15, "sine");
    } catch (err) {
      console.debug("SFX playGood error:", err);
    }
  }

  /**
   * 3. Encouragement Tone (Gentle "Keep going" sound):
   * Triggered when overallScore < 60 (Soft, non-punishing, encouraging tone)
   */
  public playEncourage(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Soft uplifting progression: G4 -> C5
      this.playTone(392.0, now + 0.0, 0.22, 0.18, "sine");
      this.playTone(523.25, now + 0.14, 0.32, 0.2, "sine");
    } catch (err) {
      console.debug("SFX playEncourage error:", err);
    }
  }

  /**
   * 4. Hint Bubble Pop:
   * Triggered when clicking to expand Smart Hint modal / suggestions
   */
  public playHintPop(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (err) {
      console.debug("SFX playHintPop error:", err);
    }
  }

  /**
   * 5. Light Tap Feedback
   */
  public playTap(): void {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      this.playTone(600, now, 0.05, 0.08, "sine");
    } catch (err) {
      console.debug("SFX playTap error:", err);
    }
  }
}

export const soundEffects = new SoundEffectsManager();
export default soundEffects;
