import test from 'node:test';
import assert from 'node:assert/strict';
import { elevenSettings, tremoloDepth } from '../src/audio-settings.js';

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

test('zero is genuinely silent', () => {
  assert.equal(elevenSettings(0).outputGain, 0);
});

test('eleven is a cliff, not one more polite increment', () => {
  const ten = elevenSettings(10);
  const eleven = elevenSettings(11);
  assert.ok(eleven.drive >= ten.drive * 4);
  assert.ok(eleven.preGainDb - ten.preGainDb >= 12);
});

test('more eleven is an optional extra distortion stage only at eleven', () => {
  const normal = elevenSettings(11);
  const extra = elevenSettings(11, true);
  assert.ok(extra.preGainDb > normal.preGainDb);
  assert.ok(extra.drive > normal.drive);
  assert.ok(extra.outputGain <= normal.outputGain);
  assert.deepEqual(elevenSettings(10, true), elevenSettings(10));
  assert.equal(elevenSettings(0, true).outputGain, 0);
});

test('more eleven adds a bounded rhythmic grind, never at zero or ten', () => {
  assert.equal(tremoloDepth(0, true), 0);
  assert.equal(tremoloDepth(10, true), 0);
  assert.equal(tremoloDepth(11, false), 0);
  assert.ok(tremoloDepth(11, true) >= .2);
  assert.ok(tremoloDepth(11, true) < elevenSettings(11, true).outputGain);
});

test('eleven settings reject knob positions beyond the sacred range', () => {
  assert.throws(() => elevenSettings(-1), RangeError);
  assert.throws(() => elevenSettings(12), RangeError);
});
