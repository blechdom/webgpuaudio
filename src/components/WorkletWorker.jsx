import React, { useEffect } from 'react';
import {Leva, useControls, button} from 'leva';
import WorkletWorkerEngine from '../utils/WorkletWorkerEngine.ts';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import Head from '@docusaurus/Head';

export default function WorkletWorker() {
  return (
    <>
      <Head>
        {ExecutionEnvironment.canUseDOM && <script src="/coi-serviceworker.js"></script> }
      </Head>
      <WorkletWorkerAfterHead />
    </>
  );
}

function WorkletWorkerAfterHead() {

  const [playing, setPlaying] = React.useState(false);
  const [engine, setEngine] = React.useState(undefined);

  useEffect(() => {
    //console.log("coi-enabled", self.crossOriginIsolated);
    return () => {
      stopMakingSound();
    }
  }, []);

  useControls({
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
      setEngine(new WorkletWorkerEngine());
    }
  }

  async function stopMakingSound() {
    if (engine) {
      await engine.stop();
      setEngine(undefined);
    }
  }

  return (
    <>
      <ul>
        <li>Web Audio is heard after passing through AudioWorklet and a WebWorker.</li>
        <li>Next, the audio will be passed from the WebWorker to WebGPU and back again, before returning to the AudioWorklet and then to WebAudio.
        </li>
      </ul>

      <Leva flat oneLineLabels/>
    </>
  );
}