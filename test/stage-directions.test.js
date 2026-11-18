import test from 'node:test';
import assert from 'node:assert/strict';
import { rollingMessage, messageCount, pyroVisible, fogIntensity, dialPrompt, badgeMessageVisible } from '../src/stage-directions.js';

test('the department has multiple eleven-only warnings', () => {
  assert.notEqual(rollingMessage(11, 0), rollingMessage(11, 1));
  assert.notEqual(rollingMessage(11, 1), rollingMessage(11, 2));
});

test('the eleven-only department has a whole tour bus of distinct messages', () => {
  assert.ok(messageCount >= 36);
  const all = Array.from({ length: messageCount }, (_, index) => rollingMessage(11, index));
  assert.equal(new Set(all).size, messageCount);
  assert.equal(rollingMessage(11, messageCount), rollingMessage(11, 0));
  assert.notEqual(rollingMessage(11, 0), rollingMessage(5, 0));
});

test('the department only shows its rotating message on eleven', () => {
  assert.equal(badgeMessageVisible(0), false);
  assert.equal(badgeMessageVisible(10), false);
  assert.equal(badgeMessageVisible(11), true);
});

test('the knob only asks how much eleven when it is actually on eleven', () => {
  assert.equal(dialPrompt(0), 'Why not eleven?');
  assert.equal(dialPrompt(10), 'Why not eleven?');
  assert.equal(dialPrompt(11), 'How much eleven?');
});

test('fog only builds while playing and scales with the dial', () => {
  assert.equal(fogIntensity(0, true), 0);
  assert.equal(fogIntensity(11, false), 0);
  assert.equal(fogIntensity(3, true), 3 / 11);
  assert.equal(fogIntensity(11, true), 1);
});

test('the pyro crew needs eleven and an actual playing track', () => {
  assert.equal(pyroVisible(10, true, false), false);
  assert.equal(pyroVisible(11, false, false), false);
  assert.equal(pyroVisible(11, true, false), true);
  assert.equal(pyroVisible(11, true, true), false);
});
