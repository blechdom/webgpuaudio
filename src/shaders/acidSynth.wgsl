const PARTIALS: u32 = 256u;
const PI2: f32 = 6.283185307179586476925286766559;

override WORKGROUP_SIZE: u32 = 256;
override SAMPLE_RATE: f32 = 44100.0;

struct TimeInfo { offset: f32 }
struct AudioParam {
    partials: f32,
    frequency: f32,
    timeMod: f32,
    timeScale: f32,
    gain: f32,
    dist: f32,
    dur: f32,
    ratio: f32,
    sampOffset: f32,
    fundamental: f32,
    stereo: f32,
    nse: f32,
    res: f32,
    lfo: f32,
    flt: f32,
}

@group(0) @binding(0) var<uniform> time_info: TimeInfo;
@group(0) @binding(1) var<storage, read_write> song_chunk: array<vec2<f32>>; // 2 channel pcm data
@binding(2) @group(0) var<storage, read> audio_param: AudioParam;

@compute
@workgroup_size(WORKGROUP_SIZE)
fn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let sampleCount: u32 = global_id.x;

    if (sampleCount >= arrayLength(&song_chunk)) {
        return;
    }

    let t = f32(sampleCount) / SAMPLE_RATE;

    song_chunk[sampleCount] = mainSound(time_info.offset + t, audio_param);
}

fn dist(s: vec2<f32>, d: f32) -> vec2<f32> {
    let distClamp: vec2<f32> = vec2(s * d);
    let distSig: vec2<f32> = clamp(distClamp, vec2<f32>(-1.0), vec2<f32>(1.0));
    return distSig;
}

fn _filter(h: f32, cut: f32, res: f32) -> f32 {
	let cutted: f32 = cut - 20.0;
	let df: f32 = max(h - cutted, 0.0);
	let df2: f32 = abs(h - cutted);
	return exp(-0.005 * df * df) * 0.5 + exp(df2 * df2 * -0.1) * res;
}

fn nse(x: f32) -> f32 {
	return fract(sin(x * 110.082) * audio_param.nse);
}

fn ntof(n: f32, fundamental: f32) -> f32 {
	return fundamental * pow(2.0, (n - 69.0) / 12.0);
}

fn synth(tseq: f32, t: f32, audio_param: AudioParam) -> vec2<f32> {
    var v: vec2<f32> = vec2(0.0);
    let tnote: f32 = fract(tseq);
    let dr: f32 = audio_param.dur;
    let amp: f32 = smoothstep(0.05, 0.0, abs(tnote - dr - 0.05) - dr) * exp(tnote * -1.0);
    let seqn: f32 = nse(floor(tseq));
    let n: f32 = 20.0 + floor(seqn * audio_param.frequency);
    let f: f32 = ntof(n, audio_param.fundamental);
    let sqr: f32 = smoothstep(0.0, 0.01, abs((t*audio_param.timeScale)%audio_param.timeMod - 20.0) - 20.0);
    let base: f32 = f;
    let flt: f32 = exp(tnote * audio_param.flt) * 50.0 + pow(cos(t * audio_param.lfo) * 0.5 + 0.5, 4.0) * 80.0;

    for (var i = 0u; i < u32(audio_param.partials); i += 1) {
        var h: f32 = f32(i + u32(audio_param.sampOffset));
        var inten: f32 = 1.0 / h;

        inten = mix(inten, inten * (h%audio_param.ratio), sqr);
        inten *= exp(-1.0 * max(audio_param.ratio - h, 0.0));
        inten *= _filter(h, flt, audio_param.res);

        var vx = v.x + (inten * sin((PI2 + (audio_param.stereo / 2)) * (t * base * h)));
        var vy = v.y + (inten * sin((PI2 - (audio_param.stereo / 2)) * (t * base * h)));
        v = vec2(vx, vy);
    }

    let o: f32 = v.x * amp;

    return vec2(dist(v * amp, audio_param.dist));
}

fn mainSound(time: f32, audio_param: AudioParam) -> vec2<f32> {

    var tb: f32 = (time * audio_param.timeScale)%audio_param.timeMod;
    var mx: vec2<f32> = synth(tb, time, audio_param) * audio_param.gain;

  	return vec2(mx);
}