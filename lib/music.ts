const melody = [
  76, 0, 79, 83, 81, 79, 76, 74, 72, 0, 76, 79, 78, 76, 74, 71, 69, 0, 72, 76,
  79, 76, 72, 71, 74, 0, 78, 81, 83, 81, 78, 74, 76, 79, 83, 88, 86, 83, 81, 79,
  76, 0, 79, 84, 83, 79, 76, 72, 69, 72, 76, 81, 79, 76, 74, 72, 71, 74, 78, 83,
  81, 78, 74, 0,
];
const bass = [45, 48, 41, 43, 45, 48, 41, 43];

const tracks = {
  survival: { melody, bass, tempo: 128, voice: "square", sustain: 0.8, percussion: true },
  eggswiper: {
    melody: [72, 76, 79, 0, 76, 74, 72, 0, 74, 77, 81, 0, 79, 77, 74, 0,
      76, 79, 84, 83, 81, 79, 76, 0, 77, 76, 74, 71, 72, 0, 0, 0],
    bass: [48, 50, 45, 43], tempo: 104, voice: "triangle", sustain: 0.55, percussion: false,
  },
  flight: {
    melody: [74, 0, 78, 81, 86, 0, 85, 81, 83, 0, 81, 78, 76, 0, 78, 0,
      79, 0, 83, 86, 88, 86, 83, 81, 78, 0, 76, 73, 74, 0, 0, 0],
    bass: [50, 47, 43, 45], tempo: 116, voice: "sine", sustain: 1.3, percussion: false,
  },
  dash: {
    melody: [76, 79, 83, 79, 86, 83, 79, 83, 74, 78, 81, 78, 84, 81, 78, 81,
      72, 76, 79, 76, 83, 79, 76, 79, 74, 78, 81, 83, 86, 83, 81, 78],
    bass: [40, 38, 36, 38], tempo: 156, voice: "square", sustain: 0.55, percussion: true,
  },
} satisfies Record<string, {
  melody: number[];
  bass: number[];
  tempo: number;
  voice: OscillatorType;
  sustain: number;
  percussion: boolean;
}>;

export class Chiptune {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextNote = 0;
  private step = 0;
  private active = false;

  private readonly track: keyof typeof tracks;

  constructor(track: keyof typeof tracks) {
    this.track = track;
  }

  play() {
    this.active = true;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.context.destination);
      }
      void this.context
        .resume()
        .then(() => {
          if (!this.active || !this.context || !this.master) return;
          this.master.gain.setTargetAtTime(
            0.12,
            this.context.currentTime,
            0.03,
          );
          if (this.timer !== null) return;
          this.nextNote = this.context.currentTime + 0.04;
          this.schedule();
          this.timer = setInterval(() => this.schedule(), 25);
        })
        .catch(() => this.pause());
    } catch {
      this.pause();
    }
  }

  pause() {
    this.active = false;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.015);
    }
  }

  dispose() {
    this.pause();
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
    this.master = null;
  }

  private note(
    midi: number,
    time: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ) {
    if (!this.context || !this.master || !midi) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  private schedule() {
    if (!this.context || !this.active) return;
    const track = tracks[this.track];
    const beat = 60 / track.tempo / 2;
    this.nextNote = Math.max(this.nextNote, this.context.currentTime);
    while (this.nextNote < this.context.currentTime + 0.12) {
      const root = track.bass[Math.floor(this.step / 8) % track.bass.length];
      this.note(
        track.melody[this.step % track.melody.length],
        this.nextNote,
        beat * track.sustain,
        track.voice,
        0.2,
      );
      this.note(
        root + (this.step % 2 ? 12 : 0),
        this.nextNote,
        beat * 0.9,
        "triangle",
        0.45,
      );
      if (track.percussion && this.step % 2 === 0)
        this.note(33, this.nextNote, 0.055, "triangle", 0.3);
      if (track.percussion && this.step % 2 === 1)
        this.note(100, this.nextNote, 0.018, "square", 0.035);
      this.nextNote += beat;
      this.step = (this.step + 1) % track.melody.length;
    }
  }
}
