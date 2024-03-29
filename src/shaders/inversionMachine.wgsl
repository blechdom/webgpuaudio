const PARTIALS: u32 = 256u;
const PI2: f32 = 6.283185307179586476925286766559;

override WORKGROUP_SIZE: u32 = 256;
override SAMPLE_RATE: f32 = 44100.0;

struct TimeInfo { offset: f32 }
struct AudioParam {
    bouncePitch: f32,
    fractalIterations: f32,
    squelchMod: f32,
    gain: f32,
    squelch: f32,
    squelchSpeed: f32,
    bounceTime: f32,
    fractalGain: f32,
    bounceGain: f32,
    squelchGain: f32
    }

@group(0) @binding(0) var<uniform> time_info: TimeInfo;
@group(0) @binding(1) var<storage, read_write> sound_chunk: array<vec2<f32>>; // 2 channel pcm data
@binding(2) @group(0) var<storage, read> audio_param: AudioParam;

@compute
@workgroup_size(WORKGROUP_SIZE)
fn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let sampleCount: u32 = global_id.x;

    if (sampleCount >= arrayLength(&sound_chunk)) {
        return;
    }

    let t = f32(sampleCount) / SAMPLE_RATE;

    sound_chunk[sampleCount] = mainSound(time_info.offset + t, audio_param);
}

fn rand(co: vec2<f32>) -> f32 {
	return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

fn mainSound( time: f32, audio_param: AudioParam ) -> vec2<f32> {

	var ti: f32 = time;
    var s: vec2<f32> = vec2(0.0);
    var t: f32 = (time%audio_param.squelchSpeed)-(audio_param.squelchSpeed*.5);
    var tb: f32 = time%audio_param.bounceTime;
	var x: f32 = t*.05;
	//fractal sound
	var maxIter: i32 = i32(audio_param.fractalIterations);
    for (var i=0;i<maxIter;i++) {
    	x=1.3/abs(x)-1.;
    }
    s+=x*audio_param.fractalGain;
    //pulse
	s*=.05;
    s+=vec2(sin(time),cos(time))*sin(tb*tb*audio_param.bouncePitch)*exp(-15.*tb)*audio_param.bounceGain;
	s+=(1.-((time*(audio_param.squelch+sin(t*t)*audio_param.squelchMod)+x*.2)%2.))*audio_param.squelchGain;
    return vec2(s*audio_param.gain)*clamp(60.-time,0.,1.);
}