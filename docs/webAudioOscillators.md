---
title: WebAudio Oscillators
sidebar_position: 5
---

import CodeBlock from '@theme/CodeBlock';
import WebAudioOscillatorJs from '!!raw-loader!../src/utils/WebAudioOscillator.js';

# WebAudio Oscillators
## Live Code Example
Oscillators Audio Example using WebAudio API only, no WebGPU.

```jsx live

function WebAudioOscillators() {
  const [playing, setPlaying] = useState(false);
  const [oscillator, setOscillator] = useState(null);
  const [freq, setFreq] = useState(440);

  const { volume, frequency, waveForm } = useControls({
    waveForm: {options: ["sine", "triangle", "square", "sawtooth"]},
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
      step: 0.01,
    },
    [playing ? "Stop Sound" : "Play Sound"]: button(() => {
      setPlaying(!playing)
    }, {order: -2})
  }, [playing, freq]);
  
  useEffect(() => {
    if (playing) {
      setOscillator(new WebAudioOscillator()); // see class code below
    } else if (oscillator) {
      oscillator.stop();
      setOscillator(null);
    }
  }, [playing])

  useEffect(() => {
    if (oscillator) {
      oscillator.setVolume(volume);
      oscillator.setFrequency(freq);
      oscillator.setWaveForm(waveForm);
    }
  }, [volume, freq, waveForm, oscillator])
  
  return (
    <Leva fill flat oneLineLabels />
  )
}
```

<CodeBlock language="js">{WebAudioOscillatorJs}</CodeBlock>