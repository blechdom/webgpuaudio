import React, { useCallback, useEffect } from 'react';
import passthroughShader from '!!raw-loader!../../src/shaders/passthrough.wgsl';
import CodeMirror from '@uiw/react-codemirror';
import {wgsl} from "@iizukak/codemirror-lang-wgsl";
import {Leva, useControls, button} from 'leva';
import WorkletWorkerWebGpuEngine from '../../src/utils/WorkletWorkerWebGpuEngine.ts';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import Head from '@docusaurus/Head';

export default function WorkletWorkerWebGpu() {
  return (
    <>
      <Head>
        {ExecutionEnvironment.canUseDOM && <script src="/coi-serviceworker.js"></script>}
      </Head>
      <WorkletWorkerWebGpuAfterHead />
    </>
  );
}
function WorkletWorkerWebGpuAfterHead() {
  const workgroupSizes = [1, 2, 4, 8, 16, 32, 64, 128, 256];
  const [playing, setPlaying] = React.useState(false);
  const [code, setCode] = React.useState(passthroughShader);
  const [engine, setEngine] = React.useState(undefined);

  useEffect(() => {
    return () => {
      stopMakingSound();
    }
  }, []);

  const onChange = useCallback((val, viewUpdate) => {
    console.log('val:', val);
    setCode(val);
  }, []);

  const { workgroupSize } = useControls({
    workgroupSize: {options: workgroupSizes, value: workgroupSizes[8]},
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
        <li>Web Audio is heard after passing through AudioWorklet, a WebWorker, and WebGPU.</li>
        <li>The code below in the live wgsl editor creates the audio data in the WebGPU compute shader.</li>
      </ul>

      <Leva flat oneLineLabels/>
      <CodeMirror value={code} width="90%" height="400px" extensions={[wgsl()]} onChange={onChange}/>
    </>
  );
}