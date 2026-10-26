import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { baseURL, output, json } from './day07-common.mjs';

let browser = await chromium.launch({ channel: 'msedge', headless: true });
const records = [];
try {
  for (const [width, warm, traceRequested] of [[375,false,true], [375,false,false], [375,false,false],
    [375,true,false], [1280,false,false], [1280,false,false]]) {
    const traced = traceRequested && process.env.DAY07_TRACE !== '0';
    if (records.length && process.env.DAY07_FRESH === '1') {
      await browser.close();
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__day07 = { events: [], longTasks: [] };
      for (const type of ['event', 'longtask']) {
        if (!PerformanceObserver.supportedEntryTypes.includes(type)) continue;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (type === 'event' && entry.interactionId) window.__day07.events.push({
              name: entry.name, start: entry.startTime, duration: entry.duration,
              processing: entry.processingEnd-entry.processingStart,
              inputDelay: entry.processingStart-entry.startTime,
              presentationDelay: entry.startTime+entry.duration-entry.processingEnd,
              interactionId: entry.interactionId });
            else if (type === 'longtask') window.__day07.longTasks.push({start:entry.startTime,duration:entry.duration});
          }
        }).observe({type,buffered:true,...(type==='event'?{durationThreshold:16}:{})});
      }
    });
    await page.goto(baseURL);
    await expect(page.locator('#book')).toHaveAttribute('data-ready','true');
    if (warm) await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1200)));
    const cdp = await context.newCDPSession(page);
    if (traced) await cdp.send('Tracing.start',{categories:'devtools.timeline,v8.execute,blink.user_timing',transferMode:'ReturnAsStream'});
    const actions = [];
    for (const name of ['Vault Storage', 'Contact']) {
      await page.evaluate(name => performance.mark('day07-before-'+name), name);
      await page.getByRole('navigation',{name:'Portfolio chapters'}).getByRole('button',{name,exact:true}).click();
      await expect(page.locator('#book')).toHaveAttribute('data-turning','false');
      actions.push({name,at:await page.evaluate(()=>performance.now())});
    }
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 300)));
    records.push({width,warm,traced,actions,...await page.evaluate(()=>window.__day07)});
    if (traced) {
      const done = new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
      await cdp.send('Tracing.end');
      const {stream}=await done;
      const chunks=[];
      while(true) { const chunk=await cdp.send('IO.read',{handle:stream}); chunks.push(Buffer.from(chunk.data,chunk.base64Encoded?'base64':'utf8')); if(chunk.eof)break; }
      await cdp.send('IO.close',{handle:stream});
      const trace = Buffer.concat(chunks);
      await writeFile(`${output}/interaction-trace.json.gz`,gzipSync(trace));
      const parsed=JSON.parse(trace).traceEvents;
      await json('trace-hotspots',parsed.filter(e=>e.ph==='X'&&e.dur>5000)
        .sort((a,b)=>b.dur-a.dur).slice(0,45).map(e=>({name:e.name,durationMs:e.dur/1000,ts:e.ts,pid:e.pid,tid:e.tid,data:e.args?.data})));
    }
    await context.close();
  }
} finally { await browser.close(); }
await json('interactions',{browser:browser.version(),freshProcesses:process.env.DAY07_FRESH==='1',conditions:'Sequential contexts; unthrottled localhost. Trace adds overhead if enabled; warm route has 1200ms idle. Short lab EventTiming, not field INP.',records});
console.log(JSON.stringify(records.map(r=>({width:r.width,warm:r.warm,traced:r.traced,maxMs:Math.max(0,...r.events.map(e=>e.duration)),maxProcessingMs:Math.max(0,...r.events.map(e=>e.processing)),longTasks:r.longTasks})),null,2));
