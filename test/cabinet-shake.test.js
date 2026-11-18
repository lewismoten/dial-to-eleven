import test from 'node:test';
import assert from 'node:assert/strict';
import { cabinetShake, cabinetMotion, jackMotion } from '../src/cabinet-shake.js';

test('the cabinet stays still unless the record is playing at eleven', () => {
  const signal = Uint8Array.from([128, 0, 255]);
  assert.equal(cabinetShake(signal, 10, true), 0);
  assert.equal(cabinetShake(signal, 11, false), 0);
  assert.equal(cabinetShake(signal, 11, true, true), 0);
});

test('the cabinet responds to actual audio amplitude at eleven', () => {
  assert.equal(cabinetShake(Uint8Array.from([128, 128]), 11, true), 0);
  const shake = cabinetShake(Uint8Array.from([128, 0, 255]), 11, true);
  assert.ok(shake > 1);
  assert.ok(shake <= 3);
});

test('text and cabinet move differently in response to changing samples', () => {
  const a = cabinetMotion(Uint8Array.from([0, 255, 0, 255]), 11, true);
  const b = cabinetMotion(Uint8Array.from([255, 0, 255, 0]), 11, true);
  assert.notDeepEqual(a, b);
  assert.notEqual(a.textX, a.cabinetX);
  assert.notEqual(a.textY, a.cabinetY);
  assert.ok(a.blur > 0);
  assert.deepEqual(cabinetMotion(Uint8Array.from([128, 128, 128, 128]), 11, true), { textX: 0, textY: 0, cabinetX: 0, cabinetY: 0, blur: 0 });
  assert.deepEqual(cabinetMotion(Uint8Array.from([0, 255, 0, 255]), 11, true, true), { textX: 0, textY: 0, cabinetX: 0, cabinetY: 0, blur: 0 });
});

test('more eleven makes every live motion channel wilder but never shakes silence', () => {
  const signal = Uint8Array.from([0, 255, 0, 255]);
  const ordinary = cabinetMotion(signal, 11, true);
  const extra = cabinetMotion(signal, 11, true, false, true);
  assert.ok(Math.abs(extra.textX) > Math.abs(ordinary.textX));
  assert.ok(Math.abs(extra.cabinetY) > Math.abs(ordinary.cabinetY));
  assert.ok(Math.abs(jackMotion(extra).x) > Math.abs(jackMotion(ordinary).x));
  assert.deepEqual(cabinetMotion(signal, 11, false, false, true), { textX: 0, textY: 0, cabinetX: 0, cabinetY: 0, blur: 0 });
  assert.deepEqual(cabinetMotion(signal, 11, true, true, true), { textX: 0, textY: 0, cabinetX: 0, cabinetY: 0, blur: 0 });
});

test('the input jack rattles independently only while music plays at eleven', () => {
  const live = cabinetMotion(Uint8Array.from([0, 255, 0, 255]), 11, true);
  const jack = jackMotion(live);
  assert.notEqual(jack.x, 0);
  assert.notEqual(jack.x, live.textX);
  assert.notEqual(jack.y, live.cabinetY);
  assert.deepEqual(jackMotion(cabinetMotion(Uint8Array.from([0, 255, 0, 255]), 11, false)), { x: 0, y: 0 });
});

