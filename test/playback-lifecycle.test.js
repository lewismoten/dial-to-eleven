import test from 'node:test';
import assert from 'node:assert/strict';

class Element extends EventTarget {
  constructor() {
    super();
    this.style = { setProperty() {}, removeProperty() {} };
    const classes = new Set();
    this.classList = {
      toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
      contains(name) { return classes.has(name); },
      remove(name) { classes.delete(name); },
      add(name) { classes.add(name); },
    };
    this.textContent = '';
    this.disabled = false;
  }
  setAttribute() {}
  append() {}
  getContext() { return { clearRect() {} }; }
}

class SilentAudio extends EventTarget {
  static last;
  constructor() {
    super();
    this.paused = true;
    this.ended = false;
    this.queuedPauses = 0;
    this.queuedPlaying = 0;
    this.playCalls = 0;
    SilentAudio.last = this;
  }
  play() {
    this.playCalls += 1;
    this.paused = false;
    this.queuedPlaying += 1;
    return Promise.resolve();
  }
  dispatchQueuedPlaying() {
    assert.ok(this.queuedPlaying > 0);
    this.queuedPlaying -= 1;
    this.dispatchEvent(new Event('playing'));
  }
  pause() {
    if (!this.paused) this.queuedPauses += 1;
    this.paused = true;
  }
  dispatchQueuedPause() {
    assert.ok(this.queuedPauses > 0);
    this.queuedPauses -= 1;
    this.dispatchEvent(new Event('pause'));
  }
}

const parameter = () => ({ setTargetAtTime() {}, cancelScheduledValues() {}, setValueAtTime() {} });
const node = () => ({ gain: parameter(), frequency: parameter(), Q: parameter(), threshold: parameter(), ratio: parameter(),
  attack: parameter(), release: parameter(), knee: parameter(), connect() { return this; }, disconnect() {}, start() {},
  getByteTimeDomainData() {} });
class SilentContext {
  static deferResume = false;
  static releaseResume;
  destination = node();
  currentTime = 0;
  createGain() { return node(); }
  createBiquadFilter() { return node(); }
  createDynamicsCompressor() { return node(); }
  createWaveShaper() { return node(); }
  createOscillator() { return node(); }
  createAnalyser() { return node(); }
  createMediaElementSource() { return node(); }
  resume() {
    if (SilentContext.deferResume) return new Promise(resolve => { SilentContext.releaseResume = resolve; });
    return Promise.resolve();
  }
}

test('queued Stop pause and stale playing cannot disrupt rapid replay on the same audio', async () => {
  const selectors = ['#amp', '#stage', '#pyro-canvas', '#rolling-message', '#audio-file', '#file-name',
    '#eleven-knob', '#knob-label', '#more-eleven', '#dial-ring', '#knob-readout', '#mode-readout',
    '#play-button', '#stop-button'];
  const elements = Object.fromEntries(selectors.map(selector => [selector, new Element()]));
  globalThis.document = { querySelector: selector => elements[selector], createElement: () => new Element() };
  globalThis.window = { matchMedia: () => ({ matches: false, addEventListener() {} }),
    localStorage: { getItem: () => null }, setInterval() {}, addEventListener() {} };
  globalThis.Audio = SilentAudio;
  globalThis.AudioContext = SilentContext;
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  URL.createObjectURL = () => 'blob:silent';
  URL.revokeObjectURL = () => {};

  await import('../src/app.js');
  elements['#audio-file'].files = [{ name: 'silent.wav' }];
  elements['#audio-file'].dispatchEvent(new Event('change'));
  const audio = SilentAudio.last;
  const play = async () => {
    elements['#play-button'].dispatchEvent(new Event('click'));
    await new Promise(resolve => setImmediate(resolve));
    audio.dispatchQueuedPlaying();
  };
  await play();
  assert.equal(elements['#stop-button'].disabled, false);
  elements['#stop-button'].dispatchEvent(new Event('click'));
  assert.equal(audio.queuedPauses, 1);
  await play();
  audio.dispatchQueuedPause(); // Queued by Stop, delivered after replay began.
  assert.equal(audio.paused, false);
  assert.equal(elements['#stage'].classList.contains('is-playing'), true);
  assert.equal(elements['#stop-button'].disabled, false);
  assert.equal(elements['#play-button'].disabled, true);
  assert.equal(elements['#file-name'].textContent, 'silent.wav is on stage.');

  audio.paused = true;
  audio.dispatchEvent(new Event('pause')); // A real pause must still quiet the stage.
  assert.equal(elements['#stage'].classList.contains('is-playing'), false);
  assert.equal(elements['#stop-button'].disabled, true);
  assert.equal(elements['#play-button'].disabled, false);

  // The old play() has queued `playing`, but Stop cancels it before delivery.
  elements['#play-button'].dispatchEvent(new Event('click'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(audio.queuedPlaying, 1);
  elements['#stop-button'].dispatchEvent(new Event('click'));
  SilentContext.deferResume = true;
  elements['#play-button'].dispatchEvent(new Event('click'));
  const playCallsBeforeResume = audio.playCalls;
  audio.dispatchQueuedPlaying(); // Old event arrives while new resume() is pending.
  assert.equal(audio.playCalls, playCallsBeforeResume);
  assert.equal(elements['#file-name'].textContent, 'silent.wav is tuning up.');
  assert.equal(elements['#play-button'].textContent, 'Tuning up...');
  assert.equal(elements['#stop-button'].disabled, false);
  audio.dispatchQueuedPause(); // Media events retain playing → pause order.
  assert.equal(elements['#file-name'].textContent, 'silent.wav is tuning up.');
  SilentContext.deferResume = false;
  SilentContext.releaseResume();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(audio.playCalls, playCallsBeforeResume + 1);
  assert.equal(elements['#file-name'].textContent, 'silent.wav is tuning up.');
  audio.dispatchQueuedPlaying(); // New attempt's event must start the stage.
  assert.equal(elements['#stage'].classList.contains('is-playing'), true);
  assert.equal(elements['#file-name'].textContent, 'silent.wav is on stage.');
  assert.equal(elements['#stop-button'].disabled, false);
});
