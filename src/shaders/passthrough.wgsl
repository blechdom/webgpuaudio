override WORKGROUP_SIZE: u32 = 256;

@group(0) @binding(0)
var<storage, read> input: array<f32>;

@group(0) @binding(1)
var<storage, read_write> output: array<f32>;

@compute @workgroup_size(WORKGROUP_SIZE)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  output[global_id.x] = input[global_id.x] * 0.1;
}