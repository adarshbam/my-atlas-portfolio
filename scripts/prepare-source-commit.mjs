import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function files(root) {
  const result=[];
  for(const entry of await readdir(root,{withFileTypes:true})) {
    const path=`${root}/${entry.name}`;
    if(entry.isSymbolicLink())throw new Error(`Review symlink before publication: ${path}`);
    if(entry.isDirectory())result.push(...await files(path));else result.push(path);
  }
  return result;
}
const verification=['audit-day07','review-day07','check-day07-contrast','record-day07-turns',
  'check-day07-zoom','check-day07-links','profile-day07-interaction','check-day07-package',
  'day07-common','check-contact-update','prepare-source-commit'];
const roots=['src','public','tests','.agents/skills/engineering-atlas'];
const selected=[...(await Promise.all(roots.map(files))).flat(),...verification.map(name=>`scripts/${name}.mjs`),
  'package.json','package-lock.json','vite.config.ts','tsconfig.json','playwright.config.ts','index.html',
  '.gitignore','.gitattributes','components.json','.21st/design.json','README.md','AGENTS.md','GEMINI.md','TOOLING.md',
  'HANDOFF.md','PROJECT-STATUS.md','PORTFOLIO-ROADMAP.md','THIRD-PARTY-NOTICES.txt',
  'docs/DAY-01-PROPOSAL.md','docs/DAY-07.md','docs/DAY-07-PREPARATION.md','docs/DAY-07-REVIEW.md',
  'docs/DAY-07-DELIVERY.md','docs/DAY-07-BACKLOG.md','docs/CONTACT-UPDATE.md'];
const paths=[...new Set(selected)].sort();
const findings=[], records=[];
for(const path of paths) {
  if(/(^|\/)(?:node_modules|\.git|\.env(?:\..*)?|config\.toml)(\/|$)|^(?:release|tmp|dist|docs\/(?:review|evidence|artwork))\//.test(path))
    throw new Error(`Excluded path in source selection: ${path}`);
  const bytes=await readFile(path);
  if(bytes.length>50_000_000)throw new Error(`Large file needs separate review: ${path}`);
  if(/\.(?:tsx?|mjs|json|md|html|css|txt|ya?ml)$/.test(path)) {
    const text=bytes.toString();
    if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bghp_[A-Za-z0-9]{25,}|\bgithub_pat_[A-Za-z0-9_]{25,}|\bAKIA[A-Z0-9]{16}\b|\bsk-proj-[A-Za-z0-9_-]{25,}/.test(text))findings.push(path);
  }
  records.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
if(findings.length)throw new Error('Review sensitive-pattern files before publication: '+findings.join(', '));
await mkdir('tmp/source-commit',{recursive:true});
await writeFile('tmp/source-commit/paths.nul',paths.join('\0')+'\0');
await writeFile('tmp/source-commit/manifest.json',JSON.stringify({date:new Date().toISOString(),
  destination:'https://github.com/adarshbam/my-atlas-portfolio.git',records,sensitivePatternMatches:findings,
  note:'Explicit source/assets/config/tests/current documentation allowlist. Private provenance, raw captures, caches and generated ZIPs excluded.'},null,2)+'\n');
console.log(JSON.stringify({files:records.length,bytes:records.reduce((s,r)=>s+r.bytes,0),sensitivePatternMatches:findings.length}));
