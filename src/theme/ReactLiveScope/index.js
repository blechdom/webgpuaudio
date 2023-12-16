import React from 'react';
import { Leva, useControls, button } from 'leva'
import WebAudioOscillator from '../../utils/WebAudioOscillator';
import WebGpuAudioEngine from '../../utils/WebGpuAudioEngine';

const ReactLiveScope = {
  React,
  ...React,
  Leva,
  useControls,
  button,
  WebAudioOscillator,
  WebGpuAudioEngine,
};
export default ReactLiveScope;


