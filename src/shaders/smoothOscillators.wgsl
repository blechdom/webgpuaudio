override WORKGROUP_SIZE: u32 = 256;
override SAMPLE_RATE: f32 = 48000.0;
const PI2: f32 = 6.283185307179586476925286766559;

struct TimeInfo {
    offset: f32,
}

struct AudioParam {
  lastFrequency: f32,
  frequency: f32,
  gain: f32,
  waveForm: f32
}

@binding(0) @group(0) var<uniform> time_info: TimeInfo;
@binding(1) @group(0) var<storage, read_write> sound_chunk: array<vec2<f32>>;
@binding(2) @group(0) var<storage, read> audio_param: AudioParam;

@compute
@workgroup_size(WORKGROUP_SIZE)
fn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {
    var sampleCount: u32 = global_id.x;

    if (sampleCount >= arrayLength(&sound_chunk)) {
        return;
    }

    var t = f32(sampleCount) / SAMPLE_RATE;
    var freq = mix(audio_param.lastFrequency, audio_param.frequency, f32(sampleCount) / f32(arrayLength(&sound_chunk)));

    sound_chunk[sampleCount] = oscillator(time_info.offset + t, freq, audio_param.gain, audio_param.waveForm);
}

fn oscillator(time: f32, frequency: f32, gain: f32, waveForm: f32) -> vec2<f32> {

    var v: f32 = sin(time * frequency * PI2);
    if (waveForm == 1.0) {
       v = -abs(fract(time * frequency)-0.5)*4.0-1.0;
    } else if (waveForm == 2.0) {
        v = step(fract(time * frequency),0.5)*2.0-1.0;
    } else if (waveForm == 3.0) {
        v = 1.0 - 2.0*fract(time * frequency);
    }
    return vec2(v * gain);
}
