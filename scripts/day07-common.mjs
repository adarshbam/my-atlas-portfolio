import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';

export const run = process.env.DAY07_RUN ?? 'final';
if (!/^[a-z0-9-]+$/.test(run)) throw new Error('Invalid Day 7 run');
export const output = `docs/review/day07/${run}`;
export const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
await mkdir(output, { recursive: true });
export const sha256 = data => createHash('sha256').update(data).digest('hex');
export async function json(name, data) {
  await writeFile(`${output}/${name}.json`, JSON.stringify(data, null, 2) + '\n');
}
export async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const lists = await Promise.all(entries.map(entry => {
    const path = `${directory}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Symlink excluded: ${path}`);
    return entry.isDirectory() ? files(path) : [path];
  }));
  return lists.flat().sort();
}
export async function identities(paths) {
  return Promise.all(paths.map(async path => {
    const bytes = await readFile(path);
    return { path, bytes: bytes.length, sha256: sha256(bytes),
      ...(/dist\/assets\/.*\.js$/.test(path) ? { gzipBytes: gzipSync(bytes).length } : {}) };
  }));
}
export async function checkpoint(completed, operation, next, findings = []) {
  const record = { date: new Date().toISOString(), start: '2026-10-26T08:07:53Z',
    hardBoundary: '2026-10-26T11:07:53Z', completed, operation, next, findings,
    authorization: 'Continuous assistant-led Day 7, all 24 exercises; final user review; no publication/push/DNS/hosting.',
    limits: ['Human visual/live-motion approval pending', 'Field INP/physical-device sustained 60fps unmeasured',
      'Manual screen-reader/Safari/Firefox/physical devices untested', 'Day 3 production UI move/hash/framing gaps retained'] };
  await mkdir('docs/review/day07', { recursive: true });
  await writeFile('docs/review/day07/progress.json', JSON.stringify(record, null, 2) + '\n');
  const note = `\n\n## Day 7 active checkpoint — ${record.date}\n\nUser authorized continuous execution with review at the end. ${completed.length}/24 exercises completed. Operation: ${operation}\n\nNext: ${next}\n\nFindings: ${findings.join('; ')}. Existing 180-minute allocation started 26 October 13:37:53 IST; hard boundary 16:37:53 IST. Publication approval pending; no deployment/push/DNS/hosting. Current review: docs/DAY-07-REVIEW.md; exact progress: docs/review/day07/progress.json. Prior dated evidence remains historical.\n`;
  for (const path of ['HANDOFF.md', 'PROJECT-STATUS.md', 'PORTFOLIO-ROADMAP.md']) {
    let existing = await readFile(path, 'utf8');
    const marker='<!-- DAY07_CURRENT_END -->';
    if(existing.startsWith('# Engineering Atlas — Day 7') && existing.includes(marker))
      existing=existing.slice(existing.indexOf(marker)+marker.length).trimStart();
    await writeFile(path, '# Engineering Atlas — Day 7\n'+note+'\n'+marker+'\n\n'+existing);
  }
  return record;
}
