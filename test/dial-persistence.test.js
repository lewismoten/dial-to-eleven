import test from 'node:test';
import assert from 'node:assert/strict';
import { initialDialLevel, initialMoreEleven } from '../src/dial-persistence.js';

test('a first visit starts above silence without touching the hardware', () => {
  assert.equal(initialDialLevel(null), 3);
});

test('a reload restores the exact dial stop, including zero and eleven', () => {
  assert.equal(initialDialLevel('0'), 0);
  assert.equal(initialDialLevel('7'), 7);
  assert.equal(initialDialLevel('11'), 11);
});

test('more eleven survives a refresh, including its off state', () => {
  assert.equal(initialMoreEleven(null), false);
  assert.equal(initialMoreEleven('true'), true);
  assert.equal(initialMoreEleven('false'), false);
  assert.equal(initialMoreEleven('garbage'), false);
});

test('corrupt saved state falls back to the safe default', () => {
  assert.equal(initialDialLevel(''), 3);
  assert.equal(initialDialLevel('12'), 3);
  assert.equal(initialDialLevel('4.5'), 3);
});
