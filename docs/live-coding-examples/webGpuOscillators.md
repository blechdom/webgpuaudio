---
title: WebGPU Oscillators
---

import CodeBlock from '@theme/CodeBlock';
import WebGpuAudioEngineTs from '!!raw-loader!../../src/utils/WebGpuAudioEngine.ts';
import useDeviceTs from '!!raw-loader!../../src/hooks/useDevice.ts';

# WebGPU Oscillators
## Live Code Example

* This example requires <a href="chrome://flags/#enable-webgpu-developer-features">chrome://flags/#enable-webgpu-developer-features</a> flag to be enabled
* For typescript, webGPU types are available by installing: `npm i @webgpu/types` or `yarn add @webgpu/types`

```tsx live
import {setDefaultAutoSelectFamily, setDefaultAutoSelectFamilyAttemptTimeout} from "net";
import {jettwaveDark} from "prism-react-renderer";

function WebGpuOscillators() {

  const compute = `
    override WORKGROUP_SIZE: u32 = 256;
    override SAMPLING_RATE: f32 = 44100.0;
    const PI2: f32 = 6.283185307179586476925286766559;
    
    struct TimeInfo {
        offset: f32,
    }
    
    struct AudioParam {
      frequency: f32,
      gain: f32,
      waveForm: f32
    }
    
    @binding(0) @group(0) var<uniform> time_info: TimeInfo;
    @binding(1) @group(0) var<storage, read_write> sound_chunk: array<vec2<f32>>; // 2 channel pcm data
    @binding(2) @group(0) var<storage, read> audio_param: AudioParam;
    
    @compute
    @workgroup_size(WORKGROUP_SIZE)
    fn synthesize(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let sampleVec = global_id.x;
    
        if (sampleVec >= arrayLength(&sound_chunk)) {
            return;
        }
    
        let t = f32(sampleVec) / SAMPLING_RATE;
    
        sound_chunk[sampleVec] = oscillator(time_info.offset + t, audio_param);
    }
    
    fn oscillator(time: f32, audio_param: AudioParam) -> vec2<f32> {
        var v: f32 = sin(time * audio_param.frequency * PI2);
        if (audio_param.waveForm == 1) {
           // v = -(abs((time * audio_param.frequency%1.)-.5)-.25)*4.;
        } else if (audio_param.waveForm == 2) {
            v = step(fract(time * audio_param.frequency),0.5)*2.0-1.0;
        } else if (audio_param.waveForm == 3) {
            v = 1.0 - 2.0*fract(time * audio_param.frequency);
        }
        return vec2(v * audio_param.gain);
    }
`;
  const waveForms = ["sine", "triangle", "square", "sawtooth"];
  const numChannels = 2;
  const workgroupSize = 256;
  const chunkDurationInSeconds = .01;
  const maxBufferedChunks = 2;
  const [audioContext, setAudioContext] = useState<AudioContext | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [engine, setEngine] = useState<any>();
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [freq, setFreq] = useState(440);
  const {device} = useDevice();

  const {volume, frequency, waveForm} = useControls({
    waveForm: {options: waveForms},
    frequency: {
      value: 60,
      min: 0,
      max: 100,
      step: 0.0001,
      onChange: (v) => {
        const minIn = 0;
        const maxIn = 100;
        const minOut = Math.log(40);
        const maxOut = Math.log(3000);
        const scale = (maxOut - minOut) / (maxIn - minIn);
        setFreq(Math.exp(minOut + scale * (v - minIn)));
      },
    },
    string: {value: 'Hz', label: freq.toFixed(3), editable: false},
    volume: {
      value: 0.15,
      min: 0.0,
      max: 1.0,
      step: 0.01
    },
    [playing ? "Stop Sound" : "Play Sound"]: button(() => {
      setPlaying(!playing)
    }, {order: -2})
  }, [playing, freq]);

  useEffect(() => {
    if (playing) {
      setAudioContext(new AudioContext());
    } else {
      stopMakingSound();
    }

    async function stopMakingSound() {
      if (audioContext) await audioContext.suspend();
      if (audioContext) await audioContext.close();
      if (timeoutId) clearTimeout(timeoutId);
      setTimeoutId(null);
      setAudioContext(undefined);
      setEngine(undefined);
    }
  }, [playing]);
  
  useEffect(() => {
    async function startMakingSound() {
      if (engine === undefined) {
        setEngine(new WebGpuAudioEngine(
          2,
          audioContext.sampleRate,
          workgroupSize,
          chunkDurationInSeconds,
          device,
          compute,
          'synthesize',
          3,
        ));
        //setStartTime(performance.now() / 1000.0);
        //setNextChunkOffset(0);
      }
    }
    if(audioContext) {
      startMakingSound();
    }
  }, [audioContext]);

  useEffect(() => {
    if (engine) {
      playSound();
    }

    async function playSound() {
      const startTime = performance.now() / 1000.0;
      let nextChunkOffset = 0.0;

      async function createSongChunk() {
        const bufferedSeconds = (startTime + nextChunkOffset) - (performance.now() / 1000.0);
        const numBufferedChunks = Math.floor(bufferedSeconds / chunkDurationInSeconds);
        if (numBufferedChunks > maxBufferedChunks) {
          const timeout = chunkDurationInSeconds * 0.9;
          setTimeoutId(setTimeout(createSongChunk, timeout * 1000.0));
          return;
        }

        device.queue.writeBuffer(engine.timeInfoBuffer, 0, new Float32Array([nextChunkOffset]));

        const commandEncoder = device.createCommandEncoder();

        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(engine.pipeline);
        pass.setBindGroup(0, engine.bindGroup);
        pass.dispatchWorkgroups(
          Math.ceil(engine.chunkNumSamplesPerChannel / workgroupSize)
        );
        pass.end();

        commandEncoder.copyBufferToBuffer(engine.chunkBuffer, 0, engine.chunkMapBuffer, 0, engine.chunkBufferSize);

        device.queue.submit([commandEncoder.finish()]);

        await engine.chunkMapBuffer.mapAsync(GPUMapMode.READ, 0, engine.chunkBufferSize);

        const chunkData = new Float32Array(engine.chunkNumSamples);
        chunkData.set(new Float32Array(engine.chunkMapBuffer.getMappedRange()));
        engine.chunkMapBuffer.unmap();

        const audioBuffer = audioContext.createBuffer(
          numChannels,
          engine.chunkNumSamplesPerChannel,
          audioContext.sampleRate
        );

        const channels = [];
        for (let i = 0; i < numChannels; ++i) {
          channels.push(audioBuffer.getChannelData(i));
        }

        for (let i = 0; i < audioBuffer.length; ++i) {
          for (const [offset, channel] of channels.entries()) {
            channel[i] = chunkData[i * numChannels + offset];
          }
        }

        const audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.connect(audioContext.destination);

        audioSource.start(nextChunkOffset);

        nextChunkOffset += audioSource.buffer.duration;
        if (playing) await createSongChunk();
      }

      if (playing) createSongChunk();
    }
  }, [engine])

  

  useEffect(() => {
    if (!engine || !device) return;
    let waveFormNum = waveForms.indexOf(waveForm);
    device.queue.writeBuffer(engine.audioParamBuffer, 0, new Float32Array([freq, volume, waveFormNum]));
  }, [device, engine, freq, volume, waveForm]);


  return (
    <Leva fill flat oneLineLabels/>
  )
}
```
## WebGPU Audio Engine Class

<CodeBlock language="ts">{WebGpuAudioEngineTs}</CodeBlock>

## useDevice Hook

<CodeBlock language="ts">{useDeviceTs}</CodeBlock>