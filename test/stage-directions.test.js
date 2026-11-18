import test from 'node:test';
import assert from 'node:assert/strict';
import { stageLine, rollingMessage, messageCount, pyroVisible } from '../src/stage-directions.js';

test('the badge gets a new joke every few bars at eleven', () => {
  assert.equal(stageLine(0, 0), 'THE DRUMMER CAN HEAR HIMSELF THINK');
  assert.equal(stageLine(7, 0), 'LOUDER THAN NECESSARY');
  assert.notEqual(stageLine(11, 0), stageLine(11, 1));
  assert.equal(stageLine(11, 4), stageLine(11, 0));
});

test('the headline has a whole tour bus of distinct rolling messages', () => {
  assert.ok(messageCount >= 24);
  const all = Array.from({ length: messageCount }, (_, index) => rollingMessage(5, index));
  assert.equal(new Set(all).size, messageCount);
  assert.equal(rollingMessage(5, messageCount), rollingMessage(5, 0));
  assert.notEqual(rollingMessage(11, 0), rollingMessage(5, 0));
});

test('the pyro crew only gets a cue at eleven and respects reduced motion', () => {
  assert.equal(pyroVisible(10, false), false);
  assert.equal(pyroVisible(11, false), true);
  assert.equal(pyroVisible(11, true), false);
});
