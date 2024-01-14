import WorkletWorker from 'worker-loader!@site/static/workers/passthrough.worker.js';

import { FreeQueue } from './free-queue.js';
import { QUEUE_SIZE } from './constants.js';

export default class WorkletWorkerEngine {
  public audioContext: AudioContext | undefined;
  public chunkDurationInSeconds: number;
  public chunkNumSamplesPerChannel: number;
  public sampleRate: number;
  public timeoutId: NodeJS.Timeout | null = null;
  public inputQueue: any;
  public outputQueue: any;
  public atomicState: Int32Array;
  public passthroughWorker: Worker | undefined;
  public chunkData: Float32Array | undefined;
  public code: string;
  public workgroupSize: number;

  constructor() {
    this.passthroughWorker = new WorkletWorker({type: "module"});//new Worker(new URL('@site/static/workers/passthrough.worker.js', import.meta.url), {type: "module"});
    this.init();
  }

  async init() {
    this.audioContext = new AudioContext();
    this.sampleRate = this.audioContext.sampleRate;
    this.inputQueue = await new FreeQueue(QUEUE_SIZE, 1);
    this.outputQueue = await new FreeQueue(QUEUE_SIZE, 1);
    this.atomicState = await new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));
    await this.audioContext.audioWorklet.addModule('/scripts/basic-processor.js');
    const oscillator = new OscillatorNode(this.audioContext);
    const queueData = {
      inputQueue: this.inputQueue,
      outputQueue: this.outputQueue,
      atomicState: this.atomicState
    }
    const processorNode =
      new AudioWorkletNode(this.audioContext, 'basic-processor', { processorOptions: queueData });
    oscillator.connect(processorNode).connect(this.audioContext.destination);
    oscillator.start();
    this.passthroughWorker.postMessage({
      type: 'init',
      data: queueData
    });
  }
  public async stop() {
    if (this.audioContext) {
      await this.audioContext.suspend();
      await this.audioContext.close();
    }
    if (this.passthroughWorker) {
      await this.passthroughWorker.terminate();
      this.passthroughWorker = undefined;
    }
  }
}