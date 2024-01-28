export default class ShaderToolsEngine {
  //public shaderOutput: Float32Array;

  constructor() {
    //this.shaderOutput = new Float32Array(outputBufferSize);
  }

  public async triggerGPU(code, workgroupSize, outputBufferSize, params) {
    const bufferSize = outputBufferSize * Float32Array.BYTES_PER_ELEMENT;
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const outputBuffer = device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    const outputMapBuffer = device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(outputBuffer, 0, new Float32Array(outputBufferSize));

    const paramBuffer = device.createBuffer({
      size: Float32Array.BYTES_PER_ELEMENT * params.length,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(paramBuffer, 0, new Float32Array(params));

    const shaderModule = await device.createShaderModule({code});
    const pipeline = await device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: "main",
        constants: {
          WORKGROUP_SIZE: workgroupSize
        }
      }
    });

    const bindGroup = await device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: outputBuffer}},
        {binding: 1, resource: {buffer: paramBuffer}},
      ]
    });

    const commandEncoder = device.createCommandEncoder();
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(outputBufferSize/workgroupSize));
    pass.end();

    commandEncoder.copyBufferToBuffer(outputBuffer, 0, outputMapBuffer, 0, outputMapBuffer.size);

    device.queue.submit([commandEncoder.finish()]);

    await outputMapBuffer.mapAsync(GPUMapMode.READ, 0, bufferSize);
    const copyArrayBuffer = outputMapBuffer.getMappedRange(0, bufferSize);
    const result = copyArrayBuffer.slice(0);
    outputMapBuffer.unmap();
    return new Float32Array(result);
  }
}