override WORKGROUP_SIZE: u32 = 16;

struct Params {
    lastValue: f32,
    value: f32
}

@group(0) @binding(0) var<storage, read_write> output: array<f32>;
@group(0) @binding(1) var<storage, read> params: Params;

@compute @workgroup_size(WORKGROUP_SIZE)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  if (global_id.x >= arrayLength(&output)) {
    return;
  }
  var ramp = mix(params.lastValue, params.value, f32(global_id.x) / f32(arrayLength(&output)));
  output[global_id.x] = ramp;
}