import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const output = 'docs/review/final-update';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
try {
  for (const width of [375, 768, 1280, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4177/');
    await page.locator('#book[data-ready="true"]').waitFor();
    await page.screenshot({ path: `${output}/${width}-cover.png`, fullPage: true });
    await page.getByRole('button', { name: 'Open book', exact: true }).click();
    await page.locator('#book[data-logical-page="1"][data-turning="false"]').waitFor();
    await page.screenshot({ path: `${output}/${width}-map.png`, fullPage: true });
    const ink = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink').trim());
    for (const mode of ['native', 'reading', 'reduced']) {
      if (mode === 'reading') await page.getByRole('button', { name: 'Reading mode', exact: true }).click();
      if (mode === 'reduced') {
        await page.getByRole('button', { name: 'Return to book', exact: true }).click();
        await page.emulateMedia({ reducedMotion: 'reduce' });
      }
      await page.getByRole('button', { name: 'References', exact: true }).click();
      const srihari = page.getByRole('tab', { name: 'Srihari Kestur', exact: true });
      await srihari.click();
      await page.waitForTimeout(500);
      if (await srihari.getAttribute('aria-selected') !== 'true') throw Error(`${width}/${mode}: selection lost`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      results.push({ width, mode, ink, overflow, errors: [...errors] });
      await page.screenshot({ path: `${output}/${width}-${mode}-references.png`, fullPage: mode !== 'reading' });
      if (overflow || errors.length || ink !== '#000000') throw Error(JSON.stringify(results.at(-1)));
    }
    await page.close();
  }
} finally {
  await fs.writeFile(`${output}/smoke.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results));

