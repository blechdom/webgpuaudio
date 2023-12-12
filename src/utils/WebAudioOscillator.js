export default class WebAudioOscillator {
  constructor() {
    this.audioContext = new AudioContext();
    this.oscillator = this.audioContext.createOscillator();
    this.gain = this.audioContext.createGain();
    this.oscillator.connect(this.gain);
    this.gain.gain.value = 0;
    this.gain.connect(this.audioContext.destination);
    this.oscillator.start();
  }

  setVolume(volume) {
    this.gain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);
  }

  setFrequency(frequency) {
    this.oscillator.frequency.setTargetAtTime(frequency, this.audioContext.currentTime, 0.01);
  }

  setWaveForm(waveForm) {
    this.oscillator.type = waveForm;
  }

  stop() {
    this.gain.gain.setTargetAtTime(0.0, this.audioContext.currentTime, 0.01);
    setTimeout(() => {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.gain.disconnect();
      if (this.audioContext) this.audioContext.close();
      if (this.audioContext) this.audioContext = undefined;
    }, 100);
  }
}