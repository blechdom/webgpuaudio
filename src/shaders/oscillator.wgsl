override WORKGROUP_SIZE: u32 = 256;
override SAMPLE_RATE: f32 = 48000.0;
const PI2: f32 = 6.283185307179586476925286766559;

struct LastAudioParams {
  offset: f32,
  frequency: f32,
  gain: f32,
}

struct AudioParams {
  frequency: f32,
  gain: f32,
}

@binding(0) @group(0) var<storage, read_write> sound_chunk: array<vec2<f32>>;
@binding(1) @group(0) var<storage, read> audio_param: AudioParams;
@binding(2) @group(0) var<storage, read_write> last_audio_param: LastAudioParams;
@binding(3) @group(0) var<storage, read_write> logBuffer: array<f32>;

@compute
@workgroup_size(WORKGROUP_SIZE)
fn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {
    var sampleCount: u32 = global_id.x;

    if (sampleCount >= arrayLength(&sound_chunk)) {
        return;
    }

    var mixFade = f32(sampleCount) / f32(arrayLength(&sound_chunk) - 1); // from 0 to 1 for length of sound_chunk

    var freqRamp = mix(last_audio_param.frequency, audio_param.frequency, mixFade); // from last freq to current freq depending on mixFade

    var saw: f32 = (f32(sampleCount) * (freqRamp / SAMPLE_RATE)) % 1.0;

    logBuffer[sampleCount] = saw;

    var v: f32 = sin(saw * PI2);

    var gainRamp = mix(last_audio_param.gain, audio_param.gain, f32(global_id.x) / f32(arrayLength(&sound_chunk)));
    sound_chunk[sampleCount] = vec2(v * gainRamp);
    last_audio_param.frequency = audio_param.frequency;
    last_audio_param.gain = audio_param.gain;
    last_audio_param.offset = saw;
}