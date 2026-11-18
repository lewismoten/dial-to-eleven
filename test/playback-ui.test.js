import test from 'node:test';
import assert from 'node:assert/strict';
import { playbackPresentation, createPauseGuard } from '../src/playback-ui.js';

test('no file and an idle selected file cannot be stopped', () => {
  assert.deepEqual(playbackPresentation('', 3, false, false), {
    fileText: 'No file. No glory.', playText: 'Play it loud', playDisabled: true, stopDisabled: true,
  });
  assert.deepEqual(playbackPresentation('track.wav', 3, false, false), {
    fileText: 'track.wav is standing by.', playText: 'Play it loud', playDisabled: false, stopDisabled: true,
  });
});

test('a pending playback can be cancelled; a stopped track can be restarted', () => {
  const pending = playbackPresentation('track.wav', 11, false, true);
  assert.equal(pending.stopDisabled, false);
  assert.equal(pending.playDisabled, true);
  assert.notEqual(pending.fileText, 'track.wav is standing by.');
  const restarted = playbackPresentation('track.wav', 11, false, false);
  assert.equal(restarted.playDisabled, false);
  assert.equal(restarted.stopDisabled, true);
});

test('a playing file is on stage; zero is playing silently, not loudly', () => {
  assert.deepEqual(playbackPresentation('track.wav', 0, true, false), {
    fileText: 'track.wav is on stage.', playText: 'Playing silently', playDisabled: true, stopDisabled: false,
  });
  assert.equal(playbackPresentation('track.wav', 7, true, false).playText, 'Playing loud');
  assert.equal(playbackPresentation('track.wav', 11, true, false).playText, 'Playing too loud');
});

test('a queued Stop pause cannot cancel a rapid replay, but a later real pause can', () => {
  const guard = createPauseGuard();
  guard.recordStop(false); // pause() queues an event while the element is playing.
  // Play is clicked on the same element before that event is delivered.
  assert.equal(guard.shouldHandlePause(), false);
  assert.equal(guard.shouldHandlePause(), true);
});

test('only actual Stop transitions reserve pause events, including repeated rapid stops', () => {
  const guard = createPauseGuard();
  guard.recordStop(true); // Already paused: pause() queues nothing.
  assert.equal(guard.shouldHandlePause(), true);
  guard.recordStop(false);
  guard.recordStop(false);
  assert.equal(guard.shouldHandlePause(), false);
  assert.equal(guard.shouldHandlePause(), false);
  assert.equal(guard.shouldHandlePause(), true);
});
