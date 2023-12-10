import React from 'react';
import { useControls, button } from 'leva'
import WebAudioOscillator from '../../utils/WebAudioOscillator';
import "./react-dat-gui.css";
const ReactLiveScope = {
  React,
  ...React,
  useControls,
  button,
  WebAudioOscillator
};
export default ReactLiveScope;


