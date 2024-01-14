import React, { useEffect } from 'react';
import {Leva, useControls, button} from 'leva';
import WorkletWorkerEngine from '../utils/WorkletWorkerEngine.ts';

export default function WorkletWorker() {
  const [playing, setPlaying] = React.useState(false);
  const [engine, setEngine] = React.useState(undefined);

  useEffect(() => {
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
        <li>Web Audio is heard after passing through a WebWorker and AudioWorklet using Free-Queue.</li>
      </ul>

      <Leva flat oneLineLabels/>
    </>
  );
}