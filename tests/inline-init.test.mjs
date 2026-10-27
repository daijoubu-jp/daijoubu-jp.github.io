/**
 * Inline <script type="module"> blocks are deferred, so they can evaluate after
 * DOMContentLoaded has already fired. Registering the initialiser unconditionally
 * then leaves the page permanently empty (browse/special-readings.html and
 * knowledge/handwriting.html both shipped that way).
 *
 * Rule: an inline module that listens for DOMContentLoaded must also guard on
 * document.readyState, or call its initialiser immediately when already ready.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (['.git', 'node_modules', 'studio', 'data', 'scratch', 'ref-screenshots'].includes(entry.name)) {
      return [];
    }
    const full = join(dir, entry.name);
    return entry.isDirectory()
      ? htmlFiles(full)
      : (entry.name.endsWith('.html') ? [full] : []);
  });
}

/** Only inline modules: `<script type="module">` with no src attribute. */
function inlineModules(html) {
  return [...html.matchAll(/<script type="module"(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]);
}

test('inline modules never wait for DOMContentLoaded without a readyState guard', () => {
  const files = htmlFiles(root);
  assert.ok(files.length >= 24, `expected 24+ pages, found ${files.length}`);

  const offenders = [];
  let guardedBlocks = 0;
  let checkedBlocks = 0;

  for (const file of files) {
    const rel = file.slice(root.length).replace(/^\/+/, '');
    const html = readFileSync(file, 'utf8');

    for (const block of inlineModules(html)) {
      checkedBlocks += 1;
      const listens = /document\.addEventListener\(\s*['"]DOMContentLoaded['"]/.test(block);
      if (!listens) continue;

      const guarded = /document\.readyState/.test(block);
      if (guarded) {
        guardedBlocks += 1;
      } else {
        offenders.push(`${rel}: inline module waits on DOMContentLoaded with no readyState guard`);
      }
    }
  }

  assert.ok(checkedBlocks > 0, 'no inline modules found -- the scan is broken');
  assert.deepEqual(offenders, [], `unguarded inline initialisers:\n${offenders.join('\n')}`);
  assert.ok(
    guardedBlocks >= 2,
    `expected the known pages to be guarded, found ${guardedBlocks} guarded block(s)`
  );
});
