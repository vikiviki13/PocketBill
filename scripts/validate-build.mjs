import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve('dist');
const indexHTML = await readFile(resolve(dist, 'index.html'), 'utf8');
const manifest = JSON.parse(await readFile(resolve(dist, 'manifest.webmanifest'), 'utf8'));
const serviceWorker = await readFile(resolve(dist, 'service-worker.js'), 'utf8');

const assetPaths = [...indexHTML.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)]
  .map((match) => match[1]);

assert.ok(assetPaths.some((path) => path.endsWith('.js')), 'Production index must reference a JavaScript bundle');
assert.ok(assetPaths.some((path) => path.endsWith('.css')), 'Production index must reference a CSS bundle');
await Promise.all(assetPaths.map((path) => access(resolve(dist, path.slice(1)))));

assert.equal(manifest.display, 'standalone');
assert.equal(manifest.scope, '/');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'PWA manifest must contain install icons');
await Promise.all(manifest.icons.map((icon) => access(resolve(dist, icon.src.replace(/^\//, '')))));

assert.match(serviceWorker, /precacheApp/);
assert.ok(serviceWorker.includes('\\/assets\\/'), 'Service worker must discover Vite build assets');
assert.doesNotMatch(indexHTML, /js\/app\.js|js\/db\.js|js\/pdf\.js/);

console.log(`Validated production PWA: ${assetPaths.length} build assets and ${manifest.icons.length} install icons.`);
