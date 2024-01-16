import GPUWorker from 'worker-loader!@site/static/workers/webGpuAudioProcessor.worker.js';
import FreeQueue from './free-queue-webgpu.js';
import {QUEUE_SIZE} from './constants.js';

export default class WebGpuAudioProcessorEngine {
  public audioContext: AudioContext | undefined;
  public inputQueue: any;
  public outputQueue: any;
  public atomicState: Int32Array;
  public webGpuAudioProcessorWorker: Worker | undefined;
  public code: string;
  public workgroupSize: number;
  public processorNode: AudioNode | undefined;
  public inputNode: AudioNode | undefined;
  public inputGainNode: GainNode | undefined;

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

    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false
      }
    }).then(async(stream) => {
      const queueData = {
        inputQueue: this.inputQueue,
        outputQueue: this.outputQueue,
        atomicState: this.atomicState
      }
      this.processorNode =
        await new AudioWorkletNode(this.audioContext, 'webgpu-processor', {processorOptions: queueData});

      this.inputNode = this.audioContext.createMediaStreamSource(stream);
      this.inputGainNode = this.audioContext.createGain();
      this.inputGainNode.gain.value = 1.0;
      const channelMerger = this.audioContext.createChannelMerger(2);
      this.inputNode.connect(this.inputGainNode).connect(this.processorNode);
      this.processorNode.connect(channelMerger, 0, 0);
      this.processorNode.connect(channelMerger, 0, 1);
      channelMerger.connect(this.audioContext.destination);
      this.webGpuAudioProcessorWorker.postMessage({
        type: 'init',
        data: {
          queueData,
          code: this.code,
          workgroupSize: this.workgroupSize
        }
      });
    });

  }

  public updateAudioParams(lastFreq: number, freq: number, volume: number) {
    this.webGpuAudioProcessorWorker.postMessage({
      type: 'updateAudioParams',
      data: new Float32Array([lastFreq, freq, volume])
    });
  }

  public updateInputGain(gain: number) {
    if (this.inputGainNode && isFinite(gain)) {
      console.log("gain ", gain);
      this.inputGainNode.gain.linearRampToValueAtTime(gain, 10)
    }
  }

  public async stop() {
    if (this.audioContext) {
      await this.audioContext.suspend();
      await this.audioContext.close();
      if (this.inputNode){
        this.inputNode.disconnect();
      }
    }
    if (this.webGpuAudioProcessorWorker) {
      await this.webGpuAudioProcessorWorker.terminate();
      this.webGpuAudioProcessorWorker = undefined;
    }
  }
}