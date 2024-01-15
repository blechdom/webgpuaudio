import { FreeQueue } from "./free-queue.js";
import { FRAME_SIZE, RENDER_QUANTUM } from "./constants.js";

/**
 * A simple AudioWorkletProcessor node.
 *
 * @class BasicProcessor
 * @extends AudioWorkletProcessor
 */
class BasicProcessor extends AudioWorkletProcessor {
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

  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    this.inputQueue.push(input, RENDER_QUANTUM);
    const didPull = this.outputQueue.pull(output, RENDER_QUANTUM);
    if (!didPull) {
      console.log("failed to pull.");
    }
    if (this.inputQueue.isFrameAvailable(FRAME_SIZE)) {
      Atomics.notify(this.atomicState, 0, 1);
    }

    return true;
  }
}

registerProcessor('basic-processor', BasicProcessor);