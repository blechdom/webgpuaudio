import React, { useCallback, useEffect, useState } from 'react';
import smoothControlInputsShader from '!!raw-loader!../shaders/smoothControlInputs.wgsl';
import CodeMirror from '@uiw/react-codemirror';
import {wgsl} from "@iizukak/codemirror-lang-wgsl";
import {Leva, useControls} from 'leva';
//import SmoothControlInputsEngine from '../utils/SmoothControlInputsEngine';

export default function SmoothControlInputs() {
  /*const workgroupSizes = [1, 2, 4, 8, 16, 32, 64, 128, 256];
  const [code, setCode] = useState(smoothControlInputsShader);
  const [engine, setEngine] = useState(undefined);
  const [value, setValue] = useState(1.0);
  const [lastValue, setLastValue] = useState(1.0);

  useEffect(() => {
    return () => {
      stopMakingSound();
    }
  }, []);

  const onChange = useCallback((val) => {
    setCode(val);
  }, []);

  const { workgroupSize } = useControls({
    value: {
      value: 0.,
      min: 0.,
      max: 100.,
      step: 0.001,
      onChange: (v) => {
        setLastValue(value);
        setValue(v);
      },
    },
    workgroupSize: {options: workgroupSizes, value: workgroupSizes[2]},
    [playing ? "Stop Sound" : "Play Sound"]: button(() => {
      setPlaying(!playing)
    }),
  }, [playing, value]);

  useEffect(() => {
    if (playing) {
      startMakingSound();
    } else {
      stopMakingSound();
    }
  }, [playing]);

  async function startMakingSound() {
    if (engine === undefined) {
      setEngine(new SmoothControlInputsEngine(code.toString(), workgroupSize));
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
    if (engine && engine.updateParams) {
      engine.updateParams(value);
    }
  }, [engine, value]);

  return (
    <>
      <ul>
        <li>An Amplitude Modulated Sine Wave is heard after passing through a WebWorker, an AudioWorklet, and WebGPU.</li>
        <li>Check out what GPU you are running on the home page <a href={"https://www.webgpusound.com"}>webgpusound.com</a></li>
        <li>TODO: debug the zippering glitches that occur when resizing the window.</li>
        <li>The code below in the live wgsl editor creates the audio data in the WebGPU compute shader.</li>
      </ul>

      <Leva flat oneLineLabels/>
      <CodeMirror value={code.toString()} width="90%" height="400px" extensions={[wgsl()]} onChange={onChange}/>
    </>
  );*/
}