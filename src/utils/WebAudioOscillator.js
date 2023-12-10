export default class WebAudioOscillator {
  constructor() {
    this.audioContext = new AudioContext();
    this.oscillator = this.audioContext.createOscillator();
    this.gain = this.audioContext.createGain();
    //this.oscillator.type = "sine";
    //this.oscillator.frequency.setValueAtTime(222, this.audioContext.currentTime);
    this.oscillator.connect(this.gain);
    this.gain.gain.value = 0;
    this.gain.connect(this.audioContext.destination);
    this.oscillator.start();
  }

  setVolume(volume) {
    this.gain.gain.value = volume;
  }

  setFrequency(frequency) {
    this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
  }

  setWaveForm(waveForm) {
    this.oscillator.type = waveForm;
  }

  stop() {
    this.oscillator.stop();
  }

  close() {
    this.oscillator.disconnect();
    this.gain.disconnect();
    if (this.audioContext) this.audioContext.close();
    if (this.audioContext) this.audioContext = undefined;
  }
}