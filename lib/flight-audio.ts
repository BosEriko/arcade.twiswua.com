import { Chiptune } from "./music";
import type { FlightEvent } from "./flight";

export class FlightAudio {
  private music = new Chiptune("flight");
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  play() {
    if (this.muted) return;
    this.music.play();
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0.065;
        this.master.connect(this.context.destination);
      }
      if (this.context.state !== "running")
        void this.context.resume().catch(() => {});
      this.master?.gain.setTargetAtTime(0.065, this.context.currentTime, 0.01);
    } catch {}
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) this.pause();
  }

  pause() {
    this.music.pause();
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.01);
  }

  sound(event: FlightEvent) {
    if (
      this.muted ||
      !this.context ||
      !this.master ||
      this.context.state !== "running"
    )
      return;
    const frequencies: Record<FlightEvent, [number, number, number]> = {
      flap: [380, 640, 0.07],
      star: [880, 1320, 0.16],
      perfect: [660, 990, 0.2],
      shield: [480, 1440, 0.3],
      hit: [220, 110, 0.2],
      over: [300, 70, 0.38],
    };
    const [from, to, duration] = frequencies[event];
    const c = this.context;
    const oscillator = c.createOscillator();
    const gain = c.createGain();
    oscillator.type = event === "flap" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(from, c.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      to,
      c.currentTime + duration,
    );
    gain.gain.setValueAtTime(event === "flap" ? 0.2 : 0.65, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start();
    oscillator.stop(c.currentTime + duration);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  stopMusic() {
    this.music.pause();
  }

  dispose() {
    this.music.dispose();
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
    this.master = null;
  }
}
