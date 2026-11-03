import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { output, identities, json } from './day07-common.mjs';
const read=async name=>JSON.parse(await readFile(`${output}/${name}.json`,'utf8'));
const frozen=await read('candidate-manifest');
const current=await identities(frozen.records.map(record=>record.path));
const drift=current.filter((record,index)=>record.sha256!==frozen.records[index].sha256);
if(drift.length)throw new Error('Frozen application changed: '+drift.map(r=>r.path).join(', '));
const [geometry,contrast,axe,motion,zoom,loading,focused,links]=await Promise.all([
  read('geometry'),read('contrast-summary'),read('axe-summary'),read('motion-summary'),read('zoom-200'),
  read('loading-summary'),read('focused-playwright'),read('destinations')]);
const full=JSON.parse(await readFile('docs/review/day07/pre-easing/playwright.json','utf8'));
const interactions=JSON.parse(await readFile('docs/review/day07/interaction-final/interactions.json','utf8'));
const prior=JSON.parse(await readFile('docs/review/day06/lcp-final/candidate-manifest.json','utf8'));
const assets=current.filter(record=>record.path.startsWith('public/'));
const changedAssets=assets.filter(record=>prior.records.find(p=>p.path===record.path)?.sha256!==record.sha256);
const geometryFailures=geometry.records.filter(r=>r.overflow||r.faces.some(f=>!f.contentBeforeFolio||r.width>=768&&(!f.contained||!f.folioInside)));
const html=await readFile('dist/index.html','utf8');
const inline=html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
const css=await readFile(current.find(r=>/dist\/assets\/.*\.css$/.test(r.path)).path,'utf8');
const budgets={animationGzipBytes:current.filter(r=>/dist\/assets\/animation-.*\.js$/.test(r.path)).reduce((s,r)=>s+r.gzipBytes,0),
  portraitBytes:current.find(r=>r.path==='public/images/editorial-portrait-960.webp').bytes,
  textureBytes:current.find(r=>r.path==='public/images/book-fiber.webp').bytes};
const testPass=stats=>stats.unexpected===0&&stats.flaky===0&&stats.skipped===0;
const gates={baselineFullRegression:testPass(full.stats),finalAffectedRegression:testPass(focused.stats),
  geometry:geometry.records.length===186&&!geometry.errors.length&&!geometryFailures.length,
  contrast:contrast.completePageModeCoverage&&!contrast.failures.length,
  axe:axe.completePageCoverage&&axe.violations===0,
  motionReliability:motion.sameEngine&&motion.imagesAttached&&motion.alternatingTurns===20&&!motion.errors.length,
  zoom:zoom.records.length===39&&!zoom.errors.length,
  unchangedPublicAssets:assets.length===64&&!changedAssets.length,
  inlineStyles:inline===css.replace(/<\/style/gi,'<\\/style'),
  animationBudget:budgets.animationGzipBytes<=60000,portraitBudget:budgets.portraitBytes<=200000,textureBudget:budgets.textureBytes<=30000,
  ...Object.fromEntries(Object.entries(loading.gates).flatMap(([device,checks])=>Object.entries(checks).map(([name,pass])=>[`${device}-${name}`,pass])))};
const summary={date:new Date().toISOString(),candidate:frozen.candidate,applicationManifestSha256:frozen.sha256,
  applicationUnchangedDuringFinalChecks:!drift.length,gates,
  baselineFullRegression:{...full.stats,provenance:'Complete suite on the first-turn fix, before the final crossfade-easing token correction. Preserved as pre-easing evidence.'},
  finalAffectedRegression:focused.stats,geometry:{states:geometry.records.length,errors:geometry.errors,failures:geometryFailures},
  contrast,axe,motion,zoomStates:zoom.records.length,loading:{medians:loading.medians,runs:loading.runs.map(({lcpInsight,...r})=>r),gates:loading.gates},budgets,
  localLabInteractions:interactions.records.map(r=>({width:r.width,warm:r.warm,traced:r.traced,maxEventMs:Math.max(0,...r.events.map(e=>e.duration))})),
  links:{total:links.length,unresolved:links.filter(r=>r.state.includes('unresolved')||r.state.includes('failure'))},
  styleCspHash:inline?'sha256-'+createHash('sha256').update(inline).digest('base64'):null,
  unchangedAssetCount:assets.length,packageLock:current.find(r=>r.path==='package-lock.json').sha256,
  humanReview:'pending end review',publicationAuthorized:false,readyForPublication:false,
  unmeasured:['field INP','sustained physical-device 60fps','manual screen-reader','Safari/Firefox/physical devices'],
  preservedEvidenceLimits:'Day 3 production-UI move/source-removal/returned-hash and exact capture-framing gaps remain.',
  host:'No provider/public origin selected; canonical/og:url/absolute social URL and hosted checks pending.'};
await json('summary',summary);
const defects=[
  {id:'D7-FIRST-TURN',status:'cold lab feedback improved; field target remains unmeasured',
    evidence:['interaction-cold/interactions.json','interaction-after/interactions.json','interaction-final/interactions.json'],
    finding:'Initial fresh-process phone samples 256–280ms; first fix cold phone samples 88–112ms. One warm232ms outlier retained; latest final bytes separately sampled.',
    next:'Review actual-device first turn and retained samples; do not claim field INP from this route.'},
  {id:'D7-QUALITY',status:Object.values(gates).every(Boolean)?'measured automatic gates pass; unmeasured gates remain':'some measured gates failed',gates,
    next:'Use exact final evidence. No release-ready claim until applicable required evidence/decisions are resolved.'},
  {id:'D7-REVIEW',status:'pending human visual/live-motion review and separate publication authorization',next:'Review final preview/package candidate; record concrete approval/corrections.'},
  {id:'D7-HOST',status:'host/public origin not selected',next:'After review/authorization select target, set real origin metadata and verify HTTPS/paths/headers/CSP/served bytes.'},
  {id:'D7-UNMEASURED',status:'unmeasured',items:summary.unmeasured,next:'Record actual device/browser/manual/field evidence; no substitution with RAF/TBT/Axe.'},
  {id:'D3-EVIDENCE',status:'unchanged',finding:summary.preservedEvidenceLimits,next:'Preserve factual disclosures; no live-account mutations authorized here.'}];
await writeFile('docs/review/day07/defects.json',JSON.stringify(defects,null,2)+'\n');
console.log(JSON.stringify({candidate:summary.candidate,gates,regression:full.stats.expected,finalFocused:focused.stats.expected,loading:loading.medians,budgets},null,2));
