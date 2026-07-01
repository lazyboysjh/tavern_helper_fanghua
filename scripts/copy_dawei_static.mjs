import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const copies = [
  ['src/dawei/ui/options/styles.css', 'dist/dawei/ui/options/styles.css'],
  ['src/dawei/ui/options/controller.js', 'dist/dawei/ui/options/controller.js'],
  ['src/dawei/ui/status/index.html', 'dist/dawei/ui/status/index.html'],
  ['src/dawei/ui/status/preview.html', 'dist/dawei/ui/status/preview.html'],
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