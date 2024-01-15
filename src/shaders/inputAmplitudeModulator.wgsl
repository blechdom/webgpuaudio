override WORKGROUP_SIZE: u32 = 256;
const PI2: f32 = 6.283185307179586476925286766559;

struct TimeInfo {
  offset: f32,
  sampleRate: f32
}

struct AudioParam {
  frequency: f32,
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

  var t: f32 = (f32(sampleCount) + time_info.offset) / time_info.sampleRate / 2.0;

  var am: f32 = sin(t * audio_param.frequency * PI2);

  var modulator: f32 = am * 0.5 + 0.5;

  var modulated: f32 = input[global_id.x] * am;
  output[sampleCount] = modulated * 0.1 * audio_param.gain;
}