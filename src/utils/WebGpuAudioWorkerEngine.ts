const NUM_CHANNELS = 2;
const MAX_BUFFERED_CHUNKS = 2;

export default class WebGpuAudioEngine {
  public audioContext: AudioContext | undefined;
  public chunkDurationInSeconds: number;
  public chunkNumSamplesPerChannel: number;
  public sampleRate: number;
  public timeoutId: NodeJS.Timeout | null = null;

  constructor(chunkDurationInSeconds: number) {
    this.audioContext = new AudioContext();
    this.sampleRate = this.audioContext.sampleRate;
    this.chunkDurationInSeconds = chunkDurationInSeconds;
    this.chunkNumSamplesPerChannel = this.sampleRate * chunkDurationInSeconds;
  }

  public async renderAudioChunk(chunkData) {
    if (!this.audioContext) return;
    const audioBuffer = this.audioContext.createBuffer(
      NUM_CHANNELS,
      this.chunkNumSamplesPerChannel,
      this.audioContext.sampleRate
    );

    const channels = [];
    for (let i = 0; i < NUM_CHANNELS; ++i) {
      channels.push(audioBuffer.getChannelData(i));
    }

    for (let i = 0; i < audioBuffer.length; ++i) {
      for (const [offset, channel] of channels.entries()) {
        channel[i] = chunkData[i * NUM_CHANNELS + offset];
      }
    }

    const audioSource = this.audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(this.audioContext.destination);

    audioSource.start(0);
  }
  public async stop() {
    if (this.audioContext) await this.audioContext.suspend();
    if (this.audioContext) await this.audioContext.close();
  }
}