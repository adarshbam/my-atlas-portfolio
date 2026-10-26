import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { chromium, expect, request } from '@playwright/test';
import { baseURL, json, sha256 } from './day07-common.mjs';

const manifest = JSON.parse(await readFile('release/day07/package-manifest.json','utf8'));
const client = await request.newContext({ timeout: 12000 });
const responses = [];
try {
  for (const record of manifest.site) {
    const response = await client.get(`${baseURL}/${record.path==='index.html'?'':record.path}`);
    const body = await response.body();
    const contentType = response.headers()['content-type'] ?? '';
    expect(response.status(),record.path).toBe(200);
    expect(sha256(body),record.path).toBe(record.sha256);
    const types={'.html':/text\/html/,'.js':/(?:text|application)\/javascript/,'.css':/text\/css/,
      '.woff2':/font\/woff2/,'.webp':/image\/webp/,'.jpg':/image\/jpeg/,'.png':/image\/png/,
      '.svg':/image\/svg\+xml/,'.ico':/image\/(?:x-icon|vnd.microsoft.icon)/,'.txt':/text\/plain/,
      '.pdf':/application\/pdf/};
    if(types[extname(record.path)]) expect(contentType,record.path).toMatch(types[extname(record.path)]);
    if (!record.path.endsWith('.html')) expect(contentType,record.path).not.toContain('text/html');
    if(record.path.endsWith('.pdf')) {
      expect(contentType).toContain('application/pdf');
      expect(body.subarray(0,5).toString()).toBe('%PDF-');
      expect(sha256(body)).toBe('07cfd35fd117b2eb3fb26bf4d0956cebb2dd53d16a3e0dc62482f6f998c17daa');
    }
    responses.push({path:record.path,bytes:body.length,contentType,sha256:sha256(body)});
  }
} finally { await client.dispose(); }
const browser=await chromium.launch({channel:'msedge',headless:true});
const smoke=[];
try {
  for(const width of [375,1280]) for(const mode of ['native','reduced','reading']) {
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===375,
      reducedMotion:mode==='reduced'?'reduce':'no-preference'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await page.goto(baseURL);
    const book=page.locator('#book');
    await expect(book).toHaveAttribute('data-ready','true');
    await expect(page).toHaveTitle('Adarsh Singh — Engineering Atlas');
    if(mode==='reading') await page.getByRole('button',{name:'Reading mode',exact:true}).click();
    for(const name of ['Vault Storage','Pipeline','Harigurus','References','Security Lab','Contact']) {
      await page.getByRole('navigation',{name:'Portfolio chapters'}).getByRole('button',{name,exact:true}).click();
      await expect(book).toHaveAttribute('data-turning','false');
      await expect(page.getByRole('status')).toContainText('of 13');
    }
    const scope=mode==='native'?'.library-slot':mode==='reading'?'.reading-document':'.plain-face[aria-hidden=false]';
    const contact=page.locator(`${scope} [data-page-id="colophon"]`);
    const resume=contact.getByRole('link',{name:'Download résumé (PDF)',exact:true});
    await resume.scrollIntoViewIfNeeded();
    await resume.focus();
    const download=page.waitForEvent('download');
    await resume.press('Enter');
    expect((await download).suggestedFilename()).toBe('Adarsh-Singh-Resume.pdf');
    await expect(contact.locator('a[href^="mailto:"]')).toHaveAttribute('href','mailto:adarshbambahadur@gmail.com');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
    expect(await page.evaluate(()=>!!document.activeElement?.closest('[inert]'))).toBe(false);
    expect(errors).toEqual([]);
    smoke.push({width,mode,errors,download:true,overflow:false});
    await context.close();
  }
} finally { await browser.close(); }
await json('package-delivery',{date:new Date().toISOString(),baseURL,candidate:manifest.candidate,
  browser:browser.version(),responses,smoke,publicationAuthorized:false});
console.log(JSON.stringify({files:responses.length,smokeStates:smoke.length,baseURL}));
