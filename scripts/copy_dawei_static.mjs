import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const statusDist = path.join(root, 'dist/dawei/ui/status');
if (fs.existsSync(statusDist)) {
  for (const name of fs.readdirSync(statusDist)) {
    if (/^[0-9a-f]{8,}\.js$/i.test(name)) {
      fs.unlinkSync(path.join(statusDist, name));
      console.log(`[copy_dawei_static] removed orphan ${name}`);
    }
  }
}

const copies = [
  ['src/dawei/ui/options/styles.css', 'dist/dawei/ui/options/styles.css'],
  ['src/dawei/ui/options/controller.js', 'dist/dawei/ui/options/controller.js'],
  ['src/dawei/ui/status/index.html', 'dist/dawei/ui/status/index.html'],
  ['src/dawei/ui/status/dwf-stat-schema.js', 'dist/dawei/ui/status/dwf-stat-schema.js'],
  ['src/dawei/ui/status/preview.html', 'dist/dawei/ui/status/preview.html'],
  ['src/dawei/ui/status/vendor/jquery.min.js', 'dist/dawei/ui/status/vendor/jquery.min.js'],
  ['src/dawei/ui/status/vendor/lodash.min.js', 'dist/dawei/ui/status/vendor/lodash.min.js'],
];

for (const [fromRel, toRel] of copies) {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (!fs.existsSync(from)) {
    console.warn(`[copy_dawei_static] skip missing: ${fromRel}`);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`[copy_dawei_static] ${fromRel} -> ${toRel}`);
}
