// Adapt historical methods without modifying or overwriting their evidence.
import { readFile, writeFile } from 'node:fs/promises';
const read = (name) => readFile(`scripts/${name}`, 'utf8');
const save = (name, text) => writeFile(`scripts/${name}`, text);
let geometry = await read('review-day04.mjs');
geometry = geometry.replaceAll('day04', 'task5-0').replaceAll('DAY04_WIDTH', 'TASK50_WIDTH');
geometry = geometry.replace('const targets = width < 768 ? [3, 4, 5, 6, 7, 8, 9, 10] : [3, 5, 7, 9];', `const targets = pages.map((_, index) => index).filter(index => index >= pages.findIndex(p => p.id === 'vault') && (width < 768 || index % 2 === 1));`);
await save('review-task5-0.mjs', geometry);
let contrast = await read('check-day04-contrast.mjs');
contrast = `import { pages } from '../src/data/portfolio.ts';\n` + contrast.replaceAll('day04', 'task5-0').replaceAll('DAY04_WIDTH', 'TASK50_WIDTH');
contrast = contrast.replace('name: "Vault Storage"', 'name: "References"');
contrast = contrast.replace('for (const index of width < 768\n      ? [3, 4, 5, 6, 7, 8, 9, 10]\n      : [3, 5, 7, 9])', `for (const index of pages.map((p, index) => ({p, index})).filter(({p, index}) => p.kind === 'references' && (width < 768 || index % 2 === 1)).map(({index}) => index))`);
// Normalize CRLF in the source before replacing the multiline target expression.
contrast = contrast.replace(/for \(const index of width < 768\s*\? \[3, 4, 5, 6, 7, 8, 9, 10\]\s*: \[3, 5, 7, 9\]\)/, `for (const index of pages.map((p, index) => ({p, index})).filter(({p, index}) => p.kind === 'references' && (width < 768 || index % 2 === 1)).map(({index}) => index))`);
contrast = contrast.replace('if (index > 3)', `if (index > pages.findIndex(p => p.id === 'references'))`);
await save('check-task5-0-contrast.mjs', contrast);
let audit = await read('audit-day04.mjs');
audit = audit.replaceAll('day04', 'task5-0');
// Registry-derived traversal already covers every new and retained surface.
await save('audit-task5-0.mjs', audit);
let replay = await read('record-day04-turns.mjs');
replay = `import { pages } from '../src/data/portfolio.ts';\nconst referenceIndex = pages.findIndex(p => p.id === 'references');\nconst closingIndex = pages.findIndex(p => p.id === 'security-lab');\n` + replay.replaceAll('day04', 'task5-0');
replay = replay.replaceAll('settled(9)', 'settled(closingIndex)').replaceAll('settled(7)', 'settled(referenceIndex)').replaceAll('.vault-figure img', '.reference img');
await save('record-task5-0-turns.mjs', replay);
console.log('Prepared four registry-aware Task 5.0 verification scripts.');
