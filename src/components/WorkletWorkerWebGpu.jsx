import React, { useCallback, useEffect } from 'react';
import passthroughShader from '!!raw-loader!../shaders/passthrough.wgsl';
import CodeMirror from '@uiw/react-codemirror';
import {wgsl} from "@iizukak/codemirror-lang-wgsl";
import {Leva, useControls, button} from 'leva';
import WorkletWorkerWebGpuEngine from '../utils/WorkletWorkerWebGpuEngine.ts';

export default function WorkletWorkerWebGpu() {
  const workgroupSizes = [1, 2, 4, 8, 16, 32, 64, 128, 256];
  const [playing, setPlaying] = React.useState(false);
  const [code, setCode] = React.useState(passthroughShader);
  const [engine, setEngine] = React.useState(undefined);

  useEffect(() => {
    return () => {
      stopMakingSound();
    }
  }, []);

  const onChange = useCallback((val) => {
    setCode(val);
  }, []);

  const { workgroupSize } = useControls({
    workgroupSize: {options: workgroupSizes, value: workgroupSizes[2]},
    [playing ? "Stop Sound" : "Play Sound"]: button(() => {
      setPlaying(!playing)
    }),
  }, [playing]);

  useEffect(() => {
    if (playing) {
      console.log("playing")
      startMakingSound();
    } else {
      stopMakingSound();
    }
  }, [playing]);

  async function startMakingSound() {
    if (engine === undefined) {
      setEngine(new WorkletWorkerWebGpuEngine(code.toString(), workgroupSize));
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
  }, [workgroupSize])

  return (
    <>
      <ul>
        <li>Web Audio is heard after passing through a WebWorker, an AudioWorklet, and WebGPU.</li>
        <li>Check out what GPU you are running on the home page <a href={"https://www.webgpusound.com"}>webgpusound.com</a></li>
        <li>The code below in the live wgsl editor creates the audio data in the WebGPU compute shader.</li>
      </ul>

      <Leva flat oneLineLabels/>
      <CodeMirror value={code.toString()} width="90%" height="400px" extensions={[wgsl()]} onChange={onChange}/>
    </>
  );
}