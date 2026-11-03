import { readFile, cp, mkdir } from 'node:fs/promises';
import { identities, json, checkpoint } from './day07-common.mjs';
const path = 'docs/review/day06/lcp-final/candidate-manifest.json';
const previous = JSON.parse(await readFile(path, 'utf8'));
const actual = await identities(previous.records.map(record => record.path));
const mismatches = actual.filter((record, index) => record.sha256 !== previous.records[index].sha256);
await mkdir('docs/review/day07/entry', { recursive: true });
for (const name of ['HANDOFF.md', 'PROJECT-STATUS.md'])
  await cp(name, `docs/review/day07/entry/${name}`, { errorOnExist: true, force: false });
await json('baseline', { date: new Date().toISOString(), previousManifest: path, count: actual.length, mismatches, records: actual,
  review: 'User deferred Day 6/final visual and live-motion review to end of Day 7; no approval inferred.',
  scope: '13 surfaces, colophon closing, nine persistent chapters, native/reduced/continuous reading.' });
if (mismatches.length) throw new Error('Day 6 identity mismatch');
await cp('dist', 'tmp/day07/entry-dist', { recursive: true, force: false, errorOnExist: true });
await checkpoint(['7.1.1'], 'Reproduce phone first-chapter 240ms lab sample and inspect current delivery.',
  'Rank reproduced blockers; perform bounded fixes and build/focused verification.',
  ['227/227 predecessor hashes match', 'No Day 6 approval assumed', 'No publication authorized']);
console.log(JSON.stringify({ records: actual.length, mismatches: mismatches.length }));
