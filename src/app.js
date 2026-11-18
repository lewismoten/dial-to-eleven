import { elevenSettings } from './audio-settings.js';
import { connectInput, distortionCurve } from './audio-graph.js';
import { levelFromPointer, levelFromKey } from './dial.js';
import { cabinetMotion } from './cabinet-shake.js';
import { stageLine, rollingMessage, pyroVisible } from './stage-directions.js';

const amp = document.querySelector('#amp');
const stageCaption = document.querySelector('#stage-caption');
const rollingMessageEl = document.querySelector('#rolling-message');

const fileInput = document.querySelector('#audio-file');
const fileName = document.querySelector('#file-name');
const knob = document.querySelector('#eleven-knob');
const dialRing = document.querySelector('#dial-ring');
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
let analyser;
let sampleBuffer;
let animationFrame = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let loaded = false;
let level = 0;
let lastMessageLevel = -1;
let messageTick = 0;

function initializeRack() {
  if (audioContext) return;
  audioContext = new AudioContext();
  gain = audioContext.createGain();
  filter = audioContext.createBiquadFilter();
  compressor = audioContext.createDynamicsCompressor();
  shaper = audioContext.createWaveShaper();
  master = audioContext.createGain();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  sampleBuffer = new Uint8Array(analyser.fftSize);

  filter.type = 'peaking';
  filter.frequency.value = 2600;
  filter.Q.value = 0.9;
  shaper.oversample = '4x';
  compressor.attack.value = 0.003;
  compressor.release.value = 0.15;
  compressor.knee.value = 0;

  gain.connect(filter).connect(compressor).connect(shaper).connect(master).connect(analyser).connect(audioContext.destination);
  applyEleven(level);
}

function applyEleven(level) {
  const settings = elevenSettings(level);
  if (!audioContext) return;
  gain.gain.setTargetAtTime(10 ** (settings.preGainDb / 20), audioContext.currentTime, 0.015);
  filter.gain.setTargetAtTime(settings.presenceDb, audioContext.currentTime, 0.015);
  compressor.threshold.setTargetAtTime(settings.compressorThresholdDb, audioContext.currentTime, 0.015);
  compressor.ratio.setTargetAtTime(settings.compressorRatio, audioContext.currentTime, 0.015);
  shaper.curve = distortionCurve(settings.drive);
  master.gain.cancelScheduledValues(audioContext.currentTime);
  if (level === 0) {
    master.gain.setValueAtTime(0, audioContext.currentTime);
  } else {
    master.gain.setTargetAtTime(settings.outputGain, audioContext.currentTime, 0.015);
  }
}

const modes = ['Suspicious silence', 'A little impolite', 'Getting cheeky', 'Polite warning ignored', 'Amp warming up', 'Clearly deliberate', 'Crunch with intent', 'Walls becoming optional', 'The neighbors know', 'Questionable decisions', 'The room is smaller now', 'ELEVEN'];

for (let number = 0; number <= 11; number += 1) {
  const angle = (-135 + number * 270 / 11) * Math.PI / 180;
  const label = document.createElement('button');
  label.type = 'button';
  label.className = 'dial-number';
  label.textContent = number;
  label.setAttribute('aria-label', `Turn dial to ${number}`);
  label.style.setProperty('--x', `${Math.sin(angle) * 46}%`);
  label.style.setProperty('--y', `${-Math.cos(angle) * 46}%`);
  label.addEventListener('click', () => {
    level = number;
    updatePanel();
  });
  dialRing.append(label);
}

function showRollingMessage() {
  const text = rollingMessage(level, messageTick);
  if (rollingMessageEl.textContent === text) return;
  rollingMessageEl.textContent = text;
  if (!reducedMotion.matches) {
    rollingMessageEl.classList.remove('rolling-in');
    void rollingMessageEl.offsetWidth;
    rollingMessageEl.classList.add('rolling-in');
  }
}

function updatePanel() {
  if (level !== lastMessageLevel) {
    messageTick = 0;
    lastMessageLevel = level;
    showRollingMessage();
  }
  amp.classList.toggle('pyro-on', pyroVisible(level, reducedMotion.matches));
  readout.textContent = level;
  modeReadout.textContent = modes[level];
  stageCaption.textContent = stageLine(level, source ? Math.floor(source.currentTime / 2.5) : 0);
  knob.setAttribute('aria-valuenow', level);
  knob.setAttribute('aria-valuetext', modes[level]);
  knob.style.setProperty('--angle', `${-135 + level * 270 / 11}deg`);
  applyEleven(level);
}

function updateFromPointer(event) {
  const box = knob.getBoundingClientRect();
  level = levelFromPointer(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2));
  updatePanel();
}

knob.addEventListener('pointerdown', (event) => {
  knob.setPointerCapture(event.pointerId);
  updateFromPointer(event);
});
knob.addEventListener('pointermove', (event) => {
  if (knob.hasPointerCapture(event.pointerId)) updateFromPointer(event);
});
knob.addEventListener('keydown', (event) => {
  const next = levelFromKey(event.key, level);
  if (next === null) return;
  event.preventDefault();
  level = next;
  updatePanel();
});

function stopVibration() {
  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  amp.classList.remove('is-eleven');
  for (const property of ['--text-x', '--text-y', '--cab-x', '--cab-y', '--text-blur', '--speaker-scale', '--bulb-brightness', '--smoke']) amp.style.removeProperty(property);
}

function renderVibration() {
  if (!source || source.paused || source.ended) {
    stopVibration();
    return;
  }
  analyser.getByteTimeDomainData(sampleBuffer);
  const motion = cabinetMotion(sampleBuffer, level, true, reducedMotion.matches);
  amp.style.setProperty('--text-x', `${motion.textX}px`);
  amp.style.setProperty('--text-y', `${motion.textY}px`);
  amp.style.setProperty('--cab-x', `${motion.cabinetX}px`);
  amp.style.setProperty('--cab-y', `${motion.cabinetY}px`);
  amp.style.setProperty('--text-blur', `${motion.blur}px`);
  const energy = Math.min(3, Math.hypot(motion.textX, motion.textY));
  amp.style.setProperty('--speaker-scale', String(1 + energy * .022));
  amp.style.setProperty('--bulb-brightness', String(1 + energy * .6));
  amp.style.setProperty('--smoke', String(Math.min(.5, energy * .14)));
  const caption = stageLine(level, Math.floor(source.currentTime / 2.5));
  if (stageCaption.textContent !== caption) stageCaption.textContent = caption;
  amp.classList.toggle('is-eleven', level === 11 && !reducedMotion.matches);
  animationFrame = requestAnimationFrame(renderVibration);
}

function stopPlayback() {
  stopVibration();
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
  source.addEventListener('ended', () => { stopVibration(); playButton.textContent = 'Play it loud'; });
  source.addEventListener('error', () => { fileName.textContent = 'That file would not cooperate. Try another audio format.'; });
  loaded = true;
  fileName.textContent = `${file.name} is standing by.`;
  playButton.disabled = false;
  stopButton.disabled = false;
});

playButton.addEventListener('click', async () => {
  if (!loaded || !source) return;
  initializeRack();
  if (!sourceNode) {
    sourceNode = audioContext.createMediaElementSource(source);
    connectInput(sourceNode, gain);
  }
  await audioContext.resume();
  await source.play();
  playButton.textContent = 'Playing too loud';
  if (!animationFrame) animationFrame = requestAnimationFrame(renderVibration);
});

stopButton.addEventListener('click', stopPlayback);
reducedMotion.addEventListener('change', updatePanel);
window.setInterval(() => { messageTick += 1; showRollingMessage(); }, 3600);
window.addEventListener('beforeunload', () => { if (objectUrl) URL.revokeObjectURL(objectUrl); });

updatePanel();
