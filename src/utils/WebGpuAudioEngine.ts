const NUM_CHANNELS = 2;
const MAX_BUFFERED_CHUNKS = 2;

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
  public timeoutId: NodeJS.Timeout | null = null;
  private startTime: number | undefined;
  private nextChunkOffset: number = 0.0;
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

  public playSound() {
    (async () => {
      await this.createSoundChunk();
    })();
  }

  public async createSoundChunk() {
    if (!this.audioContext) return;
    if (this.startTime === undefined) {
      this.startTime = performance.now() / 1000.0;
    }
    console.log("this.nextChunkOffset", this.nextChunkOffset);
    const bufferedSeconds = (this.startTime + this.nextChunkOffset) - (performance.now() / 1000.0);
    const numBufferedChunks = Math.floor(bufferedSeconds / this.chunkDurationInSeconds);

    if (numBufferedChunks > MAX_BUFFERED_CHUNKS) {
      const timeout = this.chunkDurationInSeconds;
      this.timeoutId = setTimeout(await this.createSoundChunk.bind(this), timeout * 1000.0);
      return;
    }

    this.device.queue.writeBuffer(this.timeInfoBuffer, 0, new Float32Array([this.nextChunkOffset]));

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

    if (this.nextChunkOffset !== 0) audioSource.start(this.nextChunkOffset); // workaround to remove 2nd chunk glitch

    this.nextChunkOffset += audioSource.buffer.duration;
    await this.createSoundChunk();

  }

  public updateAudioParams(freq: number, volume: number, waveFormNum: number) {
    this.device.queue.writeBuffer(this.audioParamBuffer, 0, new Float32Array([freq, volume, waveFormNum]));
  }

  public async stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.audioContext) await this.audioContext.suspend();
    if (this.audioContext) await this.audioContext.close();
  }
}