---
title: Leva Live Coding Example
---

import DatGui, {DatFolder, DatNumber, DatSelect} from "react-dat-gui";

```jsx live
function WebAudioOscillators(props) {
  const [playing, setPlaying] = useState(false);
  const [audioData, setAudioData] = useState({
    volume: 0,
    frequency: 220.0,
    waveForm: "sine"
  });
  const [oscillator, setOscillator] = useState(null);

  const audioPlay = () => {
    setPlaying(!playing);
  };
  
  useEffect(() => {
    if (playing) {
      setOscillator(new WebAudioOscillator());
    } else if (oscillator) {
      oscillator.stop();
      setOscillator(null);
    }
  }, [playing])
  
  useEffect(() => {
    updateAudio();
  }, [audioData, oscillator])
  
  function updateAudio() {
    if (oscillator) {
      oscillator.setVolume(audioData.volume);
      oscillator.setFrequency(audioData.frequency);
      oscillator.setWaveForm(audioData.waveForm);
    }
  }
  
  return (
    <div>
      <DatGui style={{top: '120px'}} data={audioData} onUpdate={(newData) => setAudioData(newData)}>
        <DatFolder title="WebAudio API Oscillators" closed={false}>
          <DatNumber path='volume' label='volume' min={0} max={1.0} step={0.01}/>
          <DatNumber path='frequency' label='frequency' min={20} max={6000} step={0.01}/>
          <DatSelect path='waveForm' label='waveform' options={["sine", "triangle", "square"]}/>
          <DatButton label={playing ? "Stop Sound" : "Play Sound"} onClick={audioPlay}/>
        </DatFolder>
      </DatGui>
    </div>
  );
}
```
