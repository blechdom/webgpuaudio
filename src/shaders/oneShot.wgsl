override WORKGROUP_SIZE: u32 = 256;
override SAMPLE_RATE: f32 = 48000.0;

struct TimeInfo {
    offset: f32,
}

struct AudioParam {
  frequency: f32,
  gain: f32,
  oneShot: f32,
}

@binding(0) @group(0) var<uniform> time_info: TimeInfo;
@binding(1) @group(0) var<storage, read_write> sound_chunk: array<vec2<f32>>; // 2 channel pcm data
@binding(2) @group(0) var<storage, read> audio_param: AudioParam;

@compute
@workgroup_size(WORKGROUP_SIZE)
fn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let sampleCount: u32 = global_id.x;

    if (sampleCount >= arrayLength(&sound_chunk)) {
        return;
    }
    let t = f32(sampleCount) / SAMPLE_RATE;

    if (audio_param.oneShot == 0.0){
        sound_chunk[sampleCount] = guitar(time_info.offset + t, audio_param.frequency, audio_param.gain);
    } else if (audio_param.oneShot == 1.0) {
        sound_chunk[sampleCount] = kick(time_info.offset + t, audio_param.frequency, audio_param.gain);
  } else if (audio_param.oneShot == 2.0) {
        sound_chunk[sampleCount] = snare(time_info.offset + t, audio_param.frequency, audio_param.gain);
    } else {
        sound_chunk[sampleCount] = guitar(time_info.offset + t, audio_param.frequency, audio_param.gain);
    }
}
const TAU: f32 = 6.283185307179586476925286766559;

fn window(a: f32, b: f32, t: f32) -> f32
{
    return smoothstep(a, (a+b)*0.5, t) * smoothstep(b, (a+b)*0.5, t);
}


fn guitar(time: f32, freq: f32, gain: f32) -> vec2<f32> {
    const PI: f32 = 3.141592654;

    const L: f32 = 0.635;
    const h: f32 = 0.125;
    const d: f32 = 0.15;
    const GAMMA: f32 = 2.5;
    const b: f32 = 0.008;
    const MAX_HARMONICS: u32 = 50u;

    var sig = 0.0;

    for (var n = 0u; n < MAX_HARMONICS; n += 1) {
        let a_n: f32 = ((2. * h * L * L) / (PI * PI * d * (L - d) * f32(n+1u) * f32(n+1u))) * sin((f32(n+1u) * PI * d) / L );
        let f_n = f32(n+1u) * freq * sqrt(1. + b * b * f32(n+1u) * f32(n+1u));
        sig += a_n * sin(TAU * f_n * time) * exp(-f32(n+1u) * GAMMA * freq/200.0 * time);
    }
    return vec2(sig * gain);
}

fn kick(time: f32, freq: f32, gain: f32) -> vec2<f32> {
    var env: f32 = pow(max(0., 1. - 0.6*time), 1.8);
    return vec2(env * sin(60.0*time + env*10.0*time));
}

fn snare(t: f32, freq: f32, gain: f32) -> vec2<f32> {

       // Basic noise-based snare
       var noi: f32 = coloredNoise(t, 4000., 1000.) + coloredNoise(t, 4000., 3800.) + coloredNoise(t,8000.,7500.) * 0.5;
       var env: f32 = smoothstep(0.,0.001,t) * smoothstep(0.2,0.05,t);
       env *= (1. + smoothstep(0.02,0.0,t)); // increase transient
       env *= (1. - 0.5*window(0.02,0.1,t)); // fake compression
       var sig: vec2<f32> = vec2(noi) * env;
       sig = sig/(1.+abs(sig));
       return vec2(sig * 0.1);
}

fn noise(s: f32) -> f32 {
    // Noise is sampled at every integer s
    // If s = t*f, the resulting signal is close to a white noise
    // with a sharp cutoff at frequency f.

    // For some reason float(int(x)+1) is sometimes not the same as floor(x)+1.,
    // and the former produces fewer artifacts?
    var si: u32 = u32(floor(s));
    var sf: f32 = fract(s);
    sf = sf*sf*(3.-2.*sf); // smoothstep(0,1,sf)
    //sf = sf*sf*sf*(sf*(sf*6.0-15.0)+10.0); // quintic curve
    // see https://iquilezles.org/articles/texture
    return mix(rand(f32(si)), rand(f32(si+1)), sf) * 2. - 1.;
}

fn noise2(s: f32) -> vec2<f32> {
    var si: u32 = u32(floor(s));
    var sf: f32 = fract(s);
    sf = sf*sf*(3.-2.*sf); // smoothstep(0,1,sf)
    return mix(rand2(f32(si)), rand2(f32(si+1)), sf) * 2. - 1.;
}


fn coloredNoise(t: f32, fc: f32, df: f32) -> f32
{
    return sin(TAU*fc*fract(t))*noise(t*df);
}

fn coloredNoise2(t: f32, fc: f32, df: f32) -> vec2<f32> {
    // Noise peak centered around frequency fc
    // containing frequencies between fc-df and fc+df
    var noiz: vec2<f32> = noise2(t*df);
    var modul: vec2<f32> = vec2(cos(TAU*fc*t), sin(TAU*fc*t));
    return modul*noiz;
}

fn rand(p: f32) -> f32
{
    // Hash function by Dave Hoskins
    // https://www.shadertoy.com/view/4djSRW
    var q = fract(p * .1031);
    q *= q + 33.33;
    q *= q + q;
    return fract(q);
}

fn rand2(p: f32) -> vec2<f32>
{
    // Hash function by Dave Hoskins
    // https://www.shadertoy.com/view/4djSRW
	var p3: vec3<f32> = fract(vec3(p) * vec3(.1031, .1030, .0973));
	p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
}