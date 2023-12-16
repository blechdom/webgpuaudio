const NUM_CHANNELS = 2;

export default class WebGpuAudioEngine {
  public audioContext: AudioContext | undefined;
  public chunkDurationInSeconds: number;
  public device: GPUDevice | undefined;
  public chunkNumSamplesPerChannel: number;
  public chunkNumSamples: number;
  public chunkBufferSize: number;
  public timeInfoBuffer: GPUBuffer;
  public chunkBuffer: GPUBuffer;
  public chunkMapBuffer: GPUBuffer;
  public audioParamBuffer: GPUBuffer;
  public pipeline: GPUComputePipeline;
  public bindGroup: GPUBindGroup;
  public audioShaderModule: GPUShaderModule;
  public sampleRate: number;
  private workgroupSize: number = 0;

  constructor(chunkDurationInSeconds: number) {
    this.audioContext = new AudioContext();
    this.sampleRate = this.audioContext.sampleRate;
    this.chunkDurationInSeconds = chunkDurationInSeconds;
    this.chunkNumSamplesPerChannel = this.sampleRate * chunkDurationInSeconds;
    this.chunkNumSamples = NUM_CHANNELS * this.chunkNumSamplesPerChannel; // left and right channels
    this.chunkBufferSize = this.chunkNumSamples * Float32Array.BYTES_PER_ELEMENT;
  }

  public async initGPU({code, entryPoint, workgroupSize}) {
    this.workgroupSize = workgroupSize;
    const adapter = await navigator.gpu.requestAdapter();
    this.device = await adapter.requestDevice();
    this.timeInfoBuffer = this.device.createBuffer({
      size: Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.chunkBuffer = this.device.createBuffer({
      size: this.chunkBufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.chunkMapBuffer = this.device.createBuffer({
      size: this.chunkBufferSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    this.audioParamBuffer = this.device.createBuffer({
      size: Float32Array.BYTES_PER_ELEMENT * 3,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.audioShaderModule = this.device.createShaderModule({code});
    this.pipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.audioShaderModule,
        entryPoint: entryPoint,
        constants: {
          SAMPLE_RATE: this.sampleRate,
          WORKGROUP_SIZE: workgroupSize
        }
      }
    });
    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: this.timeInfoBuffer}},
        {binding: 1, resource: {buffer: this.chunkBuffer}},
        {binding: 2, resource: {buffer: this.audioParamBuffer}},
      ]
    });
  }

  public playSound(freq: number,
                   volume: number,
                   soundType: number) {
    console.log("playSound with sound type ", soundType);
    (async () => {
      await this.createSoundChunk(freq, volume, soundType);
    })();
  }

  public async createSoundChunk(freq, volume, soundType) {
    if (!this.audioContext) return;
    this.device.queue.writeBuffer(this.timeInfoBuffer, 0, new Float32Array([0]));
    console.log("create with soundType ", soundType);
    this.device.queue.writeBuffer(this.audioParamBuffer, 0, new Float32Array([freq, volume, soundType]));

    const commandEncoder = this.device.createCommandEncoder();
    const pass = commandEncoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.dispatchWorkgroups(
      Math.ceil(this.chunkNumSamplesPerChannel / this.workgroupSize)
    );
    pass.end();

    commandEncoder.copyBufferToBuffer(this.chunkBuffer, 0, this.chunkMapBuffer, 0, this.chunkBufferSize);

    this.device.queue.submit([commandEncoder.finish()]);

    await this.chunkMapBuffer.mapAsync(GPUMapMode.READ, 0, this.chunkBufferSize);

    const chunkData = new Float32Array(this.chunkNumSamples);
    chunkData.set(new Float32Array(this.chunkMapBuffer.getMappedRange()));
    this.chunkMapBuffer.unmap();

    const audioBuffer = this.audioContext.createBuffer(
      NUM_CHANNELS,
      this.chunkNumSamplesPerChannel,
      this.audioContext.sampleRate
    );

    const channels = [];
    for (let i = 0; i < NUM_CHANNELS; ++i) {
      channels.push(audioBuffer.getChannelData(i));
    }

    for (let i = 0; i < audioBuffer.length; ++i) {
      for (const [offset, channel] of channels.entries()) {
        channel[i] = chunkData[i * NUM_CHANNELS + offset];
      }
    }

    const audioSource = this.audioContext.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(this.audioContext.destination);

    audioSource.start(0); // workaround to remove 2nd chunk glitch
  }

  public updateAudioParams(freq: number, volume: number, oneShotNum: number) {
    console.log("update with soundType ", oneShotNum);
    this.device.queue.writeBuffer(this.audioParamBuffer, 0, new Float32Array([freq, volume, oneShotNum]));
  }

  public async stop() {
    if (this.audioContext) await this.audioContext.suspend();
    if (this.audioContext) await this.audioContext.close();
  }
}