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
  public inputType: string;
  public inputNode: AudioNode | undefined;

  constructor(code: string, workgroupSize: number, inputType: string) {
    this.webGpuAudioProcessorWorker = new GPUWorker({type: "module"});
    this.code = code;
    this.workgroupSize = workgroupSize;
    this.inputType = inputType;
    this.init();
  }

  async init() {
    this.inputQueue = await new FreeQueue(QUEUE_SIZE, 1);
    this.outputQueue = await new FreeQueue(QUEUE_SIZE, 1);
    this.atomicState = await new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT));

    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule('/scripts/webgpu-processor.js');
    const queueData = {
      inputQueue: this.inputQueue,
      outputQueue: this.outputQueue,
      atomicState: this.atomicState
    }
    const processorNode =
      await new AudioWorkletNode(this.audioContext, 'webgpu-processor', {processorOptions: queueData});

    //this.updateInputType(this.inputType);
    const oscillator = new OscillatorNode(this.audioContext);
    oscillator.start();
    this.inputNode = oscillator;
    //this.inputNode.connect(this.audioContext.destination);
    console.log("this.inputNode", this.inputNode);
    this.inputNode.connect(processorNode).connect(this.audioContext.destination);

    this.webGpuAudioProcessorWorker.postMessage({
      type: 'init',
      data: {
        queueData,
        code: this.code,
        workgroupSize: this.workgroupSize
      }
    });
  }

  public async updateInputType(inputType: string) {
    this.inputNode.disconnect();
    this.inputType = inputType;
    if (inputType === 'oscillator') {
      const oscillator = new OscillatorNode(this.audioContext);
      oscillator.start();
      this.inputNode = oscillator;
      this.inputNode.connect(this.audioContext.destination);
    } else {

      const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true});
      const mediaStreamSource = this.audioContext.createMediaStreamSource(mediaStream);
      const channelSplitter = this.audioContext.createChannelSplitter(1);
      mediaStreamSource.connect(channelSplitter);
      this.inputNode = channelSplitter;
      this.inputNode.connect(this.audioContext.destination);
    }
  }

  public updateAudioParams(lastFreq: number, freq: number, volume: number) {
    this.webGpuAudioProcessorWorker.postMessage({
      type: 'updateAudioParams',
      data: new Float32Array([lastFreq, freq, volume])
    });
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