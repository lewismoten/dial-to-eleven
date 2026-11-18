import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = () => readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const head = () => page().split('</head>')[0];

test('the page links a shipped ICO favicon at the Pages subpath', () => {
  const icon = page().match(/<link\s+[^>]*rel="icon"[^>]*>/i)?.[0];
  assert.ok(icon, 'missing favicon link');
  assert.match(icon, /href="favicon\.ico"/);
  assert.match(icon, /type="image\/x-icon"/);
  const bytes = readFileSync(new URL('../favicon.ico', import.meta.url));
  assert.deepEqual([...bytes.subarray(0, 4)], [0, 0, 1, 0]);
});

test('the page describes its audio amp and names its published canonical URL', () => {
  const metadata = head();
  assert.match(metadata, /<title>Dial to Eleven \| Browser Audio Amp[^<]*<\/title>/);
  assert.match(metadata, /<meta name="description" content="[^\"]+"\s*\/>/);
  assert.match(metadata, /<link rel="canonical" href="https:\/\/lewismoten\.github\.io\/dial-to-eleven\/"\s*\/>/);
});

test('Open Graph describes the page with a published social image', () => {
  const metadata = head();
  const property = (name) => metadata.match(new RegExp(`<meta property="${name}" content="([^"]+)"\\s*/>`))?.[1];
  const title = metadata.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = metadata.match(/<meta name="description" content="([^"]+)"\s*\/>/)?.[1];
  const url = 'https://lewismoten.github.io/dial-to-eleven/';
  assert.equal(property('og:type'), 'website');
  assert.equal(property('og:title'), title);
  assert.equal(property('og:description'), description);
  assert.equal(property('og:url'), url);
  assert.equal(property('og:image'), new URL('assets/social-preview.jpg', url).href);
  assert.equal(property('og:image:type'), 'image/jpeg');
  assert.equal(property('og:image:width'), '1280');
  assert.equal(property('og:image:height'), '640');
  assert.match(property('og:image:alt') ?? '', /dial.*11.*stage lights.*sparks/i);
  const bytes = readFileSync(new URL('../assets/social-preview.jpg', import.meta.url));
  assert.deepEqual([...bytes.subarray(0, 3)], [255, 216, 255]);
});

test('X cards use the same title, description, and artwork', () => {
  const metadata = head();
  const named = (name) => metadata.match(new RegExp(`<meta name="${name}" content="([^"]+)"\\s*/>`))?.[1];
  const property = (name) => metadata.match(new RegExp(`<meta property="${name}" content="([^"]+)"\\s*/>`))?.[1];
  assert.equal(named('twitter:card'), 'summary_large_image');
  assert.equal(named('twitter:title'), property('og:title'));
  assert.equal(named('twitter:description'), property('og:description'));
  assert.equal(named('twitter:image'), property('og:image'));
  assert.equal(named('twitter:image:alt'), property('og:image:alt'));
});
