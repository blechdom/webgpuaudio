"use strict";(self.webpackChunkwebgpuaudio=self.webpackChunkwebgpuaudio||[]).push([[228],{5155:(t,e,s)=>{s.r(e),s.d(e,{assets:()=>w,contentTitle:()=>p,default:()=>S,frontMatter:()=>f,metadata:()=>W,toc:()=>k});var a=s(5893),r=s(1151),i=s(1262),o=s(7294);var n=s(1229),u=s(1077),h=s(8281);class l{States={READ:0,WRITE:1};constructor(t,e){void 0===e&&(e=1),this.states=new Uint32Array(new SharedArrayBuffer(Object.keys(this.States).length*Uint32Array.BYTES_PER_ELEMENT)),this.bufferLength=t+1,this.channelCount=e,this.channelData=[];for(let s=0;s<e;s++)this.channelData.push(new Float32Array(new SharedArrayBuffer(this.bufferLength*Float32Array.BYTES_PER_ELEMENT)))}static fromPointers(t){const e=new l(0,0),s=new Uint32Array(t.memory.buffer),a=new Float32Array(t.memory.buffer),r=s[t.bufferLengthPointer/4],i=s[t.channelCountPointer/4],o=s.subarray(s[t.statePointer/4]/4,s[t.statePointer/4]/4+2),n=[];for(let u=0;u<i;u++)n.push(a.subarray(s[s[t.channelDataPointer/4]/4+u]/4,s[s[t.channelDataPointer/4]/4+u]/4+r));return e.bufferLength=r,e.channelCount=i,e.states=o,e.channelData=n,e}push(t,e){Atomics.load(this.states,this.States.READ);const s=Atomics.load(this.states,this.States.WRITE);let a=s+e;if(this.bufferLength<a){a-=this.bufferLength;for(let e=0;e<this.channelCount;e++){const r=this.channelData[e].subarray(s),i=this.channelData[e].subarray(0,a);r.set(t[e].subarray(0,r.length)),i.set(t[e].subarray(r.length))}}else{for(let r=0;r<this.channelCount;r++)this.channelData[r].subarray(s,a).set(t[r].subarray(0,e));a===this.bufferLength&&(a=0)}return Atomics.store(this.states,this.States.WRITE,a),!0}pull(t,e){const s=Atomics.load(this.states,this.States.READ);Atomics.load(this.states,this.States.WRITE);let a=s+e;if(this.bufferLength<a){a-=this.bufferLength;for(let e=0;e<this.channelCount;e++){const r=this.channelData[e].subarray(s),i=this.channelData[e].subarray(0,a);t[e].set(r),t[e].set(i,r.length)}}else{for(let e=0;e<this.channelCount;++e)t[e].set(this.channelData[e].subarray(s,a));a===this.bufferLength&&(a=0)}return Atomics.store(this.states,this.States.READ,a),!0}getBufferLength(){return this.bufferLength-1}hasEnoughFramesFor(t){const e=Atomics.load(this.states,this.States.READ),s=Atomics.load(this.states,this.States.WRITE);return this._getAvailableRead(e,s)>=t}hasEnoughSpaceFor(t){const e=Atomics.load(this.states,this.States.READ),s=Atomics.load(this.states,this.States.WRITE);return this._getAvailableWrite(e,s)>=t}_getAvailableWrite(t,e){return e>=t?this.bufferLength-e+t-1:t-e-1}_getAvailableRead(t,e){return e>=t?e-t:e+this.bufferLength-t}_reset(){for(let t=0;t<this.channelCount;t++)this.channelData[t].fill(0);Atomics.store(this.states,this.States.READ,0),Atomics.store(this.states,this.States.WRITE,0)}printAvailableReadAndWrite(){const t=Atomics.load(this.states,this.States.READ),e=Atomics.load(this.states,this.States.WRITE);console.log(this,{availableRead:this._getAvailableRead(t,e),availableWrite:this._getAvailableWrite(t,e)})}}const c=l;var d=s(9094);class b{timeoutId=null;constructor(t,e){this.webGpuPassthroughWorker=new Worker(new URL(s.p+s.u(517),s.b),{type:void 0}),this.code=t,this.workgroupSize=e,this.init()}async init(){this.audioContext=new AudioContext,this.sampleRate=this.audioContext.sampleRate,this.inputQueue=await new c(d.Nu,1),this.outputQueue=await new c(d.Nu,1),this.atomicState=await new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)),await this.audioContext.audioWorklet.addModule(new URL(s(4458),s.b));const t=new OscillatorNode(this.audioContext),e={inputQueue:this.inputQueue,outputQueue:this.outputQueue,atomicState:this.atomicState},a=await new AudioWorkletNode(this.audioContext,"webgpu-processor",{processorOptions:e});t.connect(a).connect(this.audioContext.destination),t.start(),this.webGpuPassthroughWorker.postMessage({type:"init",data:{queueData:e,code:this.code,sampleRate:this.sampleRate,workgroupSize:this.workgroupSize}})}async stop(){this.audioContext&&(await this.audioContext.suspend(),await this.audioContext.close()),this.webGpuPassthroughWorker&&(await this.webGpuPassthroughWorker.terminate(),this.webGpuPassthroughWorker=void 0)}}s(412),s(5742);function g(){const t=[1,2,4,8,16,32,64,128,256],[e,s]=o.useState(!1),[r,i]=o.useState("override WORKGROUP_SIZE: u32 = 256;\n\n@group(0) @binding(0)\nvar<storage, read> input: array<f32>;\n\n@group(0) @binding(1)\nvar<storage, read_write> output: array<f32>;\n\n@compute @workgroup_size(WORKGROUP_SIZE)\nfn main(@builtin(global_invocation_id) global_id : vec3<u32>) {\n  output[global_id.x] = input[global_id.x] * 0.1;\n}"),[l,c]=o.useState(void 0);(0,o.useEffect)((()=>()=>{f()}),[]);const d=(0,o.useCallback)(((t,e)=>{console.log("val:",t),i(t)}),[]),{workgroupSize:g}=(0,h.M4)({workgroupSize:{options:t,value:t[8]},[e?"Stop Sound":"Play Sound"]:(0,h.LI)((()=>{s(!e)}))},[e]);async function f(){l&&(await l.stop(),c(void 0))}return(0,o.useEffect)((()=>{e?(console.log("playing"),async function(){void 0===l&&c(new b(r.toString(),g))}()):f()}),[e]),(0,o.useEffect)((()=>{e&&s(!1)}),[g]),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("ul",{children:[(0,a.jsx)("li",{children:"Web Audio is heard after passing through AudioWorklet, a WebWorker, and WebGPU."}),(0,a.jsx)("li",{children:"The code below in the live wgsl editor creates the audio data in the WebGPU compute shader."})]}),(0,a.jsx)(h.Zf,{flat:!0,oneLineLabels:!0}),(0,a.jsx)(n.ZP,{value:r,width:"90%",height:"400px",extensions:[(0,u.i)()],onChange:d})]})}const f={title:"AudioWorklet WebWorker WebGPU Passthrough",sidebar_position:3},p=void 0,W={id:"webWorker/workletWorkerWebGpuPassthrough",title:"AudioWorklet WebWorker WebGPU Passthrough",description:"",source:"@site/docs/webWorker/workletWorkerWebGpuPassthrough.mdx",sourceDirName:"webWorker",slug:"/webWorker/workletWorkerWebGpuPassthrough",permalink:"/docs/webWorker/workletWorkerWebGpuPassthrough",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:3,frontMatter:{title:"AudioWorklet WebWorker WebGPU Passthrough",sidebar_position:3},sidebar:"tutorialSidebar",previous:{title:"AudioWorklet WebWorker Passthrough",permalink:"/docs/webWorker/workletWorkerPassthrough"},next:{title:"WebAudio Oscillators",permalink:"/docs/webAudioOscillators"}},w={},k=[],A=function(){const t={div:"div",...(0,r.a)()};return(0,a.jsx)(i.Z,{fallback:(0,a.jsx)(t.div,{children:"Loading..."}),children:()=>(0,a.jsx)(g,{})})};function m(t){return(0,a.jsx)(a.Fragment,{})}function S(t={}){return(0,a.jsx)(A,{...t,children:(0,a.jsx)(m,{...t})})}},1262:(t,e,s)=>{s.d(e,{Z:()=>i});s(7294);var a=s(2389),r=s(5893);function i(t){let{children:e,fallback:s}=t;return(0,a.Z)()?(0,r.jsx)(r.Fragment,{children:e?.()}):s??null}},9094:(t,e,s)=>{s.d(e,{Nu:()=>a});const a=4096},4458:(t,e,s)=>{t.exports=s.p+"f7e3b192dc366965.js"}}]);