/**
 * sw.js serves every URL under /data/ cache-first, so a data request that does
 * not carry the DATA_VERSION stamp is pinned in the visitor's cache forever.
 * Four files shipped bare (or hardcoded-epoch) URLs before this test existed.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));

function walk(dir, exts) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'studio'
      || entry.name === 'data' || entry.name === 'scratch') return [];
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, exts);
    return exts.some((e) => entry.name.endsWith(e)) ? [full] : [];
  });
}

test('DATA_VERSION is exported from search.js', () => {
  const src = readFileSync(join(root, 'assets/js/search.js'), 'utf8');
  assert.match(src, /export const DATA_VERSION = '[^']+'/,
    'search.js must export DATA_VERSION so every data fetch can share one stamp');
});

test('no generated data file is fetched without a DATA_VERSION stamp', () => {
  const files = [
    ...walk(join(root, 'assets/js'), ['.js']),
    ...walk(root, ['.html']),
  ];

  // `data/…json` references that must always be versioned.
  const DATA_REF = /['"`](?:\.\.\/)*(?:\.\.\/)?data\/([\w.-]+\.json)(\?[^'"`]*)?['"`]/g;
  // Files whose job is to build/patch data rather than fetch it at runtime.
  const ALLOW = new Set(['scripts', 'tests']);

  const offenders = [];
  for (const file of files) {
    const rel = file.slice(root.length).replace(/^\/+/, '');
    if ([...ALLOW].some((a) => rel.startsWith(`${a}/`))) continue;

    const src = readFileSync(file, 'utf8');
    for (const match of src.matchAll(DATA_REF)) {
      const [full, name, query] = match;
      if (!query || !query.includes('v=')) {
        offenders.push(`${rel}: ${full} -> ${name} has no ?v= stamp`);
      } else if (!/v=\$\{DATA_VERSION\}|v=\$\{[^}]+\}/.test(query)) {
        offenders.push(`${rel}: ${full} -> ${name} uses a hardcoded stamp instead of DATA_VERSION`);
      }
    }
  }

  assert.deepEqual(offenders, [],
    `data fetches must use ?v=\${DATA_VERSION} so sw.js cache-first can invalidate:\n${offenders.join('\n')}`);
});

test('every versioned data URL rewrites when DATA_VERSION changes', () => {
  // The stamp must actually be interpolated, not concatenated from a literal.
  const search = readFileSync(join(root, 'assets/js/search.js'), 'utf8');
  const stamp = search.match(/export const DATA_VERSION = '([^']+)'/)[1];
  assert.match(stamp, /^\d{8}$|^\d{10,}$/, `DATA_VERSION "${stamp}" should be a date or epoch stamp`);
});
