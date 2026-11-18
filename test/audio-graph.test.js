import test from 'node:test';
import assert from 'node:assert/strict';
import { connectInput, distortionCurve } from '../src/audio-graph.js';

test('the track enters the effect rack instead of bypassing it', () => {
  let destination;
  const input = { connect(node) { destination = node; } };
  const firstEffect = { name: 'preamp' };
  connectInput(input, firstEffect);
  assert.equal(destination, firstEffect);
});

test('zero drive leaves the waveform untouched', () => {
  const curve = distortionCurve(0, 1001);
  assert.ok(Math.abs(curve[0] + 1) < 0.002);
  assert.ok(Math.abs(curve[500]) < 0.002);
  assert.ok(Math.abs(curve[1000] - 1) < 0.002);
});

test('eleven turns even quiet waveform detail into audible grit', () => {
  const ten = distortionCurve(110, 1001);
  const eleven = distortionCurve(800, 1001);
  assert.ok(eleven[510] > ten[510] * 3);
  assert.ok(eleven[1000] <= 1);
});

