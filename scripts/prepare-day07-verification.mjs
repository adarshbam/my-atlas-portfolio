import { readFile, writeFile } from 'node:fs/promises';
for (const name of ['audit', 'review', 'check-contrast', 'record-turns', 'check-zoom', 'check-links']) {
  const stem = name === 'audit' || name === 'review'
    ? `${name}-day06` : name.replace('-', '-day06-');
  const target = stem.replace('day06','day07');
  const code = (await readFile(`scripts/${stem}.mjs`,'utf8'))
    .replaceAll('day06','day07').replaceAll('DAY06','DAY07');
  await writeFile(`scripts/${target}.mjs`,code);
  console.log(target);
}
