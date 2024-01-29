const NUM_CHANNELS = 2;
const MAX_BUFFERED_CHUNKS = 1;

export default class WebGpuAudioEngine {
  public audioContext: AudioContext | undefined;
  public chunkDurationInSeconds: number;
  public device: GPUDevice | undefined;
  public chunkNumSamplesPerChannel: number;
  public chunkNumSamples: number;
  public chunkBufferSize: number;
  public logBuffer: GPUBuffer;
  public logMapBuffer: GPUBuffer;
  public freqBuffer: GPUBuffer;
  public freqMapBuffer: GPUBuffer;
  public chunkBuffer: GPUBuffer;
  public chunkMapBuffer: GPUBuffer;
  public audioParams: number[] = [0.0, 0.0];
  public audioParamBuffer: GPUBuffer;
  public lastAudioParamBuffer: GPUBuffer;
  public lastAudioParamMapBuffer: GPUBuffer;
  public lastAudioParams: Float32Array = new Float32Array([0.0, 0.0, 0.0]);
  public freqPipeline: GPUComputePipeline;
  public synthPipeline: GPUComputePipeline;
  public freqBindGroup: GPUBindGroup;
  public synthBindGroup: GPUBindGroup;
  public audioShaderModule: GPUShaderModule;
  public sampleRate: number;
  public timeoutId: NodeJS.Timeout | null = null;
  private startTime: number | undefined;
  private nextChunkOffset: number = 0.0;
  private workgroupSize: number = 0;

  constructor(chunkDurationInSeconds: number) {
    this.audioContext = new AudioContext();
    this.sampleRate = this.audioContext.sampleRate;
    console.log("sampleRate: ", this.sampleRate);
    this.chunkDurationInSeconds = chunkDurationInSeconds;
    this.chunkNumSamplesPerChannel = this.sampleRate * chunkDurationInSeconds;
    this.chunkNumSamples = NUM_CHANNELS * this.chunkNumSamplesPerChannel; // left and right channels
    this.chunkBufferSize = this.chunkNumSamples * Float32Array.BYTES_PER_ELEMENT;
  }

  public async initGPU({code, entryPoint, workgroupSize, freq, volume}) {
    this.workgroupSize = workgroupSize;
    const adapter = await navigator.gpu.requestAdapter();
    this.device = await adapter.requestDevice();
    this.logBuffer = this.device.createBuffer({
      size: this.chunkNumSamplesPerChannel * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.logMapBuffer = this.device.createBuffer({
      size: this.chunkNumSamplesPerChannel * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    this.freqBuffer = this.device.createBuffer({
      size: this.chunkNumSamplesPerChannel * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.freqMapBuffer = this.device.createBuffer({
      size: this.chunkNumSamplesPerChannel * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
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
      size: Float32Array.BYTES_PER_ELEMENT * 2,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.lastAudioParamBuffer = this.device.createBuffer({
      size: Float32Array.BYTES_PER_ELEMENT * 3,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    this.lastAudioParamMapBuffer = this.device.createBuffer({
      size: Float32Array.BYTES_PER_ELEMENT * 3,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    this.audioShaderModule = this.device.createShaderModule({code});
    this.freqPipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.audioShaderModule,
        entryPoint: "frequencyRamp",
        constants: {
          WORKGROUP_SIZE: workgroupSize
        }
      }
    });
    this.synthPipeline = this.device.createComputePipeline({
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
    this.freqBindGroup = this.device.createBindGroup({
      layout: this.freqPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: this.chunkBuffer}},
        {binding: 1, resource: {buffer: this.audioParamBuffer}},
        {binding: 2, resource: {buffer: this.lastAudioParamBuffer}},
        {binding: 4, resource: {buffer: this.freqBuffer}},
      ]
    });
    this.synthBindGroup = this.device.createBindGroup({
      layout: this.synthPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: this.chunkBuffer}},
        {binding: 1, resource: {buffer: this.audioParamBuffer}},
        {binding: 2, resource: {buffer: this.lastAudioParamBuffer}},
        {binding: 3, resource: {buffer: this.logBuffer}},
        {binding: 4, resource: {buffer: this.freqBuffer}},
      ]
    });
    this.audioParams = [freq, volume];
    console.log("this.audioParams", this.audioParams);
    this.device.queue.writeBuffer(this.audioParamBuffer, 0, new Float32Array([freq, volume]));
    this.lastAudioParams = new Float32Array([0, freq, volume]);
    console.log("this.lastAudioParams", this.lastAudioParams);
    this.device.queue.writeBuffer(this.lastAudioParamBuffer, 0, new Float32Array([0, freq, volume]));

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
    const bufferedSeconds = (this.startTime + this.nextChunkOffset) - (performance.now() / 1000.0);
    const numBufferedChunks = Math.floor(bufferedSeconds / this.chunkDurationInSeconds);

    if (numBufferedChunks > MAX_BUFFERED_CHUNKS) {
      const timeout = this.chunkDurationInSeconds;
      this.timeoutId = setTimeout(await this.createSoundChunk.bind(this), timeout * 1000.0);
      return;
    }
    console.log("this.audioParams", this.audioParams);
    this.device.queue.writeBuffer(this.audioParamBuffer, 0, new Float32Array(this.audioParams));
    console.log("this.lastAudioParams", this.lastAudioParams);
    this.device.queue.writeBuffer(this.lastAudioParamBuffer, 0, this.lastAudioParams);

    const commandEncoder = this.device.createCommandEncoder();
    const freqPass = commandEncoder.beginComputePass();
    freqPass.setPipeline(this.freqPipeline);
    freqPass.setBindGroup(0, this.freqBindGroup);
    freqPass.dispatchWorkgroups(
      Math.ceil(this.chunkNumSamplesPerChannel / this.workgroupSize)
    );
    freqPass.end();

    const synthPass = commandEncoder.beginComputePass();
    synthPass.setPipeline(this.synthPipeline);
    synthPass.setBindGroup(0, this.synthBindGroup);
    synthPass.dispatchWorkgroups(
      Math.ceil(this.chunkNumSamplesPerChannel / this.workgroupSize)
    );
    synthPass.end();

    commandEncoder.copyBufferToBuffer(this.chunkBuffer, 0, this.chunkMapBuffer, 0, this.chunkBufferSize);
    commandEncoder.copyBufferToBuffer(this.lastAudioParamBuffer, 0, this.lastAudioParamMapBuffer, 0, Float32Array.BYTES_PER_ELEMENT * 3);
    commandEncoder.copyBufferToBuffer(this.logBuffer, 0, this.logMapBuffer, 0, this.chunkNumSamplesPerChannel * Float32Array.BYTES_PER_ELEMENT);

    this.device.queue.submit([commandEncoder.finish()]);

    await this.chunkMapBuffer.mapAsync(GPUMapMode.READ, 0, this.chunkBufferSize);
    await this.lastAudioParamMapBuffer.mapAsync(GPUMapMode.READ, 0, Float32Array.BYTES_PER_ELEMENT * 3);
    await this.logMapBuffer.mapAsync(GPUMapMode.READ, 0, this.chunkNumSamplesPerChannel * Float32Array.BYTES_PER_ELEMENT);

    const chunkData = new Float32Array(this.chunkNumSamples);
    chunkData.set(new Float32Array(this.chunkMapBuffer.getMappedRange()));
    this.chunkMapBuffer.unmap();

    const lastAudioParamData = new Float32Array(3);
    lastAudioParamData.set(new Float32Array(this.lastAudioParamMapBuffer.getMappedRange()));
    this.lastAudioParams = lastAudioParamData;
    this.lastAudioParamMapBuffer.unmap();

    const logData = new Float32Array(this.chunkNumSamplesPerChannel);
    logData.set(new Float32Array(this.logMapBuffer.getMappedRange()));
    console.log("logData", logData);
    this.logMapBuffer.unmap();

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

  public updateAudioParams(freq: number, volume: number) {
    this.audioParams = [freq, volume];
  }

  public async stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.audioContext) await this.audioContext.suspend();
    if (this.audioContext) await this.audioContext.close();
  }
}