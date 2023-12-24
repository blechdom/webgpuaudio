import FreeQueue from "/scripts/free-queue.js";
import { FRAME_SIZE } from "/scripts/constants.js";

self.addEventListener('message', async(ev) => {
  switch (ev.data.type) {
    case 'init': {
      let {inputQueue, outputQueue, atomicState} = ev.data.data;
      Object.setPrototypeOf(inputQueue, FreeQueue.prototype);
      Object.setPrototypeOf(outputQueue, FreeQueue.prototype);

      // buffer for storing data pulled out from queue.
      const input = new Float32Array(FRAME_SIZE);
      // loop for processing data.
      while (Atomics.wait(atomicState, 0, 0) === 'ok') {
        // pull data out from inputQueue.
        const didPull = inputQueue.pull([input], FRAME_SIZE);

        if (didPull) {
          const output = input.map(sample => 0.1 * sample);
          outputQueue.push([output], FRAME_SIZE);
        }

        Atomics.store(atomicState, 0, 0);
      }
    }
  }
});
