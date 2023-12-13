override WORKGROUP_SIZE: u32 = 256;
override SAMPLE_RATE: f32 = 44100.0;

struct TimeInfo { offset: f32 }

@group(0) @binding(0) var<uniform> time_info: TimeInfo;
@group(0) @binding(1) var<storage, read_write> sound_chunk: array<vec2<f32>>;

@compute @workgroup_size(WORKGROUP_SIZE)
fn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let sampleX = global_id.x;

    let t = f32(sampleX) / SAMPLE_RATE;

    sound_chunk[sampleX] = square(time_info.offset + t);
}

fn square(time: f32) -> vec2<f32> {
    const freq: f32 = 333;
    var v: f32 = step(fract(time * freq), 0.5) * 2.0 - 1.0;
    const amp: f32 = 0.25;
    return vec2(v * amp);
}