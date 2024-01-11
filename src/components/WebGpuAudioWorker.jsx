import GPUWorker from 'worker-loader!../../src/workers/webGpuAudio.worker.js';
import React, {useCallback, useEffect} from 'react';
import sineShader from '!!raw-loader!../../src/shaders/sine.wgsl';
import triangleShader from '!!raw-loader!../../src/shaders/triangle.wgsl';
import squareShader from '!!raw-loader!../../src/shaders/square.wgsl';
import sawtoothShader from '!!raw-loader!../../src/shaders/sawtooth.wgsl';
import globalIdXShader from '!!raw-loader!../../src/shaders/globalIdX.wgsl';
import timeShader from '!!raw-loader!../../src/shaders/time.wgsl';
import CodeMirror from '@uiw/react-codemirror';
import {wgsl} from "@iizukak/codemirror-lang-wgsl";
import {Leva, useControls, button} from 'leva';
import WebGpuAudioWorkerEngine from '../../src/utils/WebGpuAudioWorkerEngine.ts';

export default function WebGpuAudioWorker() {
  const shaders = ["sine", "triangle", "square", "sawtooth", "globalIdX", "time"];
  const workgroupSizes = [1, 2, 4, 8, 16, 32, 64, 128, 256];
  const [playing, setPlaying] = React.useState(false);
  const [code, setCode] = React.useState(sineShader);
  const [engine, setEngine] = React.useState(undefined);
  const [gpuWorker, setGpuWorker] = React.useState(undefined);
  const [chunkData, setChunkData] = React.useState([]);


  useEffect(() => {
    return () => {a
      stopMakingSound();
    }
  }, []);

  const onChange = useCallback((val, viewUpdate) => {
    console.log('val:', val);
    setCode(val);
  }, []);

  const {chunkDurationInSeconds, workgroupSize, loadShader} = useControls({
    loadShader: {options: shaders},
    chunkDurationInSeconds: {
      value: 2,
      min: 0.03,
      max: 4.0,
      step: 0.01
    },
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
      const engineInit = new WebGpuAudioWorkerEngine(chunkDurationInSeconds);
      setEngine(engineInit);
    }
  }

  useEffect(() => {
    if (engine && gpuWorker) {
      const sampleRate = engine.sampleRate;
      try {
        gpuWorker.postMessage({type: 'run', chunkDurationInSeconds, code, workgroupSize, sampleRate});
      } catch (err) {
        console.warn(err.message);
        gpuWorker.terminate();
      }
    }
  }, [engine, gpuWorker, chunkDurationInSeconds, workgroupSize, code])

  useEffect(() => {
    if (engine && gpuWorker) {
      renderAudio();
    }

    async function renderAudio() {
      await engine.renderAudioChunk(chunkData);
    }
  }, [chunkData]);


  async function stopMakingSound() {
    if (engine) {
      await engine.stop();
      setEngine(undefined);
    }
    if (gpuWorker) {
      gpuWorker.terminate();
      setGpuWorker(undefined);
    }
  }

  useEffect(() => {
    if (playing) setPlaying(false);
  }, [chunkDurationInSeconds, workgroupSize, code])

  useEffect(() => {
    console.log("shader", loadShader);
    switch (loadShader) {
      case "sine":
        setCode(sineShader);
        break;
      case "triangle":
        setCode(triangleShader);
        break;
      case "square":
        setCode(squareShader);
        break;
      case "sawtooth":
        setCode(sawtoothShader);
        break;
      case "globalIdX":
        setCode(globalIdXShader);
        break;
      case "time":
        setCode(timeShader);
        break;
      default:
        setCode(sineShader);
    }
  }, [loadShader]);

  useEffect(() => {
    if (engine && gpuWorker === undefined) {
      workerInit(engine);
    }
  }, [engine])

  async function workerInit(engine) {
    const worker = new GPUWorker({type: "module"});
    setGpuWorker(worker);
    worker.addEventListener('message', async (ev) => {
      switch (ev.data.type) {
        case 'chunk': {
          setChunkData(ev.data.chunkData);
          break;
        }
      }
    });
  }

  return (
    <>
      <ul>
        <li>Audio Synthesis out of WebGPU, but this time in a WebWorker, and without streaming.</li>
        <li>Chunks of audio are generated in the Worker and then sent to the main thread to be process by the
          WebAudioAPI
        </li>
        <li>Select different shaders in the Leva control panel to hear different sounds.</li>
        <li>When changing WebGPU Parameters, the sound will stop and will need to be restarted.</li>
        <li>Some of the sounds reveal the underlying architecture of the WebGPU shader, such a s the `globalIdX` and
          `time`
          shaders.
        </li>
        <li>Fully refresh the page if things get strange.</li>
        <li>The code below in the live wgsl editor creates the audio data in the WebGPU compute shader.</li>
      </ul>

      <Leva flat oneLineLabels/>
      <CodeMirror value={code} width="90%" height="400px" extensions={[wgsl()]} onChange={onChange}/>
    </>
  );
}