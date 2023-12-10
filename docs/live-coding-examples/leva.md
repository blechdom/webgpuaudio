---
title: WebGPU Audio Live Code
---

```jsx live

function WebAudioOscillators(props) {
  const [playing, setPlaying] = useState(false);
  const [oscillator, setOscillator] = useState(null);

  const audioData = useControls({
    volume: {
      value: 0.0,
      min: 0.0,
      max: 1.0,
      step: 0.01,
    },
    frequency: {
      value: 300,
      min: 0.0,
      max: 2000.0,
      step: 0.01,
    },
    waveForm: {options: ["sine", "triangle", "square"]},
    [playing ? "Stop Sound" : "Play Sound"]: button(() => setPlaying(!playing))
  }, [playing]);

  useEffect(() => {
    if (playing) {
      setOscillator(new WebAudioOscillator());
    } else if (oscillator) {
      oscillator.stop();
      setOscillator(null);
    }
  }, [playing])

  useEffect(() => {
    if (oscillator) {
      oscillator.setVolume(audioData.volume);
      oscillator.setFrequency(audioData.frequency);
      oscillator.setWaveForm(audioData.waveForm);
    }
  }, [audioData, oscillator])
}
```
