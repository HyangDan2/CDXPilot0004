export const RESULT_MELODIES = Object.freeze({
  S: [523.25, 659.25, 783.99, 1046.5, 1318.51],
  clear: [523.25, 659.25, 783.99, 1046.5],
  gentle: [392, 523.25, 659.25],
  failed: [392, 329.63, 261.63, 196],
});
export class SoundEffects {
  constructor(audio) {
    this.audio = audio;
    this.voices = new Set();
  }
  tone(frequency, at, duration = 0.16, volume = 0.12) {
    const context = this.audio.context,
      oscillator = context.createOscillator(),
      envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(volume, at + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(envelope);
    envelope.connect(this.audio.sfxGain);
    const voice = { oscillator, envelope };
    this.voices.add(voice);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      this.voices.delete(voice);
    };
    oscillator.start(at);
    oscillator.stop(at + duration + 0.01);
  }
  countdown(startedAt, deadline) {
    this.stop();
    for (let at = startedAt; at < deadline - 0.01; at++) this.tone(523.25, at);
    this.tone(1046.5, deadline, 0.28, 0.15);
  }
  result(grade, failed) {
    this.stop();
    const melody =
      RESULT_MELODIES[
        failed
          ? "failed"
          : grade === "S"
            ? "S"
            : ["A", "B"].includes(grade)
              ? "clear"
              : "gentle"
      ];
    const now = this.audio.context.currentTime;
    melody.forEach((frequency, index) =>
      this.tone(
        frequency,
        now + index * 0.16,
        index === melody.length - 1 ? 0.65 : 0.22,
        0.13,
      ),
    );
  }
  stop() {
    for (const { oscillator, envelope } of this.voices) {
      oscillator.onended = null;
      oscillator.stop();
      oscillator.disconnect();
      envelope.disconnect();
    }
    this.voices.clear();
  }
}
