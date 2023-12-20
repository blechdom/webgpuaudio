struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) normal: vec3<f32>
};

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