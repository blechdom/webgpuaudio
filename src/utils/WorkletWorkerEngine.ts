import FreeQueue from './free-queue.js';
import { QUEUE_SIZE } from './constants.ts';

export default class WorkletWorkerEngine {
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

  constructor() {
    this.gpuWorker = new Worker(new URL('../workers/workerAudio.worker.js', import.meta.url), {type: "module"});
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
  }
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