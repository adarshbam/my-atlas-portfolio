import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

// Story trailer, seven scenes (docs/STORY-TRAILER-2026-11-22.md).
const chapterIds: string[] = JSON.parse(readFileSync("src/story/data.json", "utf8")).chapters.map(
  (chapter: { id: string }) => chapter.id,
);
const sceneIds = ["look", "ask", "code", "make", "deliver", "close"];

/** Scrolls to a fraction of one scene, measured the same way as the segment table. */
const scrollScene = (page: Page, id: string, fraction: number) =>
  page.evaluate(
    ([sceneId, f]) => {
      const track = document.querySelector<HTMLElement>(".obs-trailer")!;
      const scene = document.querySelector<HTMLElement>(`[data-scene="${sceneId}"]`)!;
      const total = Number(getComputedStyle(track).getPropertyValue("--obs-trailer-units"));
      const position = Number(scene.dataset.start) + Number(scene.dataset.span) * (f as number);
      const top = track.getBoundingClientRect().top + scrollY;
      scrollTo(0, top + ((track.offsetHeight - innerHeight) * position) / total);
    },
    [id, fraction] as const,
  );

const scene = (page: Page, id: string) => page.locator(`.obs-trailer-scene[data-scene="${id}"]`);
const sceneValue = (page: Page, id: string, name: string) =>
  scene(page, id).evaluate((node, n) => Number((node as HTMLElement).style.getPropertyValue(n) || 0), name);
const opacityOf = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((node) => Number(getComputedStyle(node).opacity));
const loaded = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0);
const fallOffset = (page: Page) =>
  page.locator(".obs-trailer-objects").evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).f);

test("a chapter deep link lands on the chapter, below the trailer and the break", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/story#work");
  await expect(page.locator("#work h2")).toBeInViewport();
  expect(
    await page.evaluate(() => {
      const before = (a: string, b: string) =>
        Boolean(document.querySelector(a)!.compareDocumentPosition(document.querySelector(b)!) & Node.DOCUMENT_POSITION_FOLLOWING);
      return before(".obs-trailer", "#whole-story") && before("#whole-story", "#work");
    }),
  ).toBe(true);
});

for (const width of [375, 768, 1280, 1920])
  for (const reduced of [false, true]) {
    test(`${width} ${reduced ? "reduced" : "motion"}: story trailer`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });

      await page.goto("/story");
      const heading = page.locator(".obs-hero h1");
      await expect(heading).toBeVisible();
      await expect(heading).toContainText("Bhaiya, tell me");
      await expect(page.locator(".obs-trailer")).toHaveAttribute("data-mode", reduced ? "still" : "scroll");
      for (const id of sceneIds) await expect(scene(page, id)).toHaveCount(1);

      expect(chapterIds).toHaveLength(20);
      for (const id of chapterIds) await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);

      const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(await overflow()).toBeLessThanOrEqual(0);

      const begin = page.locator('.obs-hero-copy a[href="#school"]');
      await begin.focus();
      await expect(begin).toBeFocused();
      expect(await begin.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");

      expect((await new AxeBuilder({ page }).include(".obs-trailer").analyze()).violations).toEqual([]);

      const links = page.locator(".obs-trailer-links a");
      if (reduced) {
        // Every scene is a static block in document flow, at its final state.
        expect(await page.locator(".obs-trailer-stage").evaluate((node) => getComputedStyle(node).position)).toBe("relative");
        for (const id of sceneIds) expect(await scene(page, id).evaluate((node) => getComputedStyle(node).position)).toBe("relative");
        await expect(page.locator(".obs-trailer-caption h2")).toHaveText(["Look.", "Ask.", "Make.", "Make.", "Deliver."]);
        for (const line of [1, 2, 3]) expect(await opacityOf(page, `.obs-trailer-look .obs-trailer-lines p[data-line="${line}"]`)).toBe(1);
        expect(await fallOffset(page)).toBe(180);
        await expect(page.locator(".obs-trailer-rail")).toBeHidden();
        // Reduced motion: nothing in the trailer transitions.
        expect(
          await page.locator(".obs-trailer").evaluate((root) =>
            [root, ...root.querySelectorAll("*")].filter((node) =>
              getComputedStyle(node).transitionDuration.split(",").some((value) => parseFloat(value) > 0.001),
            ).length,
          ),
        ).toBe(0);
        await page.locator(".obs-trailer-sum").scrollIntoViewIfNeeded();
        await expect(page.locator(".obs-trailer-sum")).toHaveText("7 + 5 = 12");
        // Lazy photographs and screenshots load once scrolled to.
        for (const selector of [".obs-trailer-code .obs-photo img", ".obs-trailer-print img", '.obs-trailer-screens figure[data-line="3"] img']) {
          await page.locator(selector).first().scrollIntoViewIfNeeded();
          await expect.poll(() => loaded(page, selector)).toBe(true);
        }
        await links.first().scrollIntoViewIfNeeded();
        await expect(links.first()).toBeVisible();
      } else {
        // First frame: only the rooftop is on screen.
        expect(await opacityOf(page, ".obs-trailer-look .obs-trailer-caption")).toBe(0);
        expect(await opacityOf(page, ".obs-trailer-constellation")).toBe(0);
        await expect(scene(page, "ask")).toHaveAttribute("data-state", "before");
        await expect(scene(page, "ask")).toBeHidden();

        await scrollScene(page, "look", 0.45);
        await expect(scene(page, "look")).toHaveAttribute("data-beat", "1");
        await expect.poll(() => sceneValue(page, "look", "--draw1")).toBeGreaterThan(0.5);
        expect(await sceneValue(page, "look", "--rise")).toBe(1);
        expect(await opacityOf(page, ".obs-trailer-look .obs-trailer-caption")).toBe(1);
        // The first caption line has finished rising into place.
        const firstLine = page.locator('.obs-trailer-look .obs-trailer-lines p[data-line="1"]');
        await expect.poll(() => firstLine.evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
        // Polled like the opacity: the two transitions end together, but opacity reads as 1 a frame before the clip reads as none.
        await expect.poll(() => firstLine.evaluate((node) => getComputedStyle(node).clipPath)).toMatch(/^(none|inset\(0px\))$/);
        // Faded-out hero links leave the tab order; the stage stays pinned.
        expect(await page.locator(".obs-trailer .obs-hero").evaluate((node) => getComputedStyle(node).visibility)).toBe("hidden");
        expect(await page.locator(".obs-trailer-stage").evaluate((node) => Math.round(node.getBoundingClientRect().top))).toBe(0);

        await scrollScene(page, "look", 0.95);
        await expect(scene(page, "look")).toHaveAttribute("data-beat", "3");
        await expect.poll(() => sceneValue(page, "look", "--fall")).toBe(1);
        expect(await fallOffset(page)).toBe(180);

        await scrollScene(page, "ask", 0.5);
        await expect(scene(page, "ask")).toHaveAttribute("data-state", "active");
        await expect(scene(page, "ask")).toHaveAttribute("data-beat", "2");
        await expect(scene(page, "look")).toHaveAttribute("data-state", "after");
        await expect(page.locator(".obs-trailer-stage")).toHaveAttribute("data-current", "ask");
        if (width > 800) {
          const tick = page.locator('.obs-trailer-rail a[data-tick="ask"]');
          await expect(tick).toHaveAttribute("aria-current", "true");
          // Hovering a tick names its scene.
          const label = tick.locator(".obs-trailer-tick-label");
          await tick.hover();
          await expect.poll(() => label.evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
          await page.mouse.move(0, 0);
        } else await expect(page.locator(".obs-trailer-rail")).toBeHidden();

        await scrollScene(page, "code", 0.8);
        await expect.poll(() => sceneValue(page, "code", "--a")).toBe(1);
        await expect(page.locator(".obs-trailer-sum")).toHaveText("7 + 5 = 12");
        await expect.poll(() => loaded(page, ".obs-trailer-code .obs-photo img")).toBe(true);

        await scrollScene(page, "make", 0.9);
        await expect.poll(() => sceneValue(page, "make", "--c")).toBe(1);
        for (const index of [0, 1]) await expect.poll(() => page.locator(".obs-trailer-print img").nth(index).evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

        await scrollScene(page, "deliver", 0.8);
        await expect(scene(page, "deliver")).toHaveAttribute("data-beat", "3");
        await expect.poll(() => loaded(page, '.obs-trailer-screens figure[data-line="3"] img')).toBe(true);
        await expect.poll(() => opacityOf(page, '.obs-trailer-screens figure[data-line="3"]')).toBe(1);

        await scrollScene(page, "close", 1);
        await expect(scene(page, "close")).toHaveAttribute("data-state", "active");
        await expect.poll(() => sceneValue(page, "close", "--a")).toBe(1);
        await expect(links.first()).toBeVisible();
        expect((await new AxeBuilder({ page }).include(".obs-trailer").analyze()).violations).toEqual([]);

        // Scrolling back restores the first frame.
        await scrollScene(page, "look", 0);
        await expect(scene(page, "look")).toHaveAttribute("data-beat", "0");
        await expect.poll(() => opacityOf(page, ".obs-trailer .obs-hero")).toBe(1);
        await expect(scene(page, "close")).toHaveAttribute("data-state", "before");
      }

      await expect(links).toHaveText(["Email me", "Resume (PDF)", "LinkedIn", "GitHub", "Return to the atlas", /Read the whole story/]);
      await expect(links.nth(1)).toHaveAttribute("href", "/adarsh-singh-resume.pdf");
      // The trailer hands over to the chapters at a marked break.
      await expect(links.nth(5)).toHaveAttribute("href", "#whole-story");
      await expect(page.locator("#whole-story h2")).toHaveText("The whole story");
      await expect(page.locator("#whole-story p")).toHaveText("Twenty chapters, with the photographs and recordings I kept.");

      // No scroll trapping: ordinary scrolling carries on into the chapters.
      await page.locator("#school").scrollIntoViewIfNeeded();
      await expect(page.locator("#school h2")).toBeInViewport();
      expect(await overflow()).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
