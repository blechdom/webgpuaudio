override WORKGROUP_SIZE: u32 = 4;
const PI2: f32 = 6.283185307179586476925286766559;

struct TimeInfo {
  offset: f32,
  sampleRate: f32
}

struct AudioParam {
  lastFrequency: f32,
  frequency: f32,
  lastGain: f32,
  gain: f32
}

@group(0) @binding(0) var<storage, read> input: array<f32>;
@group(0) @binding(1) var<storage, read_write> output: array<f32>;
@group(0) @binding(2) var<uniform> time_info: TimeInfo;
@group(0) @binding(3)  var<storage, read> audio_param: AudioParam;

@compute @workgroup_size(WORKGROUP_SIZE)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  var sampleCount: u32 = global_id.x;
  if (sampleCount >= arrayLength(&input)) {
    return;
  }

  var t: f32 = (f32(sampleCount) + time_info.offset) / (time_info.sampleRate * 2.0);
  var freq: f32 =  audio_param.frequency;//mix(audio_param.lastFrequency, audio_param.frequency, clamp(f32(sampleCount)/f32(arrayLength(&input)), 0.0, 1.0));
  var am: f32 = sin(t * freq * PI2);
  var modulator: f32 = am * 0.5 + 0.5;
  var modulated: f32 = input[sampleCount] * am;

  //var smoothGain: f32 = mix(audio_param.lastGain, audio_param.gain, clamp(f32(sampleCount)/(f32(arrayLength(&input) / 2)), 0.0, 1.0));
  //var a: f32 = smoothstep(0.0, f32(arrayLength(&input)), f32(sampleCount));
  //var triangle = ((-abs(fract(t * 1)-0.5)*4.0-1.0) / 2.0) + 0.5;
  //var smoothGain = mix(audio_param.gain, audio_param.lastGain, triangle);
  output[sampleCount] = modulated * audio_param.gain;
}