/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./static/scripts/free-queue-webgpu.js
/**
 * A shared storage for FreeQueue operation backed by SharedArrayBuffer.
 *
 * @typedef SharedRingBuffer
 * @property {Uint32Array} states Backed by SharedArrayBuffer.
 * @property {number} bufferLength The frame buffer length. Should be identical
 * throughout channels.
 * @property {Array<Float32Array>} channelData The length must be > 0.
 * @property {number} channelCount same with channelData.length
 */ /**
 * A single-producer/single-consumer lock-free FIFO backed by SharedArrayBuffer.
 * In a typical pattern is that a worklet pulls the data from the queue and a
 * worker renders audio data to fill in the queue.
 */class FreeQueue{/**
   * An index set for shared state fields. Requires atomic access.
   * @enum {number}
   */States={/** @type {number} A shared index for reading from the queue. (consumer) */READ:0,/** @type {number} A shared index for writing into the queue. (producer) */WRITE:1};/**
   * FreeQueue constructor. A shared buffer created by this constuctor
   * will be shared between two threads.
   *
   * @param {number} size Frame buffer length.
   * @param {number} channelCount Total channel count.
   */constructor(size,channelCount=1){this.states=new Uint32Array(new SharedArrayBuffer(Object.keys(this.States).length*Uint32Array.BYTES_PER_ELEMENT));/**
     * Use one extra bin to distinguish between the read and write indices
     * when full. See Tim Blechmann's |boost::lockfree::spsc_queue|
     * implementation.
     */this.bufferLength=size+1;this.channelCount=channelCount;this.channelData=[];for(let i=0;i<channelCount;i++){this.channelData.push(new Float32Array(new SharedArrayBuffer(this.bufferLength*Float32Array.BYTES_PER_ELEMENT)));}}/**
   * Helper function for creating FreeQueue from pointers.
   * @param {FreeQueuePointers} queuePointers
   * An object containing various pointers required to create FreeQueue
   *
   * interface FreeQueuePointers {
   *   memory: WebAssembly.Memory;   // Reference to WebAssembly Memory
   *   bufferLengthPointer: number;
   *   channelCountPointer: number;
   *   statePointer: number;
   *   channelDataPointer: number;
   * }
   * @returns FreeQueue
   */static fromPointers(queuePointers){const queue=new FreeQueue(0,0);const HEAPU32=new Uint32Array(queuePointers.memory.buffer);const HEAPF32=new Float32Array(queuePointers.memory.buffer);const bufferLength=HEAPU32[queuePointers.bufferLengthPointer/4];const channelCount=HEAPU32[queuePointers.channelCountPointer/4];const states=HEAPU32.subarray(HEAPU32[queuePointers.statePointer/4]/4,HEAPU32[queuePointers.statePointer/4]/4+2);const channelData=[];for(let i=0;i<channelCount;i++){channelData.push(HEAPF32.subarray(HEAPU32[HEAPU32[queuePointers.channelDataPointer/4]/4+i]/4,HEAPU32[HEAPU32[queuePointers.channelDataPointer/4]/4+i]/4+bufferLength));}queue.bufferLength=bufferLength;queue.channelCount=channelCount;queue.states=states;queue.channelData=channelData;return queue;}/**
   * Pushes the data into queue. Used by producer.
   *
   * @param {Float32Array[]} input Its length must match with the channel
   *   count of this queue.
   * @param {number} blockLength Input block frame length. It must be identical
   *   throughout channels.
   * @return {boolean} False if the operation fails.
   */push(input,blockLength){const currentRead=Atomics.load(this.states,this.States.READ);const currentWrite=Atomics.load(this.states,this.States.WRITE);/* if (this._getAvailableWrite(currentRead, currentWrite) < blockLength) {
      this.printAvailableReadAndWrite();
      return false;
    }*/let nextWrite=currentWrite+blockLength;if(this.bufferLength<nextWrite){nextWrite-=this.bufferLength;for(let channel=0;channel<this.channelCount;channel++){const blockA=this.channelData[channel].subarray(currentWrite);const blockB=this.channelData[channel].subarray(0,nextWrite);blockA.set(input[channel].subarray(0,blockA.length));blockB.set(input[channel].subarray(blockA.length));}}else{for(let channel=0;channel<this.channelCount;channel++){this.channelData[channel].subarray(currentWrite,nextWrite).set(input[channel].subarray(0,blockLength));}if(nextWrite===this.bufferLength)nextWrite=0;}Atomics.store(this.states,this.States.WRITE,nextWrite);return true;}/**
   * Pulls data out of the queue. Used by consumer.
   *
   * @param {Float32Array[]} output Its length must match with the channel
   *   count of this queue.
   * @param {number} blockLength output block length. It must be identical
   *   throughout channels.
   * @return {boolean} False if the operation fails.
   */pull(output,blockLength){const currentRead=Atomics.load(this.states,this.States.READ);const currentWrite=Atomics.load(this.states,this.States.WRITE);/*if (this._getAvailableRead(currentRead, currentWrite) < blockLength) {
      this.printAvailableReadAndWrite();
      return false;
    }*/let nextRead=currentRead+blockLength;if(this.bufferLength<nextRead){nextRead-=this.bufferLength;for(let channel=0;channel<this.channelCount;channel++){const blockA=this.channelData[channel].subarray(currentRead);const blockB=this.channelData[channel].subarray(0,nextRead);output[channel].set(blockA);output[channel].set(blockB,blockA.length);}}else{for(let channel=0;channel<this.channelCount;++channel){output[channel].set(this.channelData[channel].subarray(currentRead,nextRead));}if(nextRead===this.bufferLength){nextRead=0;}}Atomics.store(this.states,this.States.READ,nextRead);return true;}/**
   * @return {number}
   */getBufferLength(){return this.bufferLength-1;}hasEnoughFramesFor(frameLength){const currentRead=Atomics.load(this.states,this.States.READ);const currentWrite=Atomics.load(this.states,this.States.WRITE);return this._getAvailableRead(currentRead,currentWrite)>=frameLength;}hasEnoughSpaceFor(frameLength){const currentRead=Atomics.load(this.states,this.States.READ);const currentWrite=Atomics.load(this.states,this.States.WRITE);return this._getAvailableWrite(currentRead,currentWrite)>=frameLength;}// Returns the number of writable space.
_getAvailableWrite(readIndex,writeIndex){return writeIndex>=readIndex?this.bufferLength-writeIndex+readIndex-1:readIndex-writeIndex-1;}// Returns the number of readable frames.
_getAvailableRead(readIndex,writeIndex){return writeIndex>=readIndex?writeIndex-readIndex:writeIndex+this.bufferLength-readIndex;}_reset(){for(let channel=0;channel<this.channelCount;channel++){this.channelData[channel].fill(0);}Atomics.store(this.states,this.States.READ,0);Atomics.store(this.states,this.States.WRITE,0);}// Helper function for debugging; Prints currently available read and write.
printAvailableReadAndWrite(){const currentRead=Atomics.load(this.states,this.States.READ);const currentWrite=Atomics.load(this.states,this.States.WRITE);console.log(this,{availableRead:this._getAvailableRead(currentRead,currentWrite),availableWrite:this._getAvailableWrite(currentRead,currentWrite)});}}/* harmony default export */ const free_queue_webgpu = (FreeQueue);
;// CONCATENATED MODULE: ./static/scripts/constants.js
const KERNEL_LENGTH=4;const RENDER_QUANTUM=128;const FRAME_SIZE=KERNEL_LENGTH*RENDER_QUANTUM;const QUEUE_SIZE=4096;const WORKGROUP_SIZE=4;const NUM_CHANNELS=2;
;// CONCATENATED MODULE: ./src/workers/webGpuPassthrough.worker.js
//audio vars
let inputQueue=null;let outputQueue=null;let atomicState=null;let inputBuffer=null;let sampleRate=null;//gpu vars
let device=null;let chunkBufferSize=null;let gpuInputBuffer=null;let gpuOutputBuffer=null;let chunkBuffer=null;let chunkMapBuffer=null;let pipeline=null;let bindGroup=null;let workgroupSize=null;let code=null;// performance metrics
let lastCallback=0;let averageTimeSpent=0;let timeElapsed=0;let runningAverageFactor=1;self.addEventListener('message',async ev=>{switch(ev.data.type){case'init':{({inputQueue,outputQueue,atomicState}=ev.data.data.queueData);Object.setPrototypeOf(inputQueue,free_queue_webgpu.prototype);Object.setPrototypeOf(outputQueue,free_queue_webgpu.prototype);// buffer for storing data pulled out from queue.
inputBuffer=new Float32Array(FRAME_SIZE);sampleRate=ev.data.data.sampleRate;workgroupSize=ev.data.data.workgroupSize;code=ev.data.data.code;await initWebGpu();runningAverageFactor=sampleRate/FRAME_SIZE;while(true){if(Atomics.wait(atomicState,0,1)==='ok'){const processStart=performance.now();const callbackInterval=processStart-lastCallback;lastCallback=processStart;timeElapsed+=callbackInterval;// Processes "frames" from inputQueue and pass the result to outputQueue.
await processAudio();// Approximate running average of process() time.
const timeSpent=performance.now()-processStart;averageTimeSpent-=averageTimeSpent/runningAverageFactor;averageTimeSpent+=timeSpent/runningAverageFactor;// Throttle the log by 1 second.
if(timeElapsed>=1000){console.log(`[worker.js] process() = ${timeSpent.toFixed(3)}ms : `+`avg = ${averageTimeSpent.toFixed(3)}ms : `+`callback interval = ${callbackInterval.toFixed(3)}ms`);timeElapsed-=1000;}Atomics.store(atomicState,0,0);}}}}});async function initWebGpu(){chunkBufferSize=FRAME_SIZE*Float32Array.BYTES_PER_ELEMENT;const adapter=await navigator.gpu.requestAdapter();device=await adapter.requestDevice();gpuInputBuffer=device.createBuffer({size:FRAME_SIZE*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});chunkBuffer=device.createBuffer({size:FRAME_SIZE*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC});chunkMapBuffer=device.createBuffer({size:FRAME_SIZE*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST});let audioShaderModule=device.createShaderModule({code});pipeline=device.createComputePipeline({layout:'auto',compute:{module:audioShaderModule,entryPoint:"main",constants:{WORKGROUP_SIZE:workgroupSize}}});bindGroup=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:gpuInputBuffer}},{binding:1,resource:{buffer:chunkBuffer}}]});}async function processAudio(){if(!inputQueue.pull([inputBuffer],FRAME_SIZE)){console.error('[worker.js] Pulling from inputQueue failed.');return;}const outputBuffer=await processByGpu(inputBuffer);if(!outputQueue.push([outputBuffer],FRAME_SIZE)){console.error('[worker.js] Pushing to outputQueue failed.');return;}}//async function run(chunkDurationInSeconds, code, workgroupSize = 64, sampleRate = 48000, nextChunkOffset = 0, entryPoint = "synthesize",) {
async function processByGpu(inputBufferToProcess){device.queue.writeBuffer(gpuInputBuffer,0,new Float32Array(inputBufferToProcess));const commandEncoder=device.createCommandEncoder();const pass=commandEncoder.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,bindGroup);pass.dispatchWorkgroups(Math.ceil(FRAME_SIZE/workgroupSize));pass.end();commandEncoder.copyBufferToBuffer(chunkBuffer,0,chunkMapBuffer,0,chunkBufferSize);device.queue.submit([commandEncoder.finish()]);await chunkMapBuffer.mapAsync(GPUMapMode.READ,0,chunkBufferSize);const chunkData=new Float32Array(FRAME_SIZE);chunkData.set(new Float32Array(chunkMapBuffer.getMappedRange()));chunkMapBuffer.unmap();return chunkData;}
module.exports = __webpack_exports__;
/******/ })()
;