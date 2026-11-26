import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { goToChapter } from './helpers/book';
import { pages } from '../src/data/portfolio';

// The suite uses loopback fixtures only, including on hosts with a system proxy.
test.use({ launchOptions: { args: ['--no-proxy-server'] } });

const fixturePath = resolve('tmp/video-tests/playback.mp4');
const fixture = {
  title: 'Meet Adarsh — playback test', src: '/media/profile/test.mp4',
  poster: '/media/profile/test.webp', captions: '/media/profile/test.vtt',
  durationSeconds: 2, 
};
test.beforeAll(() => {
  mkdirSync(resolve('tmp/video-tests'), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=0xefe9de:s=640x360:r=24', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', fixturePath], { windowsHide: true });
});

async function recordings(page: Page, fail = false) {
  const manifest = JSON.stringify({ introduction: fixture, vault: { ...fixture, title: 'Vault — playback test' }, story: { ...fixture, title: 'Story — playback test' } });
  // Browser-only module substitution: never edits or enables the shipped manifest.
  await page.route('**/src/data/portfolio-videos.json*', route => route.fulfill({
    contentType: 'text/javascript', body: `export default ${manifest};`,
  }));
  await page.route('**/assets/atlas-*.js', route => {
    const code = readFileSync(resolve('dist', `.${new URL(route.request().url()).pathname}`), 'utf8');
    // Match the minified manifest whatever each entry holds (null or a recorded object).
    const entry = '(?:null|\\{[^{}]*\\})';
    const marker = new RegExp(`\\{introduction:${entry},vault:${entry},story:${entry}\\}`);
    expect(code).toMatch(marker);
    return route.fulfill({ contentType: 'text/javascript', body: code.replace(marker, () => manifest) });
  });
  await page.route('**/media/profile/test.mp4', route => fail ? route.fulfill({ status: 404 }) : route.fulfill({ contentType: 'video/mp4', body: readFileSync(fixturePath) }));
  await page.route('**/media/profile/test.webp', route => route.fulfill({ contentType: 'image/webp', body: readFileSync('public/images/editorial-portrait-480.webp') }));
  await page.route('**/media/profile/test.vtt', route => route.fulfill({ contentType: 'text/vtt', body: 'WEBVTT\n\n00:00.000 --> 00:02.000\nPlayback test fixture.\n' }));
}

test('only recorded entries have watch links', async ({ page }) => {
  const media: string[] = [];
  page.on('request', r => { if (/\.(mp4|vtt)(\?|$)/.test(r.url())) media.push(r.url()); });
  await page.goto('/#book'); await expect(page.locator('#book')).toHaveAttribute('data-ready', 'true');
  // The page engine keeps a hidden copy of the cover; count what a reader can see.
  // One on the cover; the run carries two of its own, counted below: the link in the opening
  // scene and the film still in the Vault scene (plan Task 11, 23 November 2026).
  await expect(page.locator('#book [data-portfolio-video]:visible')).toHaveCount(1);
  await expect(page.locator('.atlas-run [data-portfolio-video="introduction"]')).toHaveCount(2);
  await expect(page.locator('.atlas-run [data-scene="vault"] button.atlas-reel[data-portfolio-video="introduction"]')).toHaveCount(1);
  await expect(page.locator('#book [data-portfolio-video="introduction"]:visible')).toHaveCount(1);
  await expect(page.locator('[data-portfolio-video]:not([data-portfolio-video="introduction"])')).toHaveCount(0);
  // Every page of the book, whether or not it is open (the engine's source copy holds them all).
  await expect(page.locator('.page-measure-source .book-page')).toHaveCount(pages.length);
  await expect(page.locator('.page-measure-source [data-portfolio-video]')).toHaveCount(1);
  await expect(page.locator('.page-measure-source [data-portfolio-video="vault"]')).toHaveCount(0);
  await page.goto('/story'); await expect(page.locator('.obs-hero h1')).toBeVisible();
  await expect(page.locator('[data-portfolio-video]')).toHaveCount(0);
  // Nothing plays or downloads until someone asks for it.
  expect(media).toEqual([]);
});

for (const width of [375, 768, 1280, 1920]) for (const reduced of [false, true]) {
  test(`${width} reduced=${reduced}: optional video, controls, transcript, cleanup and navigation`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await recordings(page);
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
    const media: string[] = []; page.on('request', r => { if (r.url().includes('/media/profile/')) media.push(r.url()); });
    await page.goto('/#book'); await expect(page.locator('#book')).toHaveAttribute('data-ready', 'true');
    const trigger = page.locator('#book [data-portfolio-video="introduction"]:visible').first();
    await expect(trigger).toContainText('0:02');
    const bounds = await trigger.boundingBox(); expect(bounds!.height).toBeGreaterThanOrEqual(43.5);
    const cover = trigger.locator('xpath=ancestor::article');
    const copyBounds = await cover.locator('.portrait-cover-copy').boundingBox();
    const noteBounds = await cover.locator('.portrait-cover-note').boundingBox();
    const footerBounds = await cover.locator('.portrait-cover-footer').boundingBox();
    expect(noteBounds!.y).toBeGreaterThanOrEqual(copyBounds!.y + copyBounds!.height);
    expect(footerBounds!.y).toBeGreaterThanOrEqual(noteBounds!.y + noteBounds!.height);
    expect(media).toEqual([]);
    await page.screenshot({ path: `docs/review/video/${width}-${reduced}-cover.png` });
    await trigger.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: fixture.title });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
    const video = dialog.locator('video');
    expect(await video.evaluate((v: HTMLVideoElement) => ({ paused: v.paused, autoplay: v.autoplay, preload: v.preload, controls: v.controls }))).toEqual({ paused: true, autoplay: false, preload: 'none', controls: true });
    await expect(video.locator('track')).toHaveAttribute('kind', 'captions');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.book-shell')).toHaveAttribute('data-logical-page', '0');
    await expect(dialog.locator('details')).toHaveCount(0);
    await video.evaluate(async (v: HTMLVideoElement) => { v.muted = true; await v.play(); });
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.textTracks[0]?.cues?.length)).toBe(1);
    const axe = await new AxeBuilder({ page }).include('.media-inspector').analyze();
    expect(axe.violations.map(v => v.id)).toEqual([]);
    await page.screenshot({ path: `docs/review/video/${width}-${reduced}-player.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const oldVideo = await video.elementHandle();
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
    expect(await oldVideo!.evaluate((v: HTMLVideoElement) => v.paused && !v.hasAttribute('src'))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
    await trigger.click(); await dialog.getByRole('button', { name: 'Explore Vault', exact: true }).click();
    await expect(page.locator('.book-shell')).toHaveAttribute('data-logical-page', '3');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('#book')).toHaveAttribute('data-turning', 'false');
    const vaultTrigger = page.locator('#book [data-page-id="vault"] [data-portfolio-video="vault"]:visible');
    await expect(vaultTrigger).toHaveCount(1);
    await vaultTrigger.click(); await expect(page.getByRole('dialog', { name: 'Vault — playback test' })).toBeVisible();
    await page.keyboard.press('Escape'); await expect(vaultTrigger).toBeFocused();
    await goToChapter(page, 'Cover');
    await expect(page.locator('#book')).toHaveAttribute('data-current-page', '0');
    await expect(page.locator('#book')).toHaveAttribute('data-turning', 'false');
    await trigger.click();
    await dialog.getByRole('button', { name: 'Explore Vault', exact: true }).click();
    await expect(page.locator('.book-shell')).toHaveAttribute('data-logical-page', '3');
    await page.goto('/story');
    const storyTrigger = page.locator('[data-portfolio-video="story"]'); await storyTrigger.click();
    const storyDialog = page.getByRole('dialog', { name: 'Story — playback test' });
    await expect(storyDialog).toBeVisible();
    await storyDialog.getByRole('button', { name: 'Continue the story' }).click();
    await expect(page.locator('#school h2')).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test('failed recording reports the error; navigation cleans up', async ({ page }) => {
  await recordings(page, true); await page.goto('/#book');
  await expect(page.locator('#book')).toHaveAttribute('data-ready', 'true');
  await page.locator('#book [data-portfolio-video="introduction"]:visible').first().click();
  const dialog = page.getByRole('dialog', { name: fixture.title });
  await dialog.locator('video').evaluate((v: HTMLVideoElement) => v.load());
  await expect(dialog.locator('.media-inspector-caption')).toContainText('could not load');
  await expect(dialog.locator('details')).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')));
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
});
