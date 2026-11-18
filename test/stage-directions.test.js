import test from 'node:test';
import assert from 'node:assert/strict';
import { stageLine } from '../src/stage-directions.js';

test('the badge gets a new joke every few bars at eleven', () => {
  assert.equal(stageLine(0, 0), 'THE DRUMMER CAN HEAR HIMSELF THINK');
  assert.equal(stageLine(7, 0), 'LOUDER THAN NECESSARY');
  assert.notEqual(stageLine(11, 0), stageLine(11, 1));
  assert.equal(stageLine(11, 4), stageLine(11, 0));
});
