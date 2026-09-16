export class MenuAudio {
  private context: AudioContext | null = null;

  play() {
    try {
      this.context ??= new AudioContext();
      const context = this.context;
      void context.resume().then(() => {
        if (this.context !== context || context.state !== "running") return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const now = context.currentTime;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(720, now);
        oscillator.frequency.exponentialRampToValueAtTime(1080, now + 0.06);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.045, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.08);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      }).catch(() => {});
    } catch {}
  }

  dispose() {
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
  }
}
