import { readFile, writeFile } from 'node:fs/promises';
import { checkpoint } from './day07-common.mjs';
const old=JSON.parse(await readFile('docs/review/day07/progress.json','utf8'));
const additions=(process.argv[2]??'').split(',').filter(Boolean);
if(additions.some(id=>!/^7\.[1-4]\.[1-6]$/.test(id)))throw new Error('Invalid exercise ID');
const completed=[...new Set([...old.completed,...additions])].sort();
const operation=process.argv[3]??old.operation;
const next=process.argv[4]??old.next;
await checkpoint(completed,operation,next,process.argv.slice(5));
let plan=await readFile('docs/DAY-07.md','utf8');
plan=plan.replace(/^(\| (7\.[1-4]\.[1-6]) \| [^\n]+ \| )(?:Pending|Complete) \|$/gm,
  (_,prefix,id)=>prefix+(completed.includes(id)?'Complete':'Pending')+' |');
await writeFile('docs/DAY-07.md',plan);
console.log(JSON.stringify({completed:completed.length,operation,next}));
