importScripts("/workers/free-queue.js");
importScripts("/workers/constants.js");

self.addEventListener('message', async(ev) => {
  switch (ev.data.type) {
    case 'init': {
      let {inputQueue, outputQueue, atomicState} = ev.data.data;
      Object.setPrototypeOf(inputQueue, FreeQueue.prototype);
      Object.setPrototypeOf(outputQueue, FreeQueue.prototype);

      const input = new Float32Array(FRAME_SIZE);
      while (Atomics.wait(atomicState, 0, 0) === 'ok') {
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
