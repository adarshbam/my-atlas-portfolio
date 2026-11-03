import { readFile } from 'node:fs/promises';
import { files, identities, json, sha256 } from './day07-common.mjs';
const paths=[...await files('src'),...await files('public'),...await files('dist'),
  'index.html','package.json','package-lock.json','vite.config.ts','tsconfig.json'];
const records=await identities(paths.sort());
const digest=sha256(JSON.stringify(records));
const previous=JSON.parse(await readFile('docs/review/day06/lcp-final/candidate-manifest.json','utf8'));
const changed=records.filter(record=>previous.records.find(old=>old.path===record.path)?.sha256!==record.sha256);
await json('candidate-manifest',{date:new Date().toISOString(),candidate:`day07-${digest.slice(0,12)}`,
  sha256:digest,records,changedFromDay6:changed.map(record=>record.path),node:process.version,
  approvedForPublication:false,humanReview:'pending end review',
  note:'Application source/public/config/lock/build frozen for final audits. Test/tool/document identities are saved with final package/evidence separately.'});
console.log(JSON.stringify({candidate:`day07-${digest.slice(0,12)}`,records:records.length,changed:changed.map(record=>record.path)}));
