import FreeQueue from './free-queue.js';
import { QUEUE_SIZE } from './constants.ts';
const NUM_CHANNELS = 2;
const MAX_BUFFERED_CHUNKS = 2;

export default class WebGpuAudioWorkerStreamingEngine {
  public audioContext: AudioContext | undefined;
  public chunkDurationInSeconds: number;
  public chunkNumSamplesPerChannel: number;
  public sampleRate: number;
  public timeoutId: NodeJS.Timeout | null = null;
  public inputQueue: any;
  public outputQueue: any;
  public atomicState: Int32Array;
  public gpuWorker: Worker | undefined;
  public chunkData: Float32Array | undefined;
  public code: string;
  public workgroupSize: number;

  constructor(chunkDurationInSeconds: number, workgroupSize: number, code: string) {
    this.code = code;
    this.workgroupSize = workgroupSize;
    this.gpuWorker = new Worker(new URL('../workers/workerAudio.worker.js', import.meta.url), {type: "module"});
    this.chunkDurationInSeconds = chunkDurationInSeconds;
    this.chunkNumSamplesPerChannel = this.sampleRate * chunkDurationInSeconds;
    this.init();
  }

  async init() {
    console.log("init")
    this.audioContext = new AudioContext();
    this.sampleRate = this.audioContext.sampleRate;

    this.gpuWorker.addEventListener('message', async (ev) => {
      console.log("chunkData in engine listener", ev.data.chunkData);
      switch (ev.data.type) {
        case 'chunk': {
          this.chunkData = ev.data.chunkData;
          break;
        }
      }
    });
    this.inputQueue = await new FreeQueue(QUEUE_SIZE, 1);
    this.outputQueue = await new FreeQueue(QUEUE_SIZE, 1);
    this.atomicState = await new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    await this.audioContext.audioWorklet.addModule(new URL('./basic-processor.js', import.meta.url));
    const oscillator = new OscillatorNode(this.audioContext);
    const processorNode =
      new AudioWorkletNode(this.audioContext, 'basic-processor', {
        processorOptions: {
          inputQueue: this.inputQueue,
          outputQueue: this.outputQueue,
          atomicState: this.atomicState
        }
      });
    oscillator.connect(processorNode).connect(this.audioContext.destination);
    oscillator.start();
    this.gpuWorker.postMessage({
      type: 'init',
      data: {
        inputQueue: this.inputQueue,
        outputQueue: this.outputQueue,
        atomicState: this.atomicState
      }
    });
   /* try {
      this.gpuWorker.postMessage({
        type: 'run',
        chunkDurationInSeconds: this.chunkDurationInSeconds,
        code: this.code,
        workgroupSize: this.workgroupSize,
        sampleRate: this.sampleRate
      });
    } catch (err) {
      console.warn(err.message);
      this.gpuWorker.terminate();
    }*/
  }

  /*public async renderAudioChunk(chunkData) {
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
  }*/
  public async stop() {
    if (this.audioContext) {
      await this.audioContext.suspend();
      await this.audioContext.close();
    }
    if (this.gpuWorker) {
      await this.gpuWorker.terminate();
      this.gpuWorker = undefined;
    }
  }
}