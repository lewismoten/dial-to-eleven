import { elevenSettings } from './audio-settings.js';

const fileInput = document.querySelector('#audio-file');
const fileName = document.querySelector('#file-name');
const knob = document.querySelector('#eleven-knob');
const readout = document.querySelector('#knob-readout');
const modeReadout = document.querySelector('#mode-readout');
const playButton = document.querySelector('#play-button');
const stopButton = document.querySelector('#stop-button');

let audioContext;
let source;
let sourceNode;
let objectUrl;
let gain;
let filter;
let compressor;
let shaper;
let master;
let loaded = false;

function makeDistortionCurve(drive) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const amount = drive || 0;
  for (let index = 0; index < samples; index += 1) {
    const x = (index * 2) / samples - 1;
    curve[index] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function initializeRack() {
  if (audioContext) return;
  audioContext = new AudioContext();
  gain = audioContext.createGain();
  filter = audioContext.createBiquadFilter();
  compressor = audioContext.createDynamicsCompressor();
  shaper = audioContext.createWaveShaper();
  master = audioContext.createGain();

  filter.type = 'peaking';
  filter.frequency.value = 2600;
  filter.Q.value = 0.9;
  shaper.oversample = '4x';
  compressor.attack.value = 0.003;
  compressor.release.value = 0.15;
  compressor.knee.value = 0;

  gain.connect(filter).connect(compressor).connect(shaper).connect(master).connect(audioContext.destination);
  applyEleven(Number(knob.value));
}

function applyEleven(level) {
  const settings = elevenSettings(level);
  if (!audioContext) return;
  gain.gain.setTargetAtTime(10 ** (settings.preGainDb / 20), audioContext.currentTime, 0.015);
  filter.gain.setTargetAtTime(settings.presenceDb, audioContext.currentTime, 0.015);
  compressor.threshold.setTargetAtTime(settings.compressorThresholdDb, audioContext.currentTime, 0.015);
  compressor.ratio.setTargetAtTime(settings.compressorRatio, audioContext.currentTime, 0.015);
  shaper.curve = makeDistortionCurve(settings.drive);
  master.gain.setTargetAtTime(settings.outputGain, audioContext.currentTime, 0.015);
}

function updatePanel() {
  const level = Number(knob.value);
  readout.textContent = level;
  const modes = ['Civilized-ish', 'A little impolite', 'Getting cheeky', 'Polite warning ignored', 'Amp warming up', 'Clearly deliberate', 'Crunch with intent', 'Walls becoming optional', 'The neighbors know', 'Questionable decisions', 'The room is smaller now', 'ELEVEN'];
  modeReadout.textContent = modes[level];
  applyEleven(level);
}

function stopPlayback() {
  if (source) {
    source.pause();
    source.currentTime = 0;
  }
  playButton.textContent = 'Play it loud';
}

fileInput.addEventListener('change', () => {
  const [file] = fileInput.files;
  stopPlayback();
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = undefined;
  }
  if (objectUrl) URL.revokeObjectURL(objectUrl);

  if (!file) {
    loaded = false;
    fileName.textContent = 'No file. No glory.';
    playButton.disabled = true;
    stopButton.disabled = true;
    return;
  }

  objectUrl = URL.createObjectURL(file);
  source = new Audio(objectUrl);
  source.addEventListener('ended', () => { playButton.textContent = 'Play it loud'; });
  source.addEventListener('error', () => { fileName.textContent = 'That file would not cooperate. Try another audio format.'; });
  loaded = true;
  fileName.textContent = `${file.name} is standing by.`;
  playButton.disabled = false;
  stopButton.disabled = false;
});

knob.addEventListener('input', updatePanel);

playButton.addEventListener('click', async () => {
  if (!loaded || !source) return;
  initializeRack();
  if (!sourceNode) {
    sourceNode = audioContext.createMediaElementSource(source);
    sourceNode.connect(master);
  }
  await audioContext.resume();
  await source.play();
  playButton.textContent = 'Playing too loud';
});

stopButton.addEventListener('click', stopPlayback);
window.addEventListener('beforeunload', () => { if (objectUrl) URL.revokeObjectURL(objectUrl); });

updatePanel();
