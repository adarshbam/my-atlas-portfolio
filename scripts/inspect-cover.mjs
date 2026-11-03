import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://127.0.0.1:5173/');
await page.waitForTimeout(1000);

const cover = await page.evaluate(() => {
  const coverEl = document.querySelector('.page--cover');
  if (!coverEl) return { found: false };
  
  const rect = coverEl.getBoundingClientRect();
  const styles = window.getComputedStyle(coverEl);
  
  const children = Array.from(coverEl.querySelectorAll('*')).map(el => {
    const r = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    return {
      tag: el.tagName,
      className: el.className,
      text: el.children.length === 0 ? el.textContent.trim() : undefined,
      color: cs.color,
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily,
      letterSpacing: cs.letterSpacing,
      lineHeight: cs.lineHeight,
      top: Math.round(r.top - rect.top),
      left: Math.round(r.left - rect.left),
      width: Math.round(r.width),
      height: Math.round(r.height)
    };
  }).filter(c => c.text || (typeof c.className === 'string' && (c.className.includes('rule') || c.className.includes('art') || c.className.includes('spine') || c.className.includes('head') || c.className.includes('footer'))));

  return {
    found: true,
    rect: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      left: Math.round(rect.left)
    },
    bg: styles.backgroundColor,
    children
  };
});

console.log(JSON.stringify(cover, null, 2));

// Also take a screenshot of just the cover element
const coverElement = await page.$('.page--cover');
if (coverElement) {
  await coverElement.screenshot({ path: 'tmp/current_cover_only.png' });
  console.log('Cover only screenshot saved to tmp/current_cover_only.png');
}

// And screenshot of the whole book-shell
const bookShell = await page.$('.book-shell');
if (bookShell) {
  await bookShell.screenshot({ path: 'tmp/current_book_shell.png' });
  console.log('Book shell screenshot saved to tmp/current_book_shell.png');
}

await browser.close();
