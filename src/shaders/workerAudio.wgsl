@group(0) @binding(0) var<uniform> modelView: mat4x4<f32>;
@group(0) @binding(1) var<uniform> projection: mat4x4<f32>;
@group(0) @binding(2) var<uniform> normal: mat4x4<f32>;
    
struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) normal: vec3<f32>
};

@vertex
fn vs_main(
    @location(0) inPos: vec3<f32>,
    @location(1) inNormal: vec3<f32>
) -> VertexOutput {
    var out: VertexOutput;
    out.clip_position = projection * modelView * vec4<f32>(inPos, 3.5);
    out.normal = normalize(normal * vec4<f32>(inNormal, 0.0)).xyz;
    return out;
}
    
// Fragment shader
@fragment
    fn fs_main(in: VertexOutput,  @builtin(front_facing) face: bool) -> @location(0) vec4<f32> {
        if (face) {
            var normal:vec3<f32> = normalize(in.normal);
            return vec4<f32>(normal ,1.0);
        }
        else {
            return vec4<f32>(0.0, 1.0, 0.0 ,1.0);
        }
    }