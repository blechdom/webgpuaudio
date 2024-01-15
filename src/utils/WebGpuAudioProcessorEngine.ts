import GPUWorker from 'worker-loader!@site/static/workers/webGpuAudioProcessor.worker.js';
import FreeQueue from './free-queue-webgpu.js';
import { QUEUE_SIZE } from './constants.js';

export default class WebGpuAudioProcessorEngine {
  public audioContext: AudioContext | undefined;
  public inputQueue: any;
  public outputQueue: any;
  public atomicState: Int32Array;
  public webGpuAudioProcessorWorker: Worker | undefined;
  public code: string;
  public workgroupSize: number;

  constructor(code: string, workgroupSize: number) {
    this.webGpuAudioProcessorWorker = new GPUWorker({type: "module"});
    this.code = code;
    this.workgroupSize = workgroupSize;
    this.init();
  }

  async init() {
    this.inputQueue = await new FreeQueue(QUEUE_SIZE, 1);
    this.outputQueue = await new FreeQueue(QUEUE_SIZE, 1);
    this.atomicState = await new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));

    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule('/scripts/webgpu-processor.js');
    const oscillator = new OscillatorNode(this.audioContext);
    const queueData = {
      inputQueue: this.inputQueue,
      outputQueue: this.outputQueue,
      atomicState: this.atomicState
    }
    const processorNode =
      await new AudioWorkletNode(this.audioContext, 'webgpu-processor', {processorOptions: queueData});
    oscillator.connect(processorNode).connect(this.audioContext.destination);
    oscillator.start();

    this.webGpuAudioProcessorWorker.postMessage({
      type: 'init',
      data: {
        queueData,
        code: this.code,
        workgroupSize: this.workgroupSize
      }
    });
  }

  public updateAudioParams(freq: number, volume: number) {
    this.webGpuAudioProcessorWorker.postMessage({
      type: 'updateAudioParams',
      data: new Float32Array([freq, volume])
    });
    //this.device.queue.writeBuffer(this.audioParamBuffer, 0, new Float32Array([freq, volume, waveFormNum]));
  }

  public async stop() {
    if (this.audioContext) {
      await this.audioContext.suspend();
      await this.audioContext.close();
    }
    if (this.webGpuAudioProcessorWorker) {
      await this.webGpuAudioProcessorWorker.terminate();
      this.webGpuAudioProcessorWorker = undefined;
    }
  }
}