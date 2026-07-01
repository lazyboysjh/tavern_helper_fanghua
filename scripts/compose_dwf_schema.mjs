import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaSrc = path.join(root, '..', '..', 'plot', 'schema.mvu.js');
const outPath = path.join(root, 'src/dawei/ui/status/dwf-stat-schema.js');

let src = fs.readFileSync(schemaSrc, 'utf-8');
src = src.replace(/^import[^\n]+\n/, '');
src = src.replace(/\n\$\(\(\) => \{\s*\n\s*registerMvuSchema\(Schema\);\s*\n\}\);\s*$/, '');
src = src.replace(/^export const Schema = /m, 'var Schema = ');

const wrapped = `/* 由 scripts/compose_dwf_schema.mjs 从 plot/schema.mvu.js 生成；供状态栏 Schema.parse */
(function (global) {
  if (typeof global.z === 'undefined') {
    console.warn('[大魏芳华:UI] z 未就绪，无法注册 Stat Schema');
    return;
  }
  var z = global.z;
  var _ = global._;
${src
  .split('\n')
  .map((line) => '  ' + line)
  .join('\n')}
  global.__DWF_STAT_SCHEMA__ = Schema;
})(typeof window !== 'undefined' ? window : globalThis);
`;

fs.writeFileSync(outPath, wrapped, 'utf-8');
console.log('[compose_dwf_schema] ->', path.relative(root, outPath));
