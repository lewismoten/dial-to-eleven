import test from 'node:test';
import assert from 'node:assert/strict';
import { elevenSettings } from '../src/audio-settings.js';

test('eleven settings get progressively more brutal without exceeding safe node limits', () => {
  const quiet = elevenSettings(0);
  const loud = elevenSettings(11);

  assert.equal(quiet.drive, 0);
  assert.equal(quiet.preGainDb, 0);
  assert.ok(loud.drive > quiet.drive);
  assert.ok(loud.preGainDb > quiet.preGainDb);
  assert.ok(loud.outputGain <= 1);
  assert.ok(loud.compressorThresholdDb <= -6);
});

test('eleven settings reject knob positions beyond the sacred range', () => {
  assert.throws(() => elevenSettings(-1), RangeError);
  assert.throws(() => elevenSettings(12), RangeError);
});
