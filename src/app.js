import { elevenSettings, tremoloDepth } from './audio-settings.js';
import { connectInput, distortionCurve } from './audio-graph.js';
import { levelFromPointer, levelFromKey } from './dial.js';
import { cabinetMotion, jackMotion } from './cabinet-shake.js';
import { rollingMessage, pyroVisible, fogIntensity, dialPrompt, badgeMessageVisible } from './stage-directions.js';
import { DIAL_STORAGE_KEY, MORE_ELEVEN_STORAGE_KEY, initialDialLevel, initialMoreEleven } from './dial-persistence.js';
import { playbackPresentation, createPauseGuard } from './playback-ui.js';
import { createPyroShow } from './pyro-show.js';

const amp = document.querySelector('#amp');
const stage = document.querySelector('#stage');
const pyroShow = createPyroShow(document.querySelector('#pyro-canvas'), amp);
const rollingMessageEl = document.querySelector('#rolling-message');

const fileInput = document.querySelector('#audio-file');
const fileName = document.querySelector('#file-name');
const knob = document.querySelector('#eleven-knob');
const knobLabel = document.querySelector('#knob-label');
const moreElevenButton = document.querySelector('#more-eleven');
const dialRing = document.querySelector('#dial-ring');
const readout = document.querySelector('#knob-readout');
const modeReadout = document.querySelector('#mode-readout');
const playButton = document.querySelector('#play-button');
const stopButton = document.querySelector('#stop-button');

let audioContext;
let source;
let pauseGuard;
let sourceNode;
let objectUrl;
let gain;
let filter;
let compressor;
let shaper;
let master;
let modulationGain;
let modulator;
let analyser;
let sampleBuffer;
let animationFrame = 0;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let loaded = false;
let playbackReady = false;
let playbackPending = false;
let playbackAttempt = 0;
let playIssuedAttempt = 0;
let selectedFileName = '';
let storedLevel = null;
let storedMoreEleven = null;
try {
  storedLevel = window.localStorage.getItem(DIAL_STORAGE_KEY);
  storedMoreEleven = window.localStorage.getItem(MORE_ELEVEN_STORAGE_KEY);
} catch { /* The show still runs without storage. */ }
let level = initialDialLevel(storedLevel);
let moreEleven = initialMoreEleven(storedMoreEleven);
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
  modulationGain = audioContext.createGain();
  modulationGain.gain.value = 0;
  modulator = audioContext.createOscillator();
  modulator.type = 'square';
  modulator.frequency.value = 14;
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
  modulator.connect(modulationGain).connect(master.gain);
  modulator.start();
  applyEleven(level);
}

function applyEleven(level) {
  const settings = elevenSettings(level, moreEleven);
  if (!audioContext) return;
  gain.gain.setTargetAtTime(10 ** (settings.preGainDb / 20), audioContext.currentTime, 0.015);
  filter.gain.setTargetAtTime(settings.presenceDb, audioContext.currentTime, 0.015);
  compressor.threshold.setTargetAtTime(settings.compressorThresholdDb, audioContext.currentTime, 0.015);
  compressor.ratio.setTargetAtTime(settings.compressorRatio, audioContext.currentTime, 0.015);
  shaper.curve = distortionCurve(settings.drive);
  master.gain.cancelScheduledValues(audioContext.currentTime);
  modulationGain.gain.cancelScheduledValues(audioContext.currentTime);
  if (level === 0) {
    master.gain.setValueAtTime(0, audioContext.currentTime);
    modulationGain.gain.setValueAtTime(0, audioContext.currentTime);
  } else {
    master.gain.setTargetAtTime(settings.outputGain, audioContext.currentTime, 0.015);
    modulationGain.gain.setTargetAtTime(tremoloDepth(level, moreEleven), audioContext.currentTime, 0.025);
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
    updatePanel(true);
  });
  dialRing.append(label);
}

function showRollingMessage() {
  if (rollingMessageEl.hidden) return;
  const text = rollingMessage(level, messageTick);
  if (rollingMessageEl.textContent === text) return;
  rollingMessageEl.textContent = text;
  if (!reducedMotion.matches) {
    rollingMessageEl.classList.remove('rolling-in');
    void rollingMessageEl.offsetWidth;
    rollingMessageEl.classList.add('rolling-in');
  }
}

function syncStage() {
  const playing = Boolean(playbackReady && source && !source.paused && !source.ended);
  stage.classList.toggle('is-playing', playing);
  const pyroOn = pyroVisible(level, playing, reducedMotion.matches);
  stage.classList.toggle('pyro-on', pyroOn);
  pyroShow.setActive(pyroOn);
  stage.style.setProperty('--fog-density', String(fogIntensity(level, playing)));
  const ui = playbackPresentation(selectedFileName, level, playing, playbackPending);
  fileName.textContent = ui.fileText;
  playButton.textContent = ui.playText;
  playButton.disabled = ui.playDisabled;
  stopButton.disabled = ui.stopDisabled;
}

function updatePanel(save = false) {
  moreElevenButton.hidden = level !== 11;
  moreElevenButton.setAttribute('aria-pressed', String(moreEleven));
  moreElevenButton.textContent = moreEleven ? 'More eleven: ON' : 'More eleven';
  stage.classList.toggle('more-eleven', moreEleven && level === 11);
  pyroShow.setOverdrive(moreEleven && level === 11);
  knobLabel.textContent = dialPrompt(level);
  rollingMessageEl.hidden = !badgeMessageVisible(level);
  if (level !== lastMessageLevel) {
    messageTick = 0;
    lastMessageLevel = level;
    showRollingMessage();
    if (save) {
      try { window.localStorage.setItem(DIAL_STORAGE_KEY, String(level)); } catch { /* The dial still turns. */ }
    }
  }
  syncStage();
  readout.textContent = moreEleven && level === 11 ? '11+' : level;
  modeReadout.textContent = moreEleven && level === 11 ? 'MORE ELEVEN' : modes[level];
  knob.setAttribute('aria-valuenow', level);
  knob.setAttribute('aria-valuetext', moreEleven && level === 11 ? 'Eleven, more eleven engaged' : modes[level]);
  knob.style.setProperty('--angle', `${-135 + level * 270 / 11}deg`);
  applyEleven(level);
}

moreElevenButton.addEventListener('click', () => {
  if (level !== 11) return;
  moreEleven = !moreEleven;
  try { window.localStorage.setItem(MORE_ELEVEN_STORAGE_KEY, String(moreEleven)); } catch { /* The road crew can remember it manually. */ }
  updatePanel();
});

function updateFromPointer(event) {
  const box = knob.getBoundingClientRect();
  level = levelFromPointer(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2));
  updatePanel(true);
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
  updatePanel(true);
});

function stopVibration() {
  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  amp.classList.remove('is-eleven');
  syncStage();
  for (const property of ['--text-x', '--text-y', '--cab-x', '--cab-y', '--text-blur', '--speaker-scale', '--bulb-brightness', '--jack-x', '--jack-y', '--jack-blur']) amp.style.removeProperty(property);
}

function renderVibration() {
  if (!playbackReady || !source || source.paused || source.ended) {
    stopVibration();
    return;
  }
  analyser.getByteTimeDomainData(sampleBuffer);
  const motion = cabinetMotion(sampleBuffer, level, true, reducedMotion.matches, moreEleven);
  amp.style.setProperty('--text-x', `${motion.textX}px`);
  amp.style.setProperty('--text-y', `${motion.textY}px`);
  amp.style.setProperty('--cab-x', `${motion.cabinetX}px`);
  amp.style.setProperty('--cab-y', `${motion.cabinetY}px`);
  amp.style.setProperty('--text-blur', `${motion.blur}px`);
  const energy = Math.min(moreEleven ? 5 : 3, Math.hypot(motion.textX, motion.textY));
  pyroShow.setEnergy(Math.min(1, energy / 4));
  amp.style.setProperty('--speaker-scale', String(1 + energy * .022));
  amp.style.setProperty('--bulb-brightness', String(1 + energy * .6));
  const jack = jackMotion(motion);
  amp.style.setProperty('--jack-x', `${jack.x}px`);
  amp.style.setProperty('--jack-y', `${jack.y}px`);
  amp.style.setProperty('--jack-blur', `${motion.blur * .6}px`);
  amp.classList.toggle('is-eleven', level === 11 && !reducedMotion.matches);
  animationFrame = requestAnimationFrame(renderVibration);
}

function stopPlayback() {
  playbackAttempt += 1;
  playbackPending = false;
  playbackReady = false;
  if (source) {
    pauseGuard.recordStop(source.paused);
    source.pause();
    source.currentTime = 0;
  }
  stopVibration();
}

fileInput.addEventListener('change', () => {
  const [file] = fileInput.files;
  stopPlayback();
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = undefined;
  }
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = undefined;

  if (!file) {
    loaded = false;
    selectedFileName = '';
    source = undefined;
    syncStage();
    return;
  }

  objectUrl = URL.createObjectURL(file);
  selectedFileName = file.name;
  source = new Audio(objectUrl);
  const currentSource = source;
  const currentPauseGuard = createPauseGuard();
  pauseGuard = currentPauseGuard;
  source.addEventListener('playing', () => {
    if (source !== currentSource || !playbackPending || playIssuedAttempt !== playbackAttempt) return;
    playbackPending = false;
    playbackReady = true;
    syncStage();
    if (!animationFrame) animationFrame = requestAnimationFrame(renderVibration);
  });
  const quiet = (pending = false) => {
    if (source !== currentSource || (!playbackReady && !playbackPending)) return;
    playbackReady = false;
    playbackPending = pending;
    stopVibration();
  };
  source.addEventListener('pause', () => {
    if (source === currentSource && currentPauseGuard.shouldHandlePause()) quiet();
  });
  source.addEventListener('waiting', () => quiet(true));
  source.addEventListener('ended', () => quiet());
  source.addEventListener('error', () => { quiet(); if (source === currentSource) fileName.textContent = 'That file would not cooperate. Try another audio format.'; });
  loaded = true;
  syncStage();
});

playButton.addEventListener('click', async () => {
  if (!loaded || !source || playbackPending || playbackReady) return;
  const currentSource = source;
  const attempt = ++playbackAttempt;
  playbackPending = true;
  syncStage();
  try {
    initializeRack();
    if (!sourceNode) {
      sourceNode = audioContext.createMediaElementSource(currentSource);
      connectInput(sourceNode, gain);
    }
    await audioContext.resume();
    if (attempt !== playbackAttempt || source !== currentSource) return;
    playIssuedAttempt = attempt;
    await currentSource.play();
  } catch {
    if (attempt !== playbackAttempt || source !== currentSource) return;
    playbackPending = false;
    playbackReady = false;
    stopVibration();
    fileName.textContent = 'Playback failed. Try another audio file.';
  }
});

stopButton.addEventListener('click', stopPlayback);
reducedMotion.addEventListener('change', () => updatePanel());
window.setInterval(() => { if (badgeMessageVisible(level)) { messageTick += 1; showRollingMessage(); } }, 8000);
window.addEventListener('beforeunload', () => { if (objectUrl) URL.revokeObjectURL(objectUrl); });

updatePanel();
