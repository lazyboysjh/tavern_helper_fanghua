import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statusDir = path.join(root, 'src/dawei/ui/status');
const htmlPath = path.join(statusDir, 'index.html');

const blocks = [
  {
    start: '/* __DWF_MVU_CSS_START__ */',
    end: '/* __DWF_MVU_CSS_END__ */',
    file: path.join(statusDir, 'dwf-mvu.css'),
    anchor: '</style>',
    before: true,
  },
  {
    start: '/* __DWF_MVU_JS_START__ */',
    end: '/* __DWF_MVU_JS_END__ */',
    file: path.join(statusDir, 'dwf-mvu.js'),
    anchor: 'var DEFAULT_ACCENT',
    before: true,
  },
];

let html = fs.readFileSync(htmlPath, 'utf-8');

for (const b of blocks) {
  const content = fs.readFileSync(b.file, 'utf-8');
  const wrapped = `${b.start}\n${content}\n${b.end}`;
  const re = new RegExp(
    b.start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + b.end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    'm',
  );
  if (re.test(html)) {
    html = html.replace(re, wrapped);
  } else if (html.includes(b.anchor)) {
    html = b.before
      ? html.replace(b.anchor, `${wrapped}\n\n        ${b.anchor}`)
      : html.replace(b.anchor, `${b.anchor}\n${wrapped}`);
  } else {
    console.warn('[compose_dwf_status] anchor not found for', b.file);
  }
}

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('[compose_dwf_status] injected dwf-mvu modules');