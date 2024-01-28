override WORKGROUP_SIZE: u32 = 256;
override SAMPLE_RATE: f32 = 48000.0;
const PI2: f32 = 6.283185307179586476925286766559;

struct TimeInfo {
    offset: f32,
}

struct AudioParam {
  frequency: f32,
  gain: f32,
}

@binding(0) @group(0) var<uniform> time_info: TimeInfo;
@binding(1) @group(0) var<storage, read_write> sound_chunk: array<vec2<f32>>;
@binding(2) @group(0) var<storage, read> audio_param: AudioParam;
@binding(3) @group(0) var<storage, read_write> last_audio_param: AudioParam;
@binding(4) @group(0) var<storage, read_write> log: array<vec2<f32>>;

@compute
@workgroup_size(WORKGROUP_SIZE)
fn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {
    var sampleCount: u32 = global_id.x;

    if (sampleCount >= arrayLength(&sound_chunk)) {
        return;
    }

    var t = f32(sampleCount) / SAMPLE_RATE;
    var time = time_info.offset + t;
    var freqRamp = mix(last_audio_param.frequency, audio_param.frequency, f32(global_id.x) / f32(arrayLength(&sound_chunk)));

    log[sampleCount] = vec2(freqRamp);

    var saw: f32 = (f32(sampleCount) * (freqRamp / SAMPLE_RATE)) % 1.0;

    var v: f32 = saw; //sin(saw * PI2);

    var gainRamp = mix(last_audio_param.gain, audio_param.gain, f32(global_id.x) / f32(arrayLength(&sound_chunk)));
    sound_chunk[sampleCount] = vec2(v * gainRamp);
    last_audio_param = audio_param;
}