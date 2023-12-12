import React from 'react';
import { Leva, useControls, button } from 'leva'
import WebAudioOscillator from '../../utils/WebAudioOscillator';
import WebGpuAudioEngine from '../../utils/WebGpuAudioEngine';
import useDevice from "../../hooks/useDevice";
import "./react-dat-gui.css";

const ReactLiveScope = {
  React,
  ...React,
  Leva,
  useControls,
  useDevice,
  button,
  WebAudioOscillator,
  WebGpuAudioEngine,
};
export default ReactLiveScope;


