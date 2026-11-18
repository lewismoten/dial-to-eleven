import test from 'node:test';
import assert from 'node:assert/strict';
import { pyroLayout, burstEnvelope, sparkTravel } from '../src/pyro-show.js';

test('both fireball launch points stay outside the cabinet', () => {
  const layout = pyroLayout({ left: 160, right: 1120, bottom: 690, height: 680 }, 1280, 720);
  assert.ok(layout.left.x + layout.radius < 160);
  assert.ok(layout.right.x - layout.radius > 1120);
  assert.ok(layout.left.y < 690);
  assert.equal(layout.right.y, layout.left.y);
});

test('compact viewports shrink the fireball instead of painting over the amp', () => {
  const layout = pyroLayout({ left: 16, right: 304, bottom: 562, height: 550 }, 320, 568);
  assert.ok(layout.left.x + layout.radius <= 16);
  assert.ok(layout.right.x - layout.radius >= 304);
});

test('cold sparks climb almost the entire page rather than fanning sideways', () => {
  const layout = pyroLayout({ left: 120, right: 1160, bottom: 710, height: 700 }, 1280, 720);
  assert.ok(layout.sparkRise >= 720 * .75);
  assert.ok(layout.sparkRise <= 720);
  assert.ok(layout.sparkSpread <= 16);
});

test('some sparks crest near the top, then fall away', () => {
  assert.equal(sparkTravel(0, 600, true), 0);
  assert.ok(sparkTravel(.7, 600, true) >= 540);
  assert.ok(sparkTravel(.95, 600, true) < sparkTravel(.7, 600, true));
  assert.ok(sparkTravel(.95, 600, false) >= sparkTravel(.7, 600, false));
});

test('a burst rises and leaves a visible flame trail before dying out', () => {
  assert.equal(burstEnvelope(0), 0);
  assert.ok(burstEnvelope(.35) > .75);
  assert.ok(burstEnvelope(.65) > 0);
  assert.equal(burstEnvelope(.85), 0);
});
