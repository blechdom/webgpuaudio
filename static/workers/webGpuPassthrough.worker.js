importScripts("/workers/free-queue-webgpu.js");
importScripts("/workers/constants.js");

//audio vars
let inputQueue = null;
let outputQueue = null;
let atomicState = null;
let inputBuffer = null;
let sampleRate = null;

//gpu vars
let device = null;
let chunkBufferSize = null;
let gpuInputBuffer = null;
let gpuOutputBuffer = null;
let chunkBuffer = null;
let chunkMapBuffer = null;
let pipeline = null;
let bindGroup = null;
let workgroupSize = null;
let code = null;

// performance metrics
let lastCallback = 0;
let averageTimeSpent = 0;
let timeElapsed = 0;
let runningAverageFactor = 1;

self.addEventListener('message', async(ev) => {
  switch (ev.data.type) {
    case 'init': {
      ({inputQueue, outputQueue, atomicState} = ev.data.data.queueData);
      Object.setPrototypeOf(inputQueue, FreeQueue.prototype);
      Object.setPrototypeOf(outputQueue, FreeQueue.prototype);

      // buffer for storing data pulled out from queue.
      inputBuffer = new Float32Array(FRAME_SIZE);
      sampleRate = ev.data.data.sampleRate;
      workgroupSize = ev.data.data.workgroupSize;
      code = ev.data.data.code;
      await initWebGpu();

      runningAverageFactor = sampleRate / FRAME_SIZE;

      while (true) {

        if (Atomics.wait(atomicState, 0, 1) === 'ok') {
          const processStart = performance.now();
          const callbackInterval = processStart - lastCallback;
          lastCallback = processStart;
          timeElapsed += callbackInterval;

          // Processes "frames" from inputQueue and pass the result to outputQueue.
          await processAudio();

          // Approximate running average of process() time.
          const timeSpent = performance.now() - processStart;
          averageTimeSpent -= averageTimeSpent / runningAverageFactor;
          averageTimeSpent += timeSpent / runningAverageFactor;

          // Throttle the log by 1 second.
          if (timeElapsed >= 1000) {
           /* console.log(
              `[worker.js] process() = ${timeSpent.toFixed(3)}ms : ` +
              `avg = ${averageTimeSpent.toFixed(3)}ms : ` +
              `callback interval = ${(callbackInterval).toFixed(3)}ms`);*/
            timeElapsed -= 1000;
          }

          Atomics.store(atomicState, 0, 0);
        }
      }
    }
  }
});

async function initWebGpu() {
  chunkBufferSize = FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT;
  const adapter = await navigator.gpu.requestAdapter();
  device = await adapter.requestDevice();
  gpuInputBuffer = device.createBuffer({
    size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  chunkBuffer = device.createBuffer({
    size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });
  chunkMapBuffer = device.createBuffer({
    size: FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
  let audioShaderModule = device.createShaderModule({code});
  pipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: audioShaderModule,
      entryPoint: "main",
      constants: {
        WORKGROUP_SIZE: workgroupSize,
      }
    }
  });
  bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: gpuInputBuffer } },
      { binding: 1, resource: {buffer: chunkBuffer } },
    ]
  });
}

async function processAudio() {
  if (!inputQueue.pull([inputBuffer], FRAME_SIZE)) {
    console.error('[worker.js] Pulling from inputQueue failed.');
    return;
  }

  const outputBuffer = await processByGpu(inputBuffer);

  if (!outputQueue.push([outputBuffer], FRAME_SIZE)) {
    console.error('[worker.js] Pushing to outputQueue failed.');
    return;
  }
}

//async function run(chunkDurationInSeconds, code, workgroupSize = 64, sampleRate = 48000, nextChunkOffset = 0, entryPoint = "synthesize",) {
async function processByGpu(inputBufferToProcess) {
    device.queue.writeBuffer(gpuInputBuffer, 0, new Float32Array(inputBufferToProcess));

    const commandEncoder = device.createCommandEncoder();
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(FRAME_SIZE / workgroupSize));
    pass.end();

    commandEncoder.copyBufferToBuffer(chunkBuffer, 0, chunkMapBuffer, 0, chunkBufferSize);

    device.queue.submit([commandEncoder.finish()]);

    await chunkMapBuffer.mapAsync(GPUMapMode.READ, 0, chunkBufferSize);

    const chunkData = new Float32Array(FRAME_SIZE);
    chunkData.set(new Float32Array(chunkMapBuffer.getMappedRange()));
    chunkMapBuffer.unmap();
    return chunkData;
}
