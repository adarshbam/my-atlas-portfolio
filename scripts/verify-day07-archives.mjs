import { readFile, writeFile } from 'node:fs/promises';
import { files, identities, sha256 } from './day07-common.mjs';
const manifest=JSON.parse(await readFile('release/day07/package-manifest.json','utf8'));
const checks={};
for(const kind of ['site','source']) {
  const root=kind==='source'?(manifest.sourceExtractionRoot??'tmp/day07/extracted-source'):'tmp/day07/extracted-site';
  const expected=manifest[kind];
  const current=await identities(expected.map(record=>`${root}/${record.path}`));
  const mismatches=current.filter((record,index)=>record.sha256!==expected[index].sha256);
  const archive=`release/day07/engineering-atlas-${kind}.zip`;
  const bytes=await readFile(archive);
  checks[kind]={path:archive,bytes:bytes.length,sha256:sha256(bytes),extractedFiles:expected.length,
    allExtractedHashesMatch:!mismatches.length,mismatches:mismatches.map(r=>r.path)};
}
const sourceRoot=manifest.sourceExtractionRoot??'tmp/day07/extracted-source';
const builtRoot=`${sourceRoot}/dist`;
const built=(await identities(await files(builtRoot))).map(record=>({...record,path:record.path.slice(builtRoot.length+1)}));
const expectedBuild=manifest.site.filter(record=>record.path!=='THIRD-PARTY-NOTICES.txt');
const buildMismatches=expectedBuild.filter(record=>built.find(r=>r.path===record.path)?.sha256!==record.sha256);
const buildExtras=built.filter(record=>!expectedBuild.some(r=>r.path===record.path));
const frozen=JSON.parse(await readFile('docs/review/day07/final/candidate-manifest.json','utf8'));
const app=await identities(frozen.records.map(record=>record.path));
const appMismatches=app.filter((record,index)=>record.sha256!==frozen.records[index].sha256);
const result={date:new Date().toISOString(),candidate:manifest.candidate,archives:checks,
  sourceRebuild:{node:process.version,command:'npm run build',cwd:sourceRoot,
    dependencies:'Existing installed dependencies resolved from workspace ancestor; unchanged saved lockfile. Fresh online npm ci not performed.',
    files:built.length,expectedFiles:expectedBuild.length,allBuildHashesMatch:!buildMismatches.length&&!buildExtras.length&&built.length===expectedBuild.length,
    mismatches:buildMismatches.map(r=>r.path),extras:buildExtras.map(r=>r.path)},
  originalApplicationUnchanged:!appMismatches.length,originalApplicationRecords:app.length,
  sourceSnapshotNote:'Final source ZIP includes the complete documentation refresh. Its extracted files and rebuilt website are independently rechecked. Archive identities and final verification are external to the archive to avoid self-referential hashes.',
  publicationAuthorized:false,readyForPublication:false};
await writeFile('release/day07/package-verification.json',JSON.stringify(result,null,2)+'\n');
await writeFile('release/day07/SHA256SUMS.txt',Object.values(checks).map(r=>`${r.sha256}  ${r.path.split('/').at(-1)}`).join('\n')+'\n');
console.log(JSON.stringify(result,null,2));
if(Object.values(checks).some(r=>!r.allExtractedHashesMatch)||!result.sourceRebuild.allBuildHashesMatch||!result.originalApplicationUnchanged)process.exitCode=1;
