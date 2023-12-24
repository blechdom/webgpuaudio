"use strict";(self.webpackChunkwebgpuaudio=self.webpackChunkwebgpuaudio||[]).push([[610],{6374:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>m,contentTitle:()=>l,default:()=>w,frontMatter:()=>h,metadata:()=>p,toc:()=>g});var i=t(5893),s=t(1151),o=t(7294),a=t(1229),r=t(1077),u=t(8281),f=t(3947);const c="override WORKGROUP_SIZE: u32 = 256;\noverride SAMPLE_RATE: f32 = 48000.0;\nconst PI2: f32 = 6.283185307179586476925286766559;\n\nstruct TimeInfo {\n    offset: f32,\n}\n\nstruct AudioParam {\n  frequency: f32,\n  gain: f32,\n  waveForm: f32\n}\n\n@binding(0) @group(0) var<uniform> time_info: TimeInfo;\n@binding(1) @group(0) var<storage, read_write> sound_chunk: array<vec2<f32>>;\n@binding(2) @group(0) var<storage, read> audio_param: AudioParam;\n\n@compute\n@workgroup_size(WORKGROUP_SIZE)\nfn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {\n    var sampleCount: u32 = global_id.x;\n\n    if (sampleCount >= arrayLength(&sound_chunk)) {\n        return;\n    }\n\n    var t = f32(sampleCount) / SAMPLE_RATE;\n\n    sound_chunk[sampleCount] = oscillator(time_info.offset + t, audio_param.frequency, audio_param.gain, audio_param.waveForm);\n}\n\nfn oscillator(time: f32, frequency: f32, gain: f32, waveForm: f32) -> vec2<f32> {\n\n    var v: f32 = sin(time * frequency * PI2);\n    if (waveForm == 1.0) {\n       v = -abs(fract(time * frequency)-0.5)*4.0-1.0;\n    } else if (waveForm == 2.0) {\n        v = step(fract(time * frequency),0.5)*2.0-1.0;\n    } else if (waveForm == 3.0) {\n        v = 1.0 - 2.0*fract(time * frequency);\n    }\n    return vec2(v * gain);\n}\n";var d=t(2402);const h={title:"WGSL Audio Editor, with real-time inputs",sidebar_position:2},l=void 0,p={id:"wgslEditor/WgslAudioEditorWithInputs",title:"WGSL Audio Editor, with real-time inputs",description:"const [playing, setPlaying] = useState(false);",source:"@site/docs/wgslEditor/WgslAudioEditorWithInputs.mdx",sourceDirName:"wgslEditor",slug:"/wgslEditor/WgslAudioEditorWithInputs",permalink:"/docs/wgslEditor/WgslAudioEditorWithInputs",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:2,frontMatter:{title:"WGSL Audio Editor, with real-time inputs",sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"WGSL Audio Editor, no real-time inputs",permalink:"/docs/wgslEditor/WgslAudioNoInput"},next:{title:"WGSL Audio Editor, One-Shots",permalink:"/docs/wgslEditor/WgslAudioOneShots"}},m={},g=[],v=function(){const e={li:"li",ul:"ul",...(0,s.a)()},n=["sine","triangle","square","sawtooth"],t=[1,2,4,8,16,32,64,128,256],[h,l]=(0,o.useState)(!1),[p,m]=(0,o.useState)(),[g,v]=o.useState(c),[S,w]=(0,o.useState)(440);(0,o.useEffect)((()=>()=>{E()}),[]);const k=(0,o.useCallback)(((e,n)=>{console.log("val:",e),v(e)}),[]),{volume:_,waveForm:P,chunkDurationInSeconds:b,workgroupSize:y,loadShader:A}=(0,u.M4)({waveForm:{options:n},frequency:{value:60,min:0,max:100,step:1e-4,onChange:e=>{const n=Math.log(40),t=(Math.log(3e3)-n)/100;w(Math.exp(n+t*(e-0)))}},string:{value:"Hz",label:S.toFixed(3),editable:!1},volume:{value:.15,min:0,max:1,step:.01},WebGPUSettings:(0,u.so)({loadShader:{options:["oscillators","oneShot"]},chunkDurationInSeconds:{value:.1,min:.03,max:1,step:.01},workgroupSize:{options:t,value:t[8]}},{collapsed:!0}),[h?"Stop Sound":"Play Sound"]:(0,u.LI)((()=>{l(!h)}))},[h,S]);async function E(){p&&(await p.stop(),m(void 0))}return(0,o.useEffect)((()=>{h?async function(){if(void 0===p){const e=new f.Z(b);await e.initGPU({code:g,entryPoint:"synthesize",workgroupSize:y}),m(e)}}():E()}),[h]),(0,o.useEffect)((()=>{h&&l(!1)}),[b,y,g]),(0,o.useEffect)((()=>{switch(console.log("shader",A),A){case"oscillators":default:v(c);break;case"oneShot":v(d.Z)}}),[A]),(0,o.useEffect)((()=>{p&&p.playSound()}),[p]),(0,o.useEffect)((()=>{if(p&&p.updateAudioParams){let e=n.indexOf(P);p.updateAudioParams(S,_,e)}}),[p,S,_,P]),(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(e.ul,{children:[(0,i.jsx)(e.li,{children:"Audio Synthesis uses rough streaming architecture to get chunks out of WebGPU and send control buffers to control a WebGPU compute shader."}),(0,i.jsx)(e.li,{children:"Select different shaders in the Leva control panel to hear different sounds."}),(0,i.jsx)(e.li,{children:"When changing WebGPU Parameters, the sound will stop and will need to be restarted."}),(0,i.jsx)(e.li,{children:"Changing sound parameters will happen at the rate of the chunk duration, so if you change the frequency, it will take a chunk duration to hear the change. (Interpolation options coming soon.)"}),(0,i.jsx)(e.li,{children:"Fully refresh the page if things get strange."}),(0,i.jsx)(e.li,{children:"The code below in the live wgsl editor creates the audio data in the WebGPU compute shader."})]}),(0,i.jsx)(u.Zf,{flat:!0,oneLineLabels:!0}),(0,i.jsx)(a.ZP,{value:g,width:"90%",height:"400px",extensions:[(0,r.i)()],onChange:k})]})};function S(e){return(0,i.jsx)(i.Fragment,{})}function w(e={}){return(0,i.jsx)(v,{...e,children:(0,i.jsx)(S,{...e})})}},3947:(e,n,t)=>{t.d(n,{Z:()=>i});class i{timeoutId=null;nextChunkOffset=0;workgroupSize=0;constructor(e){this.audioContext=new AudioContext,this.sampleRate=this.audioContext.sampleRate,this.chunkDurationInSeconds=e,this.chunkNumSamplesPerChannel=this.sampleRate*e,this.chunkNumSamples=2*this.chunkNumSamplesPerChannel,this.chunkBufferSize=this.chunkNumSamples*Float32Array.BYTES_PER_ELEMENT}async initGPU(e){let{code:n,entryPoint:t,workgroupSize:i}=e;this.workgroupSize=i;const s=await navigator.gpu.requestAdapter();this.device=await s.requestDevice(),this.timeInfoBuffer=this.device.createBuffer({size:Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.chunkBuffer=this.device.createBuffer({size:this.chunkBufferSize,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.chunkMapBuffer=this.device.createBuffer({size:this.chunkBufferSize,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.audioParamBuffer=this.device.createBuffer({size:3*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.audioShaderModule=this.device.createShaderModule({code:n}),this.pipeline=this.device.createComputePipeline({layout:"auto",compute:{module:this.audioShaderModule,entryPoint:t,constants:{SAMPLE_RATE:this.sampleRate,WORKGROUP_SIZE:i}}}),this.bindGroup=this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.timeInfoBuffer}},{binding:1,resource:{buffer:this.chunkBuffer}},{binding:2,resource:{buffer:this.audioParamBuffer}}]})}playSound(){(async()=>{await this.createSoundChunk()})()}async createSoundChunk(){if(!this.audioContext)return;void 0===this.startTime&&(this.startTime=performance.now()/1e3),console.log("this.nextChunkOffset",this.nextChunkOffset);const e=this.startTime+this.nextChunkOffset-performance.now()/1e3;if(Math.floor(e/this.chunkDurationInSeconds)>2){const e=this.chunkDurationInSeconds;return void(this.timeoutId=setTimeout(await this.createSoundChunk.bind(this),1e3*e))}this.device.queue.writeBuffer(this.timeInfoBuffer,0,new Float32Array([this.nextChunkOffset]));const n=this.device.createCommandEncoder(),t=n.beginComputePass();t.setPipeline(this.pipeline),t.setBindGroup(0,this.bindGroup),t.dispatchWorkgroups(Math.ceil(this.chunkNumSamplesPerChannel/this.workgroupSize)),t.end(),n.copyBufferToBuffer(this.chunkBuffer,0,this.chunkMapBuffer,0,this.chunkBufferSize),this.device.queue.submit([n.finish()]),await this.chunkMapBuffer.mapAsync(GPUMapMode.READ,0,this.chunkBufferSize);const i=new Float32Array(this.chunkNumSamples);i.set(new Float32Array(this.chunkMapBuffer.getMappedRange())),this.chunkMapBuffer.unmap();const s=this.audioContext.createBuffer(2,this.chunkNumSamplesPerChannel,this.audioContext.sampleRate),o=[];for(let r=0;r<2;++r)o.push(s.getChannelData(r));for(let r=0;r<s.length;++r)for(const[e,n]of o.entries())n[r]=i[2*r+e];const a=this.audioContext.createBufferSource();a.buffer=s,a.connect(this.audioContext.destination),0!==this.nextChunkOffset&&a.start(this.nextChunkOffset),this.nextChunkOffset+=a.buffer.duration,await this.createSoundChunk()}updateAudioParams(e,n,t){this.device.queue.writeBuffer(this.audioParamBuffer,0,new Float32Array([e,n,t]))}async stop(){this.timeoutId&&clearTimeout(this.timeoutId),this.audioContext&&await this.audioContext.suspend(),this.audioContext&&await this.audioContext.close()}}},2402:(e,n,t)=>{t.d(n,{Z:()=>i});const i="override WORKGROUP_SIZE: u32 = 256;\noverride SAMPLE_RATE: f32 = 48000.0;\n\nstruct TimeInfo {\n    offset: f32,\n}\n\nstruct AudioParam {\n  frequency: f32,\n  gain: f32,\n  oneShot: f32,\n}\n\n@binding(0) @group(0) var<uniform> time_info: TimeInfo;\n@binding(1) @group(0) var<storage, read_write> sound_chunk: array<vec2<f32>>; // 2 channel pcm data\n@binding(2) @group(0) var<storage, read> audio_param: AudioParam;\n\n@compute\n@workgroup_size(WORKGROUP_SIZE)\nfn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {\n    let sampleCount: u32 = global_id.x;\n\n    if (sampleCount >= arrayLength(&sound_chunk)) {\n        return;\n    }\n    let t = f32(sampleCount) / SAMPLE_RATE;\n\n    if (audio_param.oneShot == 0.0){\n        sound_chunk[sampleCount] = guitar(time_info.offset + t, audio_param.frequency, audio_param.gain);\n    } else if (audio_param.oneShot == 1.0) {\n        sound_chunk[sampleCount] = kick(time_info.offset + t, audio_param.frequency, audio_param.gain);\n  } else if (audio_param.oneShot == 2.0) {\n        sound_chunk[sampleCount] = snare(time_info.offset + t, audio_param.frequency, audio_param.gain);\n    } else {\n        sound_chunk[sampleCount] = guitar(time_info.offset + t, audio_param.frequency, audio_param.gain);\n    }\n}\nconst TAU: f32 = 6.283185307179586476925286766559;\n\nfn window(a: f32, b: f32, t: f32) -> f32\n{\n    return smoothstep(a, (a+b)*0.5, t) * smoothstep(b, (a+b)*0.5, t);\n}\n\n\nfn guitar(time: f32, freq: f32, gain: f32) -> vec2<f32> {\n    const PI: f32 = 3.141592654;\n\n    const L: f32 = 0.635;\n    const h: f32 = 0.125;\n    const d: f32 = 0.15;\n    const GAMMA: f32 = 2.5;\n    const b: f32 = 0.008;\n    const MAX_HARMONICS: u32 = 50u;\n\n    var sig = 0.0;\n\n    for (var n = 0u; n < MAX_HARMONICS; n += 1) {\n        let a_n: f32 = ((2. * h * L * L) / (PI * PI * d * (L - d) * f32(n+1u) * f32(n+1u))) * sin((f32(n+1u) * PI * d) / L );\n        let f_n = f32(n+1u) * freq * sqrt(1. + b * b * f32(n+1u) * f32(n+1u));\n        sig += a_n * sin(TAU * f_n * time) * exp(-f32(n+1u) * GAMMA * freq/200.0 * time);\n    }\n    return vec2(sig * gain);\n}\n\nfn kick(time: f32, freq: f32, gain: f32) -> vec2<f32> {\n    var env: f32 = pow(max(0., 1. - 0.6*time), 1.8);\n    return vec2(env * sin(60.0*time + env*10.0*time));\n}\n\nfn snare(t: f32, freq: f32, gain: f32) -> vec2<f32> {\n\n       // Basic noise-based snare\n       var noi: f32 = coloredNoise(t, 4000., 1000.) + coloredNoise(t, 4000., 3800.) + coloredNoise(t,8000.,7500.) * 0.5;\n       var env: f32 = smoothstep(0.,0.001,t) * smoothstep(0.2,0.05,t);\n       env *= (1. + smoothstep(0.02,0.0,t)); // increase transient\n       env *= (1. - 0.5*window(0.02,0.1,t)); // fake compression\n       var sig: vec2<f32> = vec2(noi) * env;\n       sig = sig/(1.+abs(sig));\n       return vec2(sig * 0.1);\n}\n\nfn noise(s: f32) -> f32 {\n    // Noise is sampled at every integer s\n    // If s = t*f, the resulting signal is close to a white noise\n    // with a sharp cutoff at frequency f.\n\n    // For some reason float(int(x)+1) is sometimes not the same as floor(x)+1.,\n    // and the former produces fewer artifacts?\n    var si: u32 = u32(floor(s));\n    var sf: f32 = fract(s);\n    sf = sf*sf*(3.-2.*sf); // smoothstep(0,1,sf)\n    //sf = sf*sf*sf*(sf*(sf*6.0-15.0)+10.0); // quintic curve\n    // see https://iquilezles.org/articles/texture\n    return mix(rand(f32(si)), rand(f32(si+1)), sf) * 2. - 1.;\n}\n\nfn noise2(s: f32) -> vec2<f32> {\n    var si: u32 = u32(floor(s));\n    var sf: f32 = fract(s);\n    sf = sf*sf*(3.-2.*sf); // smoothstep(0,1,sf)\n    return mix(rand2(f32(si)), rand2(f32(si+1)), sf) * 2. - 1.;\n}\n\n\nfn coloredNoise(t: f32, fc: f32, df: f32) -> f32\n{\n    return sin(TAU*fc*fract(t))*noise(t*df);\n}\n\nfn coloredNoise2(t: f32, fc: f32, df: f32) -> vec2<f32> {\n    // Noise peak centered around frequency fc\n    // containing frequencies between fc-df and fc+df\n    var noiz: vec2<f32> = noise2(t*df);\n    var modul: vec2<f32> = vec2(cos(TAU*fc*t), sin(TAU*fc*t));\n    return modul*noiz;\n}\n\nfn rand(p: f32) -> f32\n{\n    // Hash function by Dave Hoskins\n    // https://www.shadertoy.com/view/4djSRW\n    var q = fract(p * .1031);\n    q *= q + 33.33;\n    q *= q + q;\n    return fract(q);\n}\n\nfn rand2(p: f32) -> vec2<f32>\n{\n    // Hash function by Dave Hoskins\n    // https://www.shadertoy.com/view/4djSRW\n\tvar p3: vec3<f32> = fract(vec3(p) * vec3(.1031, .1030, .0973));\n\tp3 += dot(p3, p3.yzx + 33.33);\n    return fract((p3.xx+p3.yz)*p3.zy);\n}"}}]);