override WORKGROUP_SIZE: u32 = 256;
override SAMPLE_RATE: f32 = 44100.0;
const PI2: f32 = 6.283185307179586476925286766559;

struct TimeInfo { offset: f32 }

@group(0) @binding(0) var<uniform> time_info: TimeInfo;
@group(0) @binding(1) var<storage, read_write> sound_chunk: array<vec2<f32>>;

@compute @workgroup_size(WORKGROUP_SIZE)
fn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let sampleX = global_id.x;

    let t = f32(sampleX) / SAMPLE_RATE;

    sound_chunk[sampleX] = sine(time_info.offset + t, f32(global_id.x));
}

fn sine(time: f32, freq: f32) -> vec2<f32> {
    var v: f32 = sin(time * freq * PI2);
    const amp: f32 = 0.25;
    return vec2(v * amp);
}