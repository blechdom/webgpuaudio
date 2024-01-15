import { FreeQueue } from './free-queue-webgpu.js';
import { FRAME_SIZE, RENDER_QUANTUM } from "./constants.js";

const ExpectedPrimingCount = FRAME_SIZE / RENDER_QUANTUM;
class WebGpuProcessor extends AudioWorkletProcessor {
  /**
   * Constructor to initialize, input and output FreeQueue instances
   * and atomicState to synchronise Worker with AudioWorklet
   * @param {Object} options AudioWorkletProcessor options
   *    to initialize inputQueue, outputQueue and atomicState
   */
  constructor(options) {
    super();
    this.inputQueue = options.processorOptions.inputQueue;
    this.outputQueue = options.processorOptions.outputQueue;
    this.atomicState = options.processorOptions.atomicState;
    Object.setPrototypeOf(this.inputQueue, FreeQueue.prototype);
    Object.setPrototypeOf(this.outputQueue, FreeQueue.prototype);

    this.primingCounter = 0;
  }

  /**
   * The AudioWorkletProcessor's isochronous callback.
   * @param {Array<Float32Array>>} inputs
   * @param {Array<Float32Array>>} outputs
   * @returns {boolean}
   */
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    this.inputQueue.push(input, RENDER_QUANTUM);
    if (this.primingCounter > ExpectedPrimingCount) {
      this.outputQueue.pull(output, RENDER_QUANTUM);
    } else {
      this.primingCounter++;
    }

    if (this.inputQueue.isFrameAvailable(FRAME_SIZE)) {
      Atomics.store(this.atomicState, 0, 1);
      Atomics.notify(this.atomicState, 0, 1);
    }

    return true;
  }
}

registerProcessor('webgpu-processor', WebGpuProcessor);