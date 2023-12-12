export default class WebGpuAudioEngine {
  public chunkDurationInSeconds: number;
  public device: GPUDevice | undefined;
  public chunkNumSamplesPerChannel: number;
  public chunkNumSamples: number;
  public chunkBufferSize: number;
  public timeInfoBuffer: GPUBuffer;
  public chunkBuffer: GPUBuffer;
  public chunkMapBuffer: GPUBuffer;
  public audioParamBuffer?: GPUBuffer;
  public pipeline: GPUComputePipeline;
  public bindGroup: GPUBindGroup;
  public audioShaderModule: GPUShaderModule;

  constructor(
    numChannels: number,
    sampleRate: number,
    workgroupSize: number,
    chunkDurationInSeconds: number,
    device: GPUDevice,
    compute: string,
    entryPoint: string,
    audioParamsLength?: number)
  {
    this.chunkDurationInSeconds = chunkDurationInSeconds;
    this.device = device;
    this.chunkNumSamplesPerChannel = sampleRate * chunkDurationInSeconds;
    this.chunkNumSamples = numChannels * this.chunkNumSamplesPerChannel;
    this.chunkBufferSize = this.chunkNumSamples * Float32Array.BYTES_PER_ELEMENT;
    this.timeInfoBuffer = this.device.createBuffer({
      size: Float32Array.BYTES_PER_ELEMENT * 1,
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

    if(audioParamsLength) {
      this.audioParamBuffer = this.device.createBuffer({
        size: Float32Array.BYTES_PER_ELEMENT * audioParamsLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
    }

    this.audioShaderModule = device.createShaderModule({code: compute});
    this.pipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: this.audioShaderModule,
        entryPoint: entryPoint,
        constants: {
          SAMPLING_RATE: sampleRate,
          WORKGROUP_SIZE: workgroupSize
        }
      }
    });
    console.log(this.audioParamBuffer);

    if(this.audioParamBuffer) {
      this.bindGroup = device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: {buffer: this.timeInfoBuffer}},
          {binding: 1, resource: {buffer: this.chunkBuffer}},
          {binding: 2, resource: {buffer: this.audioParamBuffer}},
        ]
      });
    } else {
      this.bindGroup = device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: {buffer: this.timeInfoBuffer}},
          {binding: 1, resource: {buffer: this.chunkBuffer}},
        ]
      });
    }
  }
}