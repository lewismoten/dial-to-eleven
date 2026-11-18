import test from 'node:test';
import assert from 'node:assert/strict';
import { levelFromPointer, levelFromKey } from '../src/dial.js';

test('turning the face clockwise travels from zero at bottom-left to eleven at bottom-right', () => {
  assert.equal(levelFromPointer(-1, 1), 0);
  assert.equal(levelFromPointer(0, -1), 6);
  assert.equal(levelFromPointer(1, 1), 11);
});

test('the dial remains operable by keyboard', () => {
  assert.equal(levelFromKey('ArrowUp', 4), 5);
  assert.equal(levelFromKey('ArrowLeft', 4), 3);
  assert.equal(levelFromKey('Home', 4), 0);
  assert.equal(levelFromKey('End', 4), 11);
  assert.equal(levelFromKey('ArrowRight', 11), 11);
  assert.equal(levelFromKey('Space', 4), null);
});
