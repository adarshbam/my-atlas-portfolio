import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = { starts: 0, contexts: 0, tones: 0 };
    (window as any).__audio = state;
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        state.contexts++;
      }
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (
      ...args: Parameters<typeof start>
    ) {
      state.starts++;
      return start.apply(this, args);
    };
    const toneStart = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args: Parameters<typeof toneStart>) {
      state.tones++;
      return toneStart.apply(this, args);
    };
  });
});
const open = async (page: any) => {
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
};

test("silent by default, explicit opt-in persists, no single-letter shortcut", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.endsWith(".mp3")) requests.push(r.url());
  });
  await open(page);
  const toggle = page.locator(".audio-toggle");
  await expect(toggle).toHaveText("Enable sound");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
  expect(requests).toHaveLength(0);
  expect(await page.evaluate(() => (window as any).__audio.contexts)).toBe(0);
  await page.keyboard.press("m");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect.poll(() => requests.length).toBe(5);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.click();
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
});

test("recorded cues follow completed turns; mute and reduced motion suppress playback", async ({
  page,
}) => {
  await open(page);
  await page.locator(".audio-toggle").click();
  await page.evaluate(async () => {
    const path = "/src/lib/audio/sound-engine.ts";
    const { soundEngine } = await import(path);
    await soundEngine.prepare();
  });
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "1");
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
  // One sustained opening texture and one confirmed landing; no impact layer.
  expect(await page.evaluate(() => (window as any).__audio.starts)).toBe(2);
  // Wait beyond the removed delayed opening accent: only recorded foley should play.
  await page.waitForTimeout(650);
  expect(await page.evaluate(() => (window as any).__audio.tones)).toBe(0);
  await page.locator(".audio-toggle").click();
  const count = await page.evaluate(() => (window as any).__audio.starts);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "3");
  expect(await page.evaluate(() => (window as any).__audio.starts)).toBe(count);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".audio-toggle").click();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  expect(await page.evaluate(() => (window as any).__audio.starts)).toBe(count);
});

test("duplicate starts, cancellation, voice limit and hidden-tab cleanup", async ({
  page,
}) => {
  await open(page);
  await page.locator(".audio-toggle").click();
  const result = await page.evaluate(async () => {
    const path = "/src/lib/audio/sound-engine.ts";
    const { soundEngine: e } = await import(path);
    await e.prepare();
    const event = {
      id: "gesture",
      kind: "page",
      from: 1,
      to: 3,
      phase: "start",
    };
    e.dispatch(event);
    e.dispatch(event);
    const starts = (window as any).__audio.starts;
    e.dispatch({ ...event, phase: "update", progress: 0.4, velocity: -0.5 });
    e.dispatch({ ...event, phase: "cancel" });
    const afterCancel = (window as any).__audio.starts;
    for (let i = 0; i < 12; i++) e.authorSelected();
    const voices = e.voices.size;
    e.hide();
    return {
      starts,
      afterCancel,
      voices,
      remaining: e.voices.size,
      sessions: e.interactions.size,
    };
  });
  expect(result.starts).toBe(1);
  expect(result.afterCancel).toBe(1);
  expect(result.voices).toBeLessThanOrEqual(3);
  expect(result.remaining).toBe(0);
  expect(result.sessions).toBe(0);
});

test("failed audio assets never block opening and are not replayed late", async ({
  page,
}) => {
  await page.route("**/audio/*.mp3", (route) => route.abort());
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await page.locator(".audio-toggle").click();
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await expect(page.locator("#book")).toHaveAttribute("data-current-page", "1");
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
  expect(await page.evaluate(() => (window as any).__audio.starts)).toBe(0);
  expect(errors).toEqual([]);
});
