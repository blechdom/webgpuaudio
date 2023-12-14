"use strict";(self.webpackChunkwebgpuaudio=self.webpackChunkwebgpuaudio||[]).push([[414],{1181:(n,e,t)=>{t.r(e),t.d(e,{assets:()=>r,contentTitle:()=>i,default:()=>p,frontMatter:()=>l,metadata:()=>s,toc:()=>u});var a=t(5893),o=t(1151);const l={title:"WebGPU Audio Live Coding Example"},i=void 0,s={type:"mdx",permalink:"/webgpuaudio/markdown-page",source:"@site/src/pages/markdown-page.md",title:"WebGPU Audio Live Coding Example",frontMatter:{title:"WebGPU Audio Live Coding Example"},unlisted:!1},r={},u=[];function c(n){const e={code:"code",pre:"pre",...(0,o.a)(),...n.components};return(0,a.jsx)(e.pre,{children:(0,a.jsx)(e.code,{className:"language-jsx",metastring:"live",live:!0,children:'\nfunction WebAudioOscillators(props) {\n  const [playing, setPlaying] = useState(false);\n  const [oscillator, setOscillator] = useState(null);\n\n  const audioData = useControls({\n    volume: {\n      value: 0.0,\n      min: 0.0,\n      max: 1.0,\n      step: 0.01,\n    },\n    frequency: {\n      value: 300,\n      min: 0.0,\n      max: 2000.0,\n      step: 0.01,\n    },\n    waveForm: { options: ["sine", "triangle", "square"] },\n    [playing ? "Stop Sound" : "Play Sound"]: button(() => setPlaying(!playing))\n  }, [playing]);\n  \n  useEffect(() => {\n    if (playing) {\n      setOscillator(new WebAudioOscillator());\n    } else if (oscillator) {\n      oscillator.stop();\n      setOscillator(null);\n    }\n  }, [playing])\n  \n  useEffect(() => {\n    if (oscillator) {\n      oscillator.setVolume(audioData.volume);\n      oscillator.setFrequency(audioData.frequency);\n      oscillator.setWaveForm(audioData.waveForm);\n    }\n  }, [audioData, oscillator])\n}\n'})})}function p(n={}){const{wrapper:e}={...(0,o.a)(),...n.components};return e?(0,a.jsx)(e,{...n,children:(0,a.jsx)(c,{...n})}):c(n)}}}]);