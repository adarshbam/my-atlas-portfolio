import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { files, identities, sha256 } from './day07-common.mjs';

const release='release/day07';
const stage='tmp/day07/package-stage';
const baseFiles=['package.json','package-lock.json','index.html','vite.config.ts','playwright.config.ts',
  'tsconfig.json','.gitignore','README.md','AGENTS.md','HANDOFF.md','PROJECT-STATUS.md',
  'PORTFOLIO-ROADMAP.md','TOOLING.md','docs/DAY-07-DELIVERY.md','docs/DAY-07-REVIEW.md',
  'docs/DAY-07-BACKLOG.md','docs/DAY-07.md','docs/DAY-07-PREPARATION.md'];
const verification=['audit-day07','review-day07','check-day07-contrast','record-day07-turns',
  'check-day07-zoom','check-day07-links','profile-day07-interaction','check-day07-package','day07-common'];
const sourcePaths=[...baseFiles,...await files('src'),...await files('public'),...await files('tests'),
  ...await files('.agents/skills/engineering-atlas'),...verification.map(name=>`scripts/${name}.mjs`)];
const sitePaths=await files('dist');
const source=await identities([...new Set(sourcePaths)].sort());
const site=(await identities(sitePaths)).map(record=>({...record,path:record.path.slice(5)}));
const frozen=JSON.parse(await readFile('docs/review/day07/final/candidate-manifest.json','utf8'));
const appNow=await identities(frozen.records.map(record=>record.path));
if(appNow.some((record,index)=>record.sha256!==frozen.records[index].sha256))throw new Error('Frozen app drift before packaging');
const appIdentity=frozen.sha256;
const candidate=frozen.candidate;
await mkdir(release,{recursive:true});
const licenseSources=[
  ['React','node_modules/react/LICENSE'],['React DOM','node_modules/react-dom/LICENSE'],
  ['Scheduler','node_modules/scheduler/LICENSE'],['StPageFlip','node_modules/page-flip/LICENSE'],
  ['Motion','node_modules/motion/LICENSE.md'],['Motion DOM','node_modules/motion-dom/LICENSE.md'],
  ['Motion Utils','node_modules/motion-utils/LICENSE.md'],['Lucide','node_modules/lucide-react/LICENSE'],
  ['Cormorant Garamond','node_modules/@fontsource/cormorant-garamond/LICENSE'],
  ['EB Garamond','node_modules/@fontsource/eb-garamond/LICENSE'],
];
let notices='Engineering Atlas — bundled third-party notices\n\n';
for(const [name,path] of licenseSources) {
  let text;
  try { text=await readFile(path,'utf8'); }
  catch { throw new Error(`Inspect installed license path before packaging: ${path}`); }
  notices+=`\n=== ${name} ===\n${text}\n`;
}
const noticeBytes=Buffer.from(notices);
await writeFile(`${release}/THIRD-PARTY-NOTICES.txt`,noticeBytes);
for(const [kind,records,prefix] of [['source',source,''],['site',site,'dist/']]) {
  for(const record of records) {
    if(/(^|\/)(?:node_modules|\.git|\.env(?:\..*)?|config\.toml)(\/|$)/i.test(record.path))
      throw new Error(`Excluded path in archive: ${record.path}`);
    const target=`${stage}/${kind}/${record.path}`;
    await mkdir(dirname(target),{recursive:true});
    await copyFile(prefix+record.path,target);
  }
  await writeFile(`${stage}/${kind}/THIRD-PARTY-NOTICES.txt`,noticeBytes);
}
source.push({path:'THIRD-PARTY-NOTICES.txt',bytes:noticeBytes.length,sha256:sha256(noticeBytes)});
site.push({path:'THIRD-PARTY-NOTICES.txt',bytes:noticeBytes.length,sha256:sha256(noticeBytes)});
const sensitive=[];
for(const record of source.filter(record=>/\.(?:tsx?|mjs|json|html|md|css|txt)$/.test(record.path))) {
  const bytes=await readFile(`${stage}/source/${record.path}`,'utf8');
  if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bghp_[A-Za-z0-9]{25,}|\bgithub_pat_[A-Za-z0-9_]{25,}|\bAKIA[A-Z0-9]{16}\b|\bsk-proj-[A-Za-z0-9_-]{25,}/.test(bytes))
    sensitive.push(record.path);
}
if(sensitive.length)throw new Error(`Review sensitive-pattern files before distribution: ${sensitive.join(', ')}`);
const manifest={date:new Date().toISOString(),candidate,appIdentity,
  source:source.sort((a,b)=>a.path.localeCompare(b.path)),site:site.sort((a,b)=>a.path.localeCompare(b.path)),
  node:process.version,packageLock:source.find(record=>record.path==='package-lock.json').sha256,
  stage,sourceExtractionRoot:process.env.DAY07_SOURCE_ROOT??'tmp/day07/extracted-source',
  publicationAuthorized:false,approval:'pending final human review',
  contentReview:'64 public assets match approved predecessor. Six full-resolution Vault captures, legacy workspace/dialog and original reviewer photo inspected; no credentials or private customer records observed. Demo email/fixture names and author identity are intentional.',
  sensitivePatternMatches:sensitive,
  excluded:['.env/account configuration','.git','node_modules','raw evidence/captures outside public','unrelated projects','live-account scripts'],
  limitations:['field INP','physical-device sustained 60fps','manual screen-reader','Safari/Firefox/physical devices',
    'Day 3 production UI move/hash/framing evidence','public origin/host/canonical/social URL','human final acceptance']};
await writeFile(`${release}/package-manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({candidate,sourceFiles:source.length,siteFiles:site.length,stage}));
