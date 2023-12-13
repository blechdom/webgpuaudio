override WORKGROUP_SIZE: u32 = 256;
override SAMPLE_RATE: f32 = 44100.0;

struct TimeInfo { offset: f32 }

@group(0) @binding(0) var<uniform> time_info: TimeInfo;
@group(0) @binding(1) var<storage, read_write> sound_chunk: array<vec2<f32>>;

@compute
@workgroup_size(WORKGROUP_SIZE)
fn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let sampleX = global_id.x;

    let t = f32(sampleX) / SAMPLE_RATE;

    sound_chunk[sampleX] = sine(time_info.offset + t);
}

fn sine(time: f32) -> vec2<f32> {
    const freq: f32 = 333;
    var v: f32 = 1.0 - 2.0*fract(time * freq);
    const amp: f32 = 0.25;
    return vec2(v * amp);
}