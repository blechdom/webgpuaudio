const NUM_CHANNELS = 2;

self.addEventListener('message', async (ev) => {
  switch (ev.data.type) {
    case 'run': {
      try {
        await run(ev.data.chunkDurationInSeconds, ev.data.code, ev.data.workgroupSize, ev.data.sampleRate, ev.data.nextChunkOffset);
      } catch (err) {
        self.postMessage({
          type: 'log',
          message: `Error while initializing WebGPU in worker process: ${err.message}`,
        });
      }
      break;
    }
  }
});

async function run(chunkDurationInSeconds, code, workgroupSize = 64, sampleRate = 48000, nextChunkOffset = 0, entryPoint = "synthesize",) {
  const chunkNumSamplesPerChannel = sampleRate * chunkDurationInSeconds;
  const chunkNumSamples = NUM_CHANNELS * chunkNumSamplesPerChannel; // left and right channels
  const chunkBufferSize = chunkNumSamples * Float32Array.BYTES_PER_ELEMENT;

  const adapter = await navigator.gpu.requestAdapter();
  let device = await adapter.requestDevice();
  let timeInfoBuffer = device.createBuffer({
    size: Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });
  let chunkBuffer = device.createBuffer({
    size: chunkBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });
  let chunkMapBuffer = device.createBuffer({
    size: chunkBufferSize,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  let audioShaderModule = device.createShaderModule({code});
  const pipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: audioShaderModule,
      entryPoint: entryPoint,
      constants: {
        SAMPLE_RATE: sampleRate,
        WORKGROUP_SIZE: workgroupSize
      }
    }
  });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {binding: 0, resource: {buffer: timeInfoBuffer}},
      {binding: 1, resource: {buffer: chunkBuffer}},
    ]
  });

  async function render() {
    device.queue.writeBuffer(timeInfoBuffer, 0, new Float32Array([nextChunkOffset]));
    const commandEncoder = device.createCommandEncoder();
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(
      Math.ceil(chunkNumSamplesPerChannel / workgroupSize)
    );
    pass.end();

    commandEncoder.copyBufferToBuffer(chunkBuffer, 0, chunkMapBuffer, 0, chunkBufferSize);

    device.queue.submit([commandEncoder.finish()]);

    await chunkMapBuffer.mapAsync(GPUMapMode.READ, 0, chunkBufferSize);

    const chunkData = new Float32Array(chunkNumSamples);
    chunkData.set(new Float32Array(chunkMapBuffer.getMappedRange()));
    chunkMapBuffer.unmap();
    self.postMessage({type: 'chunk', chunkData});
  }

  await render();
}
