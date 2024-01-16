import React, { useCallback, useEffect, useState } from 'react';
import inputAmplitudeModulatorShader from '!!raw-loader!../shaders/inputTremolo.wgsl';
import CodeMirror from '@uiw/react-codemirror';
import {wgsl} from "@iizukak/codemirror-lang-wgsl";
import {Leva, useControls, button} from 'leva';
import WebGpuMicrophoneProcessorEngine from '../utils/WebGpuMicrophoneProcessorEngine';

export default function WebGpuMicrophoneProcessor() {
  const workgroupSizes = [1, 2, 4, 8, 16, 32, 64, 128, 256];
  const [playing, setPlaying] = useState(false);
  const [code, setCode] = useState(inputAmplitudeModulatorShader);
  const [engine, setEngine] = useState(undefined);
  const [freq, setFreq] = useState(1.0);
  const [lastFreq, setLastFreq] = useState(1.0);

  useEffect(() => {
    return () => {
      stopMakingSound();
    }
  }, []);

  const onChange = useCallback((val) => {
    setCode(val);
  }, []);

  const { inputGain, volume, workgroupSize } = useControls({
    inputGain: {
      value: 1,
      min: 0.0,
      max: 10.0,
      step: 0.01
    },
    modulatorFreq: {
      value: 26.165,
      min: 0,
      max: 100,
      step: 0.001,
      onChange: (v) => {
        const minIn = 0;
        const maxIn = 100;
        const minOut = Math.log(0.25);
        const maxOut = Math.log(100);
        const scale = (maxOut - minOut) / (maxIn - minIn);
        setLastFreq(freq);
        setFreq(Math.exp(minOut + scale * (v - minIn)));
      },
    },
    string: {value: 'LFO Hz', label: freq.toFixed(4), editable: false},
    volume: {
      value: 0,
      min: 0.0,
      max: 1.0,
      step: 0.01
    },
    workgroupSize: {options: workgroupSizes, value: workgroupSizes[2]},
    [playing ? "Stop Sound" : "Play Sound"]: button(() => {
      setPlaying(!playing)
    }),
  }, [playing, freq]);

  useEffect(() => {
    if (playing) {
      startMakingSound();
    } else {
      stopMakingSound();
    }
  }, [playing]);

  async function startMakingSound() {
    if (engine === undefined) {
      setEngine(new WebGpuMicrophoneProcessorEngine(code.toString(), workgroupSize));
    }
  }

  async function stopMakingSound() {
    if (engine) {
      await engine.stop();
      setEngine(undefined);
    }
  }

  useEffect(() => {
    if (playing) setPlaying(false);
  }, [workgroupSize, code]);

  useEffect(() => {
    if (engine && engine.updateAudioParams) {
      engine.updateAudioParams(lastFreq, freq, volume);
    }
  }, [engine, freq, volume]);

  useEffect(() => {
    if (engine && engine.updateInputGain) {
      engine.updateInputGain(parseFloat(inputGain));
    }
  }, [inputGain]);

  return (
    <>
      <ul>
        <li>The modulated microphone input is heard after passing through a WebWorker, an AudioWorklet, and WebGPU.</li>
        <li>Check out what GPU you are running on the home page <a href={"https://www.webgpusound.com"}>webgpusound.com</a></li>
        <li>TODO: debug the zippering glitches that occur when resizing the window.</li>
        <li>The code below in the live wgsl editor creates the audio data in the WebGPU compute shader.</li>
      </ul>

      <Leva flat oneLineLabels/>
      <CodeMirror value={code.toString()} width="90%" height="400px" extensions={[wgsl()]} onChange={onChange}/>
    </>
  );
}