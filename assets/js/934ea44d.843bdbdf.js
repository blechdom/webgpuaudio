"use strict";(self.webpackChunkwebgpuaudio=self.webpackChunkwebgpuaudio||[]).push([[752,918],{9355:(e,t,i)=>{i.r(t),i.d(t,{assets:()=>l,contentTitle:()=>u,default:()=>f,frontMatter:()=>r,metadata:()=>c,toc:()=>h});var n=i(5893),s=i(1151),o=i(8342);const a="export default class WebAudioOscillator {\n  constructor() {\n    this.audioContext = new AudioContext();\n    this.oscillator = this.audioContext.createOscillator();\n    this.gain = this.audioContext.createGain();\n    this.oscillator.connect(this.gain);\n    this.gain.gain.value = 0;\n    this.gain.connect(this.audioContext.destination);\n    this.oscillator.start();\n  }\n\n  setVolume(volume) {\n    this.gain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.01);\n  }\n\n  setFrequency(frequency) {\n    this.oscillator.frequency.setTargetAtTime(frequency, this.audioContext.currentTime, 0.01);\n  }\n\n  setWaveForm(waveForm) {\n    this.oscillator.type = waveForm;\n  }\n\n  stop() {\n    this.gain.gain.setTargetAtTime(0.0, this.audioContext.currentTime, 0.01);\n    setTimeout(() => {\n      this.oscillator.stop();\n      this.oscillator.disconnect();\n      this.gain.disconnect();\n      if (this.audioContext) this.audioContext.close();\n      if (this.audioContext) this.audioContext = undefined;\n    }, 100);\n  }\n}",r={title:"WebAudio Oscillators",sidebar_position:4},u="WebAudio Oscillators",c={id:"webAudioOscillators",title:"WebAudio Oscillators",description:"Live Code Example",source:"@site/docs/webAudioOscillators.md",sourceDirName:".",slug:"/webAudioOscillators",permalink:"/docs/webAudioOscillators",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:4,frontMatter:{title:"WebAudio Oscillators",sidebar_position:4},sidebar:"tutorialSidebar",previous:{title:"WebGPU WebWorker Example",permalink:"/docs/webWorker/webGpuWorker"}},l={},h=[{value:"Live Code Example",id:"live-code-example",level:2}];function d(e){const t={code:"code",h1:"h1",h2:"h2",p:"p",pre:"pre",...(0,s.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"webaudio-oscillators",children:"WebAudio Oscillators"}),"\n",(0,n.jsx)(t.h2,{id:"live-code-example",children:"Live Code Example"}),"\n",(0,n.jsx)(t.p,{children:"Oscillators Audio Example using WebAudio API only, no WebGPU."}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-jsx",metastring:"live",live:!0,children:'\nfunction WebAudioOscillators() {\n  const [playing, setPlaying] = useState(false);\n  const [oscillator, setOscillator] = useState(null);\n  const [freq, setFreq] = useState(440);\n\n  const { volume, frequency, waveForm } = useControls({\n    waveForm: {options: ["sine", "triangle", "square", "sawtooth"]},\n    frequency: {\n      value: 60,\n      min: 0,\n      max: 100,\n      step: 0.0001,\n      onChange: (v) => {\n        const minIn = 0;\n        const maxIn = 100;\n        const minOut = Math.log(40);\n        const maxOut = Math.log(3000);\n        const scale = (maxOut - minOut) / (maxIn - minIn);\n        setFreq(Math.exp(minOut + scale * (v - minIn)));\n      },\n    },\n    string: {value: \'Hz\', label: freq.toFixed(3), editable: false},\n    volume: {\n      value: 0.15,\n      min: 0.0,\n      max: 1.0,\n      step: 0.01,\n    },\n    [playing ? "Stop Sound" : "Play Sound"]: button(() => {\n      setPlaying(!playing)\n    }, {order: -2})\n  }, [playing, freq]);\n  \n  useEffect(() => {\n    if (playing) {\n      setOscillator(new WebAudioOscillator()); // see class code below\n    } else if (oscillator) {\n      oscillator.stop();\n      setOscillator(null);\n    }\n  }, [playing])\n\n  useEffect(() => {\n    if (oscillator) {\n      oscillator.setVolume(volume);\n      oscillator.setFrequency(freq);\n      oscillator.setWaveForm(waveForm);\n    }\n  }, [volume, freq, waveForm, oscillator])\n  \n  return (\n    <Leva fill flat oneLineLabels />\n  )\n}\n'})}),"\n",(0,n.jsx)(o.Z,{language:"js",children:a})]})}function f(e={}){const{wrapper:t}={...(0,s.a)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(d,{...e})}):d(e)}},3684:(e,t,i)=>{i.d(t,{Z:()=>a});var n=i(7294),s=i(8281);var o=i(3947);const a={React:n,...n,Leva:s.Zf,useControls:s.M4,button:s.LI,WebAudioOscillator:class{constructor(){this.audioContext=new AudioContext,this.oscillator=this.audioContext.createOscillator(),this.gain=this.audioContext.createGain(),this.oscillator.connect(this.gain),this.gain.gain.value=0,this.gain.connect(this.audioContext.destination),this.oscillator.start()}setVolume(e){this.gain.gain.setTargetAtTime(e,this.audioContext.currentTime,.01)}setFrequency(e){this.oscillator.frequency.setTargetAtTime(e,this.audioContext.currentTime,.01)}setWaveForm(e){this.oscillator.type=e}stop(){this.gain.gain.setTargetAtTime(0,this.audioContext.currentTime,.01),setTimeout((()=>{this.oscillator.stop(),this.oscillator.disconnect(),this.gain.disconnect(),this.audioContext&&this.audioContext.close(),this.audioContext&&(this.audioContext=void 0)}),100)}},WebGpuAudioEngine:o.Z}},3947:(e,t,i)=>{i.d(t,{Z:()=>n});class n{timeoutId=null;nextChunkOffset=0;workgroupSize=0;constructor(e){this.audioContext=new AudioContext,this.sampleRate=this.audioContext.sampleRate,this.chunkDurationInSeconds=e,this.chunkNumSamplesPerChannel=this.sampleRate*e,this.chunkNumSamples=2*this.chunkNumSamplesPerChannel,this.chunkBufferSize=this.chunkNumSamples*Float32Array.BYTES_PER_ELEMENT}async initGPU(e){let{code:t,entryPoint:i,workgroupSize:n}=e;this.workgroupSize=n;const s=await navigator.gpu.requestAdapter();this.device=await s.requestDevice(),this.timeInfoBuffer=this.device.createBuffer({size:Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.chunkBuffer=this.device.createBuffer({size:this.chunkBufferSize,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),this.chunkMapBuffer=this.device.createBuffer({size:this.chunkBufferSize,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.audioParamBuffer=this.device.createBuffer({size:3*Float32Array.BYTES_PER_ELEMENT,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),this.audioShaderModule=this.device.createShaderModule({code:t}),this.pipeline=this.device.createComputePipeline({layout:"auto",compute:{module:this.audioShaderModule,entryPoint:i,constants:{SAMPLE_RATE:this.sampleRate,WORKGROUP_SIZE:n}}}),this.bindGroup=this.device.createBindGroup({layout:this.pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:this.timeInfoBuffer}},{binding:1,resource:{buffer:this.chunkBuffer}},{binding:2,resource:{buffer:this.audioParamBuffer}}]})}playSound(){(async()=>{await this.createSoundChunk()})()}async createSoundChunk(){if(!this.audioContext)return;void 0===this.startTime&&(this.startTime=performance.now()/1e3),console.log("this.nextChunkOffset",this.nextChunkOffset);const e=this.startTime+this.nextChunkOffset-performance.now()/1e3;if(Math.floor(e/this.chunkDurationInSeconds)>2){const e=this.chunkDurationInSeconds;return void(this.timeoutId=setTimeout(await this.createSoundChunk.bind(this),1e3*e))}this.device.queue.writeBuffer(this.timeInfoBuffer,0,new Float32Array([this.nextChunkOffset]));const t=this.device.createCommandEncoder(),i=t.beginComputePass();i.setPipeline(this.pipeline),i.setBindGroup(0,this.bindGroup),i.dispatchWorkgroups(Math.ceil(this.chunkNumSamplesPerChannel/this.workgroupSize)),i.end(),t.copyBufferToBuffer(this.chunkBuffer,0,this.chunkMapBuffer,0,this.chunkBufferSize),this.device.queue.submit([t.finish()]),await this.chunkMapBuffer.mapAsync(GPUMapMode.READ,0,this.chunkBufferSize);const n=new Float32Array(this.chunkNumSamples);n.set(new Float32Array(this.chunkMapBuffer.getMappedRange())),this.chunkMapBuffer.unmap();const s=this.audioContext.createBuffer(2,this.chunkNumSamplesPerChannel,this.audioContext.sampleRate),o=[];for(let r=0;r<2;++r)o.push(s.getChannelData(r));for(let r=0;r<s.length;++r)for(const[e,t]of o.entries())t[r]=n[2*r+e];const a=this.audioContext.createBufferSource();a.buffer=s,a.connect(this.audioContext.destination),0!==this.nextChunkOffset&&a.start(this.nextChunkOffset),this.nextChunkOffset+=a.buffer.duration,await this.createSoundChunk()}updateAudioParams(e,t,i){this.device.queue.writeBuffer(this.audioParamBuffer,0,new Float32Array([e,t,i]))}async stop(){this.timeoutId&&clearTimeout(this.timeoutId),this.audioContext&&await this.audioContext.suspend(),this.audioContext&&await this.audioContext.close()}}}}]);