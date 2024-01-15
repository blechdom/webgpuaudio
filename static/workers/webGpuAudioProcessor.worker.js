importScripts("/workers/free-queue-webgpu.js");
importScripts("/workers/constants.js");

//audio vars
let inputQueue = null;
let outputQueue = null;
let atomicState = null;
const sampleRate = 48000;
let nextChunkOffset = 0;

//gpu vars
let device = null;
let chunkBufferSize = null;
let gpuInputBuffer = null;
let chunkBuffer = null;
let chunkMapBuffer = null;
let timeInfoBuffer = null;
let audioParamBuffer = null;
let pipeline = null;
let bindGroup = null;
let workgroupSize = null;
let code = null;

self.addEventListener('message', async(ev) => {
  switch (ev.data.type) {
    case 'init': {
      ({inputQueue, outputQueue, atomicState} = ev.data.data.queueData);
      Object.setPrototypeOf(inputQueue, FreeQueue.prototype);
      Object.setPrototypeOf(outputQueue, FreeQueue.prototype);

      const inputBuffer = new Float32Array(FRAME_SIZE);
      workgroupSize = ev.data.data.workgroupSize;
      code = ev.data.data.code;
      await initWebGpu();
      while (true) {
        if (Atomics.wait(atomicState, 0, 1) === 'ok') {
          const didPull = inputQueue.pull([inputBuffer], FRAME_SIZE);

          if (didPull) {
            const output = await processByGpu(inputBuffer);
            outputQueue.push([output], FRAME_SIZE);
          }
          Atomics.store(atomicState, 0, 0);
        }
      }
    }
    case 'updateAudioParams': {
      if(device) device.queue.writeBuffer(audioParamBuffer, 0, ev.data.data);
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
  timeInfoBuffer = device.createBuffer({
    size: Float32Array.BYTES_PER_ELEMENT * 2,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  audioParamBuffer = device.createBuffer({
    size: Float32Array.BYTES_PER_ELEMENT * 2,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
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
      { binding: 1, resource: { buffer: chunkBuffer } },
      { binding: 2, resource: { buffer: timeInfoBuffer } },
      { binding: 3, resource: { buffer: audioParamBuffer } },
    ]
  });
}

async function processByGpu(inputBufferToProcess) {
  console.log("nextChunkOffset", nextChunkOffset);
  device.queue.writeBuffer(timeInfoBuffer, 0, new Float32Array([nextChunkOffset, sampleRate]));
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
  nextChunkOffset += inputBufferToProcess.length;
  return chunkData;
}
