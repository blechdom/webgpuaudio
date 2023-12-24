import FreeQueue from"/scripts/free-queue.js";import{FRAME_SIZE,RENDER_QUANTUM}from"/scripts/constants.js";class BasicProcessor extends AudioWorkletProcessor{constructor(e){super(),this.inputQueue=e.processorOptions.inputQueue,this.outputQueue=e.processorOptions.outputQueue,this.atomicState=e.processorOptions.atomicState,Object.setPrototypeOf(this.inputQueue,FreeQueue.prototype),Object.setPrototypeOf(this.outputQueue,FreeQueue.prototype)}process(e,t){const s=e[0],o=t[0];this.inputQueue.push(s,RENDER_QUANTUM);return this.outputQueue.pull(o,RENDER_QUANTUM)||console.log("failed to pull."),this.inputQueue.isFrameAvailable(FRAME_SIZE)&&Atomics.notify(this.atomicState,0,1),!0}}registerProcessor("basic-processor",BasicProcessor);