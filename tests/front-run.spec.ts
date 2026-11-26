import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { harigurusStudy, opening, pages, pipelineStudy, projects, references, securityStudy, vaultStudy } from "../src/data/portfolio";
import { goToChapter, openBook } from "./helpers/book";

// The atlas run: docs/FRONT-PAGE-TRAILER-PLAN-2026-11-22.md, Tasks 3, 4, 6 and 7.
const run = ".atlas-run";
const SCENES = ["hello", "vault", "harigurus", "pipeline", "security", "references"] as const;
const RAIL = ["Hello", "Vault", "Harigurus", "Pipeline", "Security", "References"];

/** Scrolls to a fraction of one scene, measured the same way as the segment table. */
const scrollScene = (page: Page, id: string, fraction: number) =>
  page.evaluate(
    ([sceneId, f]) => {
      const track = document.querySelector<HTMLElement>(".atlas-run .obs-trailer")!;
      const scene = track.querySelector<HTMLElement>(`[data-scene="${sceneId}"]`)!;
      const total = Number(getComputedStyle(track).getPropertyValue("--obs-trailer-units"));
      const position = Number(scene.dataset.start) + Number(scene.dataset.span) * (f as number);
      const top = track.getBoundingClientRect().top + scrollY;
      scrollTo(0, top + ((track.offsetHeight - innerHeight) * position) / total);
    },
    [id, fraction] as const,
  );
const scene = (page: Page, id: string) => page.locator(`${run} .obs-trailer-scene[data-scene="${id}"]`);
const loaded = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0);
const vault = projects.find((project) => project.name === "Vault Storage")!;
const named = (name: string) => projects.find((project) => project.name === name)!;
/** Opacity of a node as the reader gets it: its own multiplied by every ancestor's, up to the run. */
const shown = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((nodes) =>
    nodes.map((node) => {
      let value = 1;
      for (let item: Element | null = node; item && !item.matches(".atlas-run"); item = item.parentElement) value *= Number(getComputedStyle(item).opacity);
      return Math.round(value * 1000) / 1000;
    }),
  );
/**
 * How far the page overflows sideways, for use with expect.poll. Asked for near the end of the
 * run, where the book is mounting below: under reduced motion its shell stands unplaced for
 * two frames (measured 23 November 2026: 458px at 1280, about 25ms, on every load), and a
 * single reading that lands on them fails. The page at rest is what these tests are about.
 */
const sidewaysOverflow = (page: Page) => () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const pageNumber = (id: string) => String(pages.findIndex((item) => item.id === id));
const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The project scenes in run order, which is the order of the projects data; each number is the data's.
 * Evidence is the book's own: same preview file, same full-size file.
 */
// A project scene has three lines, one per beat; the pipeline has two (step 5, 23 November 2026).
const lineCount = (id: string) => (id === "pipeline" ? 2 : 3);
const RUN_PROJECTS = [
  {
    id: "vault",
    pageId: "vault",
    project: named("Vault Storage"),
    live: true,
    evidence: [{ src: "/images/vault/github-workbench-1200.webp", full: "/images/vault/github-workbench-source.jpg", image: vaultStudy.images.workspace }],
    copy: ["I independently built the GitHub and Drive workspaces, cross-service transfers, owner controls, runtime plan rules, and billing."],
  },
  {
    id: "harigurus",
    pageId: "harigurus",
    project: named("Harigurus"),
    live: true,
    evidence: [
      { src: "/images/harigurus/services-640.webp", full: "/images/harigurus/services-1920.webp", image: harigurusStudy.images.services },
      { src: "/images/harigurus/shop-640.webp", full: "/images/harigurus/shop-1920.webp", image: harigurusStudy.images.shop },
    ],
    copy: [
      "I built ceremony-booking features connecting customers with purohits, from appointment details to confirmation.",
      "React and Node.js booking flows, Razorpay verification and Twilio SMS.",
      "Team contribution. Production code remains private with Harigurus; the repository is a written case study.",
      "Full Stack Developer · 2022 · about 8 months",
    ],
  },
  {
    id: "pipeline",
    pageId: "pipeline",
    project: named("CI/CD Pipeline Engine"),
    live: false,
    evidence: [{ src: "/images/pipeline/dashboard-640.webp", full: "/images/pipeline/dashboard-1920.webp", image: pipelineStudy.images.dashboard }],
    copy: [
      "From a signed GitHub push to dependency-aware jobs, live logs and a React Flow dashboard.",
      "Updated source and supplied captures reviewed; no production deployment performed for this case study.",
    ],
  },
  {
    id: "security",
    pageId: "security-lab",
    project: named("Security Lab"),
    live: false,
    evidence: [{ src: "/images/security-lab/workbench-1200.webp", full: "/images/security-lab/workbench-1920.webp", image: securityStudy.images.workbench }],
    copy: [
      "Seven connected labs, from access control to JWT verification.",
      "Twenty-eight experiments compare vulnerable and protected implementations through real requests and browser evidence.",
      "Published source; loopback only.",
    ],
  },
] as const;

for (const width of [375, 768, 1280, 1920])
  for (const reduced of [false, true]) {
    test(`${width} ${reduced ? "reduced" : "motion"}: the run opens the atlas`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));

      await page.goto("/");
      const heading = page.locator(`${run} h1`);
      await expect(heading).toHaveText(opening.name);
      await expect(heading).toBeInViewport();
      await expect(scene(page, "hello")).toContainText(opening.role);
      // The role line names the stack (step 5, 23 November 2026); the sentence under it carries "full-stack applications".
      await expect(scene(page, "hello")).toContainText(opening.stack);
      await expect(scene(page, "hello")).toContainText(opening.introduction);
      await expect.poll(() => loaded(page, `${run} .atlas-portrait img`)).toBe(true);
      await expect(page.locator(`${run} .obs-trailer`)).toHaveAttribute("data-mode", reduced ? "still" : "scroll");

      // The keyboard reaches what a recruiter came for first (the résumé, then email), and the
      // way past the run is in the same scene, the fourth stop (step 5 round 2, 23 November 2026).
      const hello = scene(page, "hello");
      const skip = page.locator(`${run} a[href="#book"]`);
      await expect(skip).toHaveText("Skip to the book");
      await page.keyboard.press("Tab");
      await expect(hello.getByRole("link", { name: "Résumé (PDF)", exact: true })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(hello.getByRole("link", { name: "Email me", exact: true })).toBeFocused();
      await expect(hello.getByRole("link", { name: "Email me", exact: true })).toHaveAttribute("href", /^mailto:/);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect(skip).toBeFocused();
      expect(await skip.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
      expect((await skip.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);

      const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(await overflow()).toBeLessThanOrEqual(0);
      expect((await new AxeBuilder({ page }).include(run).analyze()).violations).toEqual([]);

      const project = scene(page, "vault");
      if (reduced) {
        // Static blocks in document order, everything readable, nothing moving.
        for (const id of SCENES) expect(await scene(page, id).evaluate((node) => getComputedStyle(node).position)).toBe("relative");
        expect(await page.locator(`${run} .obs-trailer-scene`).evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.scene))).toEqual([...SCENES]);
        for (const line of [1, 2, 3])
          expect(await project.locator(`.obs-trailer-lines p[data-line="${line}"]`).evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
        expect(
          await page.locator(run).evaluate((root) =>
            [root, ...root.querySelectorAll("*")].filter((node) =>
              getComputedStyle(node).transitionDuration.split(",").some((value) => parseFloat(value) > 0.001),
            ).length,
          ),
        ).toBe(0);
        await expect(page.locator(`${run} .obs-trailer-rail`)).toBeHidden();
        await project.locator("h2").scrollIntoViewIfNeeded();
      } else {
        await expect(project).toHaveAttribute("data-state", "before");
        await scrollScene(page, "vault", 0.8);
        await expect(project).toHaveAttribute("data-state", "active");
        await expect(project).toHaveAttribute("data-beat", "3");
        await expect.poll(() => project.evaluate((node) => Number((node as HTMLElement).style.getPropertyValue("--b")))).toBe(1);
        // The stage stays pinned while its scenes change.
        expect(await page.locator(`${run} .obs-trailer-stage`).evaluate((node) => Math.round(node.getBoundingClientRect().top))).toBe(0);
        if (width > 800) await expect(page.locator(`${run} .obs-trailer-rail a[data-tick="vault"]`)).toHaveAttribute("aria-current", "true");
        else await expect(page.locator(`${run} .obs-trailer-rail`)).toBeHidden();
      }
      await expect(project.locator("h2")).toHaveText(vault.name);
      await expect(project.locator(".obs-kicker")).toContainText(vault.detail);
      await project.locator(".atlas-print img").scrollIntoViewIfNeeded();
      await expect.poll(() => loaded(page, `${run} [data-scene="vault"] .atlas-print img`)).toBe(true);
      await expect(project.getByRole("link", { name: "Live site", exact: true })).toHaveAttribute("href", vault.href);
      await expect(project.getByRole("link", { name: "Repository", exact: true })).toHaveAttribute("href", vault.repository);
      await expect(project.getByRole("button", { name: "Read this in the book" })).toBeVisible();
      expect(await overflow()).toBeLessThanOrEqual(0);
      expect((await new AxeBuilder({ page }).include(run).analyze()).violations).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

test("a scene still shows its text, evidence and links when its painting is missing", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/front/**", (route) => route.abort());
  await page.goto("/");
  await scrollScene(page, "vault", 0.8);
  const project = scene(page, "vault");
  await expect(project).toHaveAttribute("data-state", "active");
  await expect(project.locator("h2")).toBeVisible();
  await expect(project.locator('.obs-trailer-lines p[data-line="3"]')).toBeVisible();
  await expect(project.getByRole("link", { name: "Repository", exact: true })).toBeVisible();
  await expect.poll(() => loaded(page, `${run} [data-scene="vault"] .atlas-print img`)).toBe(true);
  // The failed image leaves no broken frame behind.
  await expect(project.locator(".atlas-painting")).toHaveCount(0);
  // The same holds for the references: the words do not depend on the painting.
  await scrollScene(page, "references", 0.75);
  const voices = scene(page, "references");
  await expect(voices).toHaveAttribute("data-state", "active");
  await expect(voices.locator("h2")).toBeVisible();
  await expect(voices.locator("figure[data-reference-id]")).toHaveCount(3);
  await expect(voices.locator("figure[data-reference-id] blockquote").last()).toBeVisible();
  await expect(voices.locator(".atlas-painting")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("focusing a link in a scene that is off screen brings that scene to rest", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(scene(page, "vault")).toHaveAttribute("data-state", "before");
  await scene(page, "vault").getByRole("link", { name: "Repository", exact: true }).focus();
  await expect(scene(page, "vault")).toHaveAttribute("data-state", "active");
  await expect(scene(page, "vault").getByRole("link", { name: "Repository", exact: true })).toBeFocused();
  await expect(scene(page, "vault").locator("h2")).toBeVisible();
  // The later scenes behave the same way, each from wherever the reader was.
  for (const id of ["security", "harigurus", "pipeline"] as const) {
    const link = scene(page, id).getByRole("link", { name: "Repository", exact: true });
    await link.focus();
    await expect(scene(page, id)).toHaveAttribute("data-state", "active");
    await expect(link).toBeFocused();
    await expect(scene(page, id).locator("h2")).toBeVisible();
    await expect.poll(() => shown(page, `${run} [data-scene="${id}"] h2`)).toEqual([1]);
  }
  const all = scene(page, "references").getByRole("button", { name: "Read the references in the book" });
  await all.focus();
  await expect(scene(page, "references")).toHaveAttribute("data-state", "active");
  await expect(all).toBeFocused();
  // It comes to rest with all three quotations showing.
  await expect.poll(() => shown(page, `${run} [data-scene="references"] figure[data-reference-id]`)).toEqual([1, 1, 1]);
});

test("focusing a print that has not yet arrived brings its scene to rest, so the focused thing can be seen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  // Early in the scene it is on screen, but neither print has risen into the light.
  await scrollScene(page, "harigurus", 0.1);
  const project = scene(page, "harigurus");
  await expect(project).toHaveAttribute("data-state", "active");
  await expect.poll(() => shown(page, `${run} [data-scene="harigurus"] .atlas-print`)).toEqual([0, 0]);
  const second = project.locator(".atlas-print a").nth(1);
  await second.focus();
  await expect(second).toBeFocused();
  await expect.poll(() => shown(page, `${run} [data-scene="harigurus"] .atlas-print`)).toEqual([1, 1]);
  expect(await second.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
});

// ---------- Plan Tasks 6 and 7: Harigurus, Pipeline, Security and the references ----------

for (const width of [375, 768, 1280, 1920])
  for (const reduced of [false, true]) {
    test(`${width} ${reduced ? "reduced" : "motion"}: every project scene shows its name, its lines, real evidence and its links`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      await expect(page.locator(`${run} h1`)).toBeVisible();

      for (const item of RUN_PROJECTS) {
        const at = `${run} [data-scene="${item.id}"]`;
        const project = scene(page, item.id);
        if (reduced) await project.locator("h2").scrollIntoViewIfNeeded();
        else {
          await scrollScene(page, item.id, 0.8);
          await expect(project).toHaveAttribute("data-state", "active");
          await expect(project).toHaveAttribute("data-beat", String(lineCount(item.id)));
        }
        // Name, and the project's own number from the data.
        await expect(project.locator("h2")).toHaveText(item.project.name);
        await expect(project.locator(".obs-kicker")).toHaveText(`${item.project.number} · ${item.project.detail}`);
        await expect(project.locator(".obs-trailer-lines p")).toHaveCount(lineCount(item.id));
        for (const sentence of item.copy) await expect(project).toContainText(sentence);
        // In motion one line shows at a time; standing still, all of them do.
        await expect.poll(() => shown(page, `${at} .obs-trailer-lines p`)).toEqual(Array.from({ length: lineCount(item.id) }, (_, n) => (reduced || n === lineCount(item.id) - 1 ? 1 : 0)));

        // Evidence: the book's own screenshots, each loaded, each with its size reserved.
        const prints = project.locator(".atlas-print");
        await expect(prints).toHaveCount(item.evidence.length);
        for (const [n, evidence] of item.evidence.entries()) {
          const image = prints.nth(n).locator("img");
          if (reduced) await image.scrollIntoViewIfNeeded();
          await expect(image).toHaveAttribute("src", evidence.src);
          await expect(prints.nth(n).locator("a")).toHaveAttribute("href", evidence.full);
          await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
          expect(await image.evaluate((node) => node.hasAttribute("width") && node.hasAttribute("height") && (node.getAttribute("alt") ?? "").length > 20)).toBe(true);
          // The link is announced with what the screenshot shows, not only with what pressing it does.
          await expect(image).toHaveAttribute("alt", evidence.image.alt);
          await expect(prints.nth(n).getByRole("link")).toHaveAccessibleName(new RegExp(escaped(evidence.image.alt)));
          // The caption is read out at every width. A phone does not show it (it is in the viewer and in the book).
          const caption = prints.nth(n).locator("figcaption");
          await expect(caption).toHaveText(evidence.image.caption);
          const exposed = await caption.evaluate((node) => {
            const style = getComputedStyle(node);
            const box = node.getBoundingClientRect();
            return { read: style.display !== "none" && style.visibility !== "hidden", seen: box.width > 2 && box.height > 2 };
          });
          expect(exposed).toEqual({ read: true, seen: width > 800 });
        }
        await expect.poll(() => shown(page, `${at} .atlas-print`)).toEqual(item.evidence.map(() => 1));
        if (item.evidence.length === 2) {
          // Two prints lie like prints on a desk: touching, neither covering the other's subject.
          const [a, b] = [(await prints.nth(0).boundingBox())!, (await prints.nth(1).boundingBox())!];
          const overlap =
            Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
          expect(overlap).toBeGreaterThan(0);
          expect(overlap / Math.min(a.width * a.height, b.width * b.height)).toBeLessThan(0.3);
        }

        // Links, exactly as the data has them. Only a project with a site of its own gets "Live site".
        const live = project.getByRole("link", { name: "Live site", exact: true });
        if (item.live) await expect(live).toHaveAttribute("href", item.project.href);
        else await expect(live).toHaveCount(0);
        const repository = project.getByRole("link", { name: "Repository", exact: true });
        await expect(repository).toHaveAttribute("href", item.project.repository);
        const book = project.getByRole("button", { name: "Read this in the book" });
        await expect(book).toBeVisible();
        for (const target of [repository, book]) expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);

        // The desk behind it.
        const art = project.locator(".atlas-painting img");
        await expect(art).toHaveAttribute("alt", /^Illustration: .{20,}/);
        await expect.poll(() => art.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0 && node.currentSrc)).toContain(`/front/${item.id}-`);

        await expect.poll(sidewaysOverflow(page)).toBeLessThanOrEqual(0);
        expect((await new AxeBuilder({ page }).include(run).analyze()).violations).toEqual([]);
      }
      expect(errors).toEqual([]);
    });

    test(`${width} ${reduced ? "reduced" : "motion"}: the references scene carries the three approved quotations`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto("/");
      await expect(page.locator(`${run} h1`)).toBeVisible();
      const voices = scene(page, "references");
      if (reduced) await voices.locator("h2").scrollIntoViewIfNeeded();
      else {
        await scrollScene(page, "references", 0.75);
        await expect(voices).toHaveAttribute("data-state", "active");
        await expect(voices).toHaveAttribute("data-beat", "3");
      }
      await expect(voices.locator("h2")).toHaveText("What people say");

      const figures = voices.locator("figure[data-reference-id]");
      await expect(figures).toHaveCount(3);
      expect(await figures.evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.referenceId))).toEqual(references.map((item) => item.id));
      for (const [index, reference] of references.entries()) {
        const figure = figures.nth(index);
        if (reduced) await figure.scrollIntoViewIfNeeded();
        // The quotation, whole and unaltered, in curly quotes and nothing else.
        expect(await figure.locator("blockquote").evaluate((node) => node.textContent)).toBe(`“${reference.quote}”`);
        await expect(figure.locator("figcaption")).toContainText(reference.name);
        await expect(figure.locator("figcaption")).toContainText(reference.role);
        const photo = figure.locator("img");
        await expect(photo).toHaveAttribute("src", `/images/references/${reference.id}-192.webp`);
        await expect(photo).toHaveAttribute("srcset", `/images/references/${reference.id}-96.webp 96w, /images/references/${reference.id}-192.webp 192w`);
        await expect(photo).toHaveAttribute("alt", `Portrait of ${reference.name}`);
        await expect.poll(() => photo.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
        expect(await photo.evaluate((node) => node.hasAttribute("width") && node.hasAttribute("height"))).toBe(true);
        expect((await photo.boundingBox())!.width).toBeGreaterThanOrEqual(40);
      }
      // All three are showing at full strength, quotation and name alike.
      await expect.poll(() => shown(page, `${run} [data-scene="references"] figure[data-reference-id]`)).toEqual([1, 1, 1]);
      await expect.poll(() => shown(page, `${run} [data-scene="references"] figure[data-reference-id] :is(blockquote, figcaption)`)).toEqual([1, 1, 1, 1, 1, 1]);

      // Three columns from 768px; a single stack below that.
      const boxes = await figures.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect()).map(({ left, top, bottom, right }) => ({ left, top, bottom, right })));
      if (width >= 768) {
        for (const box of boxes) expect(Math.abs(box.top - boxes[0].top)).toBeLessThanOrEqual(2);
        expect(boxes[0].right).toBeLessThanOrEqual(boxes[1].left);
        expect(boxes[1].right).toBeLessThanOrEqual(boxes[2].left);
      } else {
        for (const box of boxes) expect(Math.abs(box.left - boxes[0].left)).toBeLessThanOrEqual(2);
        expect(boxes[0].bottom).toBeLessThanOrEqual(boxes[1].top);
        expect(boxes[1].bottom).toBeLessThanOrEqual(boxes[2].top);
      }

      const all = voices.getByRole("button", { name: "Read the references in the book" });
      await expect(all).toBeVisible();
      expect((await all.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      const art = voices.locator(".atlas-painting img");
      await expect(art).toHaveAttribute("alt", /^Illustration: .{20,}/);
      await expect.poll(() => art.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0 && node.currentSrc)).toContain("/front/references-");

      await expect.poll(sidewaysOverflow(page)).toBeLessThanOrEqual(0);
      expect((await new AxeBuilder({ page }).include(run).analyze()).violations).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

test("the quotations arrive one at a time and stay", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const quotes = `${run} [data-scene="references"] figure[data-reference-id]`;
  const link = `${run} [data-scene="references"] .atlas-book-link`;
  await scrollScene(page, "references", 0.2);
  await expect(scene(page, "references")).toHaveAttribute("data-beat", "1");
  await expect.poll(() => shown(page, quotes)).toEqual([1, 0, 0]);
  // In three columns the way into the book stands under them from the start.
  await expect.poll(() => shown(page, link)).toEqual([1]);
  await scrollScene(page, "references", 0.5);
  await expect.poll(() => shown(page, quotes)).toEqual([1, 1, 0]);
  await scrollScene(page, "references", 0.8);
  await expect.poll(() => shown(page, quotes)).toEqual([1, 1, 1]);
  await expect.poll(() => shown(page, link)).toEqual([1]);
  // And the scene plays backwards as readily as forwards.
  await scrollScene(page, "references", 0.5);
  await expect.poll(() => shown(page, quotes)).toEqual([1, 1, 0]);
});

test("on a phone the way into the book arrives with the last quotation, not alone under an empty desk", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const quotes = `${run} [data-scene="references"] figure[data-reference-id]`;
  const link = `${run} [data-scene="references"] .atlas-book-link`;
  /** Whether a pointer at the link's centre finds the link. */
  const pressable = () =>
    page.locator(link).evaluate((node) => {
      const box = node.getBoundingClientRect();
      return node.contains(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2));
    });
  for (const [fraction, expected] of [[0.2, [1, 0, 0]], [0.5, [1, 1, 0]], [0.8, [1, 1, 1]], [0.5, [1, 1, 0]]] as const) {
    await scrollScene(page, "references", fraction);
    await expect.poll(() => shown(page, quotes)).toEqual(expected);
    const all = expected[2] === 1;
    await expect.poll(() => shown(page, link)).toEqual([all ? 1 : 0]);
    // While it is not showing it cannot be pressed by accident.
    await expect.poll(pressable).toBe(all);
  }
  // By keyboard it is reachable from anywhere in the scene: focusing it brings the scene to rest.
  await scrollScene(page, "references", 0.2);
  await expect.poll(() => shown(page, link)).toEqual([0]);
  await page.locator(link).focus();
  await expect(page.locator(link)).toBeFocused();
  await expect.poll(() => shown(page, link)).toEqual([1]);
  await expect.poll(() => shown(page, quotes)).toEqual([1, 1, 1]);
});

test("on a phone the heading, all three quotations and the way into the book fit one screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await scrollScene(page, "references", 0.75);
  const voices = scene(page, "references");
  await expect(voices).toHaveAttribute("data-beat", "3");
  await expect.poll(() => shown(page, `${run} [data-scene="references"] figure[data-reference-id]`)).toEqual([1, 1, 1]);
  for (const target of [voices.locator("h2"), ...(await voices.locator("figure[data-reference-id]").all()), voices.getByRole("button", { name: "Read the references in the book" })]) {
    const box = (await target.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(812);
    expect(box.x).toBeGreaterThanOrEqual(16);
    expect(box.x + box.width).toBeLessThanOrEqual(375 - 16);
  }
});

for (const [id, pageId, name] of [
  ["harigurus", "harigurus", "Read this in the book"],
  ["pipeline", "pipeline", "Read this in the book"],
  ["security", "security-lab", "Read this in the book"],
  ["references", "references", "Read the references in the book"],
] as const)
  test(`the ${id} scene's book link opens the book on its page`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await scene(page, id).getByRole("button", { name }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    await expect(page.locator("#book")).toHaveAttribute("data-logical-page", pageNumber(pageId));
    await expect(page.locator("#book-arrival")).toHaveAttribute("data-arrived", "true");
    expect(await page.locator(".atlas-arrival-book").evaluate((node) => getComputedStyle(node).transform)).toBe("none");
  });

test("the rail names all six scenes and each tick leaves keyboard focus on its scene", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const ticks = page.locator(`${run} .obs-trailer-rail a`);
  await expect(ticks).toHaveCount(6);
  expect(await ticks.evaluateAll((nodes) => nodes.map((node) => node.textContent))).toEqual(RAIL);
  expect(await ticks.evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).dataset.tick))).toEqual([...SCENES]);
  for (const [id, next] of [
    ["harigurus", "Live site"],
    ["pipeline", "Repository"],
    ["security", "Repository"],
    ["references", "Read the references in the book"],
  ] as const) {
    await page.locator(`${run} .obs-trailer-rail a[data-tick="${id}"]`).focus();
    await page.keyboard.press("Enter");
    await expect(scene(page, id)).toHaveAttribute("data-state", "active");
    await expect(page.locator(`${run} .obs-trailer-rail a[data-tick="${id}"]`)).toHaveAttribute("aria-current", "true");
    await expect(scene(page, id).locator("h2")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(scene(page, id).getByRole(next === "Read the references in the book" ? "button" : "link", { name: next, exact: true })).toBeFocused();
  }
  expect(new URL(page.url()).hash).toBe("");
});

test("a project's name is set at one size in all four scenes and never takes more than two lines", async ({ page }) => {
  test.setTimeout(120_000);
  // Phone, tablet on its side, small laptop, desktop, large desktop.
  for (const [width, height] of [[375, 812], [900, 700], [1024, 768], [1280, 800], [1920, 1080]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(`${run} h1`)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const sizes: number[] = [];
    for (const item of RUN_PROJECTS) {
      await scrollScene(page, item.id, 0.8);
      await expect(scene(page, item.id)).toHaveAttribute("data-state", "active");
      const heading = await scene(page, item.id).locator("h2").evaluate((node: HTMLElement) => {
        const style = getComputedStyle(node);
        return { size: parseFloat(style.fontSize), lines: Math.round(node.offsetHeight / parseFloat(style.lineHeight)) };
      });
      expect(heading.lines, `${item.project.name} at ${width}px`).toBeLessThanOrEqual(2);
      expect(heading.size, `${item.project.name} at ${width}px`).toBeGreaterThanOrEqual(36);
      sizes.push(Math.round(heading.size * 10) / 10);
    }
    expect(new Set(sizes).size, `sizes at ${width}px: ${sizes.join(", ")}`).toBe(1);
  }
});

test("on the shortest phone screens the references still fit: heading, three quotations and the way into the book", async ({ page }) => {
  // A small phone with the browser's bars showing.
  await page.setViewportSize({ width: 375, height: 548 });
  await page.goto("/");
  await expect(page.locator(`${run} .obs-trailer`)).toHaveAttribute("data-mode", "scroll");
  await scrollScene(page, "references", 0.75);
  const voices = scene(page, "references");
  await expect(voices).toHaveAttribute("data-beat", "3");
  await expect.poll(() => shown(page, `${run} [data-scene="references"] figure[data-reference-id]`)).toEqual([1, 1, 1]);
  for (const target of [voices.locator("h2"), ...(await voices.locator("figure[data-reference-id]").all()), voices.getByRole("button", { name: "Read the references in the book" })]) {
    const box = (await target.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(548);
  }
});

test("a window too short to hold a pinned scene gets the run as plain blocks, with nothing cut off", async ({ page }) => {
  test.setTimeout(90_000);
  // A phone on its side, with motion allowed.
  await page.setViewportSize({ width: 812, height: 375 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(`${run} h1`)).toBeVisible();
  await expect(page.locator(`${run} .obs-trailer`)).toHaveAttribute("data-mode", "still");
  await expect(page.locator("#book-arrival")).toHaveAttribute("data-mode", "still");
  for (const id of SCENES) expect(await scene(page, id).evaluate((node) => getComputedStyle(node).position)).toBe("relative");

  // Every line, print, link and quotation is in the flow at full strength and can be brought on screen.
  for (const item of RUN_PROJECTS) {
    const at = `${run} [data-scene="${item.id}"]`;
    const project = scene(page, item.id);
    await project.locator("h2").scrollIntoViewIfNeeded();
    await expect(project.locator("h2")).toBeInViewport({ ratio: 1 });
    await expect.poll(() => shown(page, `${at} .obs-trailer-lines p`)).toEqual(Array.from({ length: lineCount(item.id) }, () => 1));
    await expect(project.locator(".atlas-print")).toHaveCount(item.evidence.length);
    await expect.poll(() => shown(page, `${at} .atlas-print`)).toEqual(item.evidence.map(() => 1));
    for (const image of await project.locator(".atlas-print img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    }
    const book = project.getByRole("button", { name: "Read this in the book" });
    await book.scrollIntoViewIfNeeded();
    await expect(book).toBeInViewport({ ratio: 1 });
  }
  const voices = scene(page, "references");
  await voices.locator("h2").scrollIntoViewIfNeeded();
  await expect(voices.locator("h2")).toBeInViewport({ ratio: 1 });
  await expect.poll(() => shown(page, `${run} [data-scene="references"] figure[data-reference-id] :is(blockquote, figcaption)`)).toEqual([1, 1, 1, 1, 1, 1]);
  await expect.poll(sidewaysOverflow(page)).toBeLessThanOrEqual(0);
  expect((await new AxeBuilder({ page }).include(run).analyze()).violations).toEqual([]);

  // The way into the book works from here too.
  await scene(page, "security").getByRole("button", { name: "Read this in the book" }).click();
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", pageNumber("security-lab"));
  await expect(page.locator("#book-arrival")).toHaveAttribute("data-arrived", "true");
  await expect(page.locator("#book")).toBeInViewport();

  // Turned upright again, the pinned run returns.
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator(`${run} .obs-trailer`)).toHaveAttribute("data-mode", "scroll");
  await expect(page.locator("#book-arrival")).toHaveAttribute("data-mode", "scroll");
  expect(errors).toEqual([]);
});

test("nothing from the later scenes is fetched with the first screen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const early: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (/^\/front\/|^\/images\/(vault|harigurus|pipeline|security-lab|references)\//.test(path)) early.push(path);
  });
  await page.goto("/");
  await expect(page.locator(`${run} h1`)).toBeVisible();
  await page.waitForTimeout(1500);
  expect(early).toEqual([]);
  // They come as the reader nears each scene.
  await scrollScene(page, "references", 0.5);
  await expect.poll(() => early.some((path) => path.startsWith("/images/references/"))).toBe(true);
  expect(early.some((path) => path.startsWith("/front/references-"))).toBe(true);
});

// ---------- Found by review of the four new scenes, 23 November 2026 ----------

test("a print that has not come into the light cannot be pressed", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  /**
   * For each print of a scene: whether a pointer over its screenshot finds it. The point is in
   * the lower right of the image, where the second of two prints is not under the first.
   */
  const pressable = (id: string) =>
    page.locator(`${run} [data-scene="${id}"] .atlas-print`).evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.querySelector("img")!.getBoundingClientRect();
        return node.contains(document.elementFromPoint(box.left + box.width * 0.75, box.top + box.height * 0.75));
      }),
    );
  const strength = (id: string) => shown(page, `${run} [data-scene="${id}"] .atlas-print`);

  // Harigurus: the first print lands on --b (0.16 to 0.34 of the scene), the second on --c (0.4 to 0.58).
  await scrollScene(page, "harigurus", 0.1);
  await expect(scene(page, "harigurus")).toHaveAttribute("data-state", "active");
  await expect.poll(() => strength("harigurus")).toEqual([0, 0]);
  expect(await pressable("harigurus")).toEqual([false, false]);
  // A press on the blank desk where the second print will lie opens nothing.
  const blank = await scene(page, "harigurus").locator(".atlas-print img").nth(1).boundingBox();
  await page.mouse.click(blank!.x + blank!.width * 0.75, blank!.y + blank!.height * 0.75);
  await page.waitForTimeout(300);
  await expect(page.locator("dialog.media-inspector")).toHaveCount(0);

  await scrollScene(page, "harigurus", 0.37);
  await expect.poll(() => strength("harigurus")).toEqual([1, 0]);
  await expect.poll(() => pressable("harigurus")).toEqual([true, false]);
  await scrollScene(page, "harigurus", 0.8);
  await expect.poll(() => strength("harigurus")).toEqual([1, 1]);
  await expect.poll(() => pressable("harigurus")).toEqual([true, true]);
  // Scrolled back, they are out of reach again.
  await scrollScene(page, "harigurus", 0.1);
  await expect.poll(() => strength("harigurus")).toEqual([0, 0]);
  await expect.poll(() => pressable("harigurus")).toEqual([false, false]);

  // A scene with one print: --b runs from 0.18 to 0.42.
  for (const id of ["vault", "pipeline", "security"] as const) {
    await scrollScene(page, id, 0.1);
    await expect(scene(page, id)).toHaveAttribute("data-state", "active");
    await expect.poll(() => strength(id)).toEqual([0]);
    await expect.poll(() => pressable(id)).toEqual([false]);
    await scrollScene(page, id, 0.8);
    await expect.poll(() => strength(id)).toEqual([1]);
    await expect.poll(() => pressable(id)).toEqual([true]);
  }
  // Once it is down, a press opens the full capture in the viewer.
  const print = await scene(page, "security").locator(".atlas-print img").boundingBox();
  await page.mouse.click(print!.x + print!.width / 2, print!.y + print!.height / 2);
  await expect(page.locator("dialog.media-inspector[open]")).toBeVisible();
});

test("standing still, every print can be pressed", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const item of RUN_PROJECTS) {
    const links = scene(page, item.id).locator(".atlas-print a");
    await expect(links).toHaveCount(item.evidence.length);
    await links.first().scrollIntoViewIfNeeded();
    expect(await links.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).pointerEvents))).toEqual(item.evidence.map(() => "auto"));
  }
});

// A small laptop, the same with a short window, a laptop with the browser's bars, a scaled full-HD screen, full HD.
for (const [width, height] of [[1280, 800], [1280, 600], [1366, 657], [1536, 864], [1920, 1080]] as const)
  test(`${width}x${height}: the print is large enough to read, level with the words, and clear of the objects on the desk`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(`${run} h1`)).toBeVisible();
    for (const item of RUN_PROJECTS) {
      const project = scene(page, item.id);
      await scrollScene(page, item.id, 0.8);
      await expect(project).toHaveAttribute("data-state", "active");
      await expect.poll(() => shown(page, `${run} [data-scene="${item.id}"] .atlas-print`)).toEqual(item.evidence.map(() => 1));
      const images = project.locator(".atlas-print img");
      for (const image of await images.all()) await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
      // A screenshot takes at least a quarter of the window's width (a fifth for each of a pair).
      for (const image of await images.all()) expect((await image.boundingBox())!.width / width, `${item.id} at ${width}px`).toBeGreaterThanOrEqual(item.evidence.length > 1 ? 0.2 : 0.25);
      // The words and the evidence share one centre line.
      const middle = async (selector: string) => {
        const box = (await project.locator(selector).boundingBox())!;
        return box.y + box.height / 2;
      };
      expect(Math.abs((await middle(".obs-trailer-caption")) - (await middle(".atlas-evidence"))), `${item.id} at ${width}px`).toBeLessThanOrEqual(2);
      // Nothing is cut off by the window, and the prints stop short of the right of the desk, where the objects lie.
      for (const print of await project.locator(".atlas-print").all()) {
        const box = (await print.boundingBox())!;
        expect(box.y, `${item.id} at ${width}px`).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height, `${item.id} at ${width}px`).toBeLessThanOrEqual(height);
        expect((box.x + box.width) / width, `${item.id} at ${width}px`).toBeLessThanOrEqual(0.69);
        // The paper is as wide as the screenshot on it: no blank strip beside a height-limited image.
        const image = (await print.locator("img").boundingBox())!;
        expect(box.width - image.width, `${item.id} at ${width}px`).toBeLessThanOrEqual(40);
      }
      const words = (await project.locator(".obs-trailer-caption").boundingBox())!;
      expect(words.y).toBeGreaterThanOrEqual(0);
      expect(words.y + words.height).toBeLessThanOrEqual(height);
    }
  });

test("following a project into the book, the reader finds the same name on its page", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const item of RUN_PROJECTS) {
    await page.goto("/");
    await expect(scene(page, item.id).locator("h2")).toHaveText(item.project.name);
    await scene(page, item.id).getByRole("button", { name: "Read this in the book" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    await expect(page.locator("#book")).toHaveAttribute("data-logical-page", pageNumber(item.pageId));
    // The page's own heading carries the project's name as the run gave it.
    await expect(page.locator(`#book [data-page-id="${item.pageId}"] .case-title:visible`).first()).toContainText(item.project.name);
  }
});

// One order and one number per project: 01 Vault, 02 Harigurus, 03 the pipeline, 04 Security Lab
// (plan Task 9). This holds the run, the projects data, the contents page as the reader sees it,
// each page's running head as the reader sees it, and the order of the pages to that.
test("a project has one number: in the run, in the contents list and at the head of its page", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  for (const [index, item] of RUN_PROJECTS.entries()) {
    const number = String(index + 1).padStart(2, "0");
    expect(item.project.number, `${item.project.name} in the projects data`).toBe(number);
    expect(pages.find((entry) => entry.id === item.pageId)!.runningHead[0].startsWith(`${number} /`), `${item.project.name}'s running head`).toBe(true);
    await expect(scene(page, item.id).locator(".obs-kicker")).toHaveText(`${item.project.number} · ${item.project.detail}`);
  }
  // The contents list reads in the same order, and the project pages follow each other in it.
  expect(projects.map((item) => item.name)).toEqual(RUN_PROJECTS.map((item) => item.project.name));
  const places = RUN_PROJECTS.map((item) => pages.findIndex((entry) => entry.id === item.pageId));
  expect(places).toEqual([...places].sort((a, b) => a - b));
  // The two reference pages stay one facing spread: an odd page on the left, the next on the right.
  const first = pages.findIndex((entry) => entry.id === "references");
  expect(first % 2).toBe(1);
  expect(pages[first + 1].id).toBe("references-continued");
  // Folios count the pages after the cover.
  expect(pages.slice(1).map((entry) => entry.folio)).toEqual(pages.slice(1).map((_, index) => String(index + 1).padStart(2, "0")));

  // In the book itself: the rows of the contents page, then the head of each project's page.
  // (Leave the page first: going from "/" to "/#book" would only change the hash, not load the book's address.)
  await page.goto("about:blank");
  await openBook(page);
  const book = page.locator("#book");
  await goToChapter(page, "Introduction");
  await expect(book).toHaveAttribute("data-turning", "false");
  const rows = page.locator('.library-slot .book-page[aria-hidden="false"][data-page-id="contents"] .project-row');
  await expect(rows).toHaveCount(RUN_PROJECTS.length);
  expect(await rows.evaluateAll((nodes) => nodes.map((node) => [node.querySelector(".project-number")!.textContent, node.querySelector(".project-title")!.textContent]))).toEqual(
    RUN_PROJECTS.map((item) => [item.project.number, item.project.name]),
  );
  for (const item of RUN_PROJECTS) {
    await rows.filter({ hasText: item.project.name }).click();
    await expect(book).toHaveAttribute("data-logical-page", pageNumber(item.pageId));
    await expect(book).toHaveAttribute("data-turning", "false");
    const face = page.locator(`.library-slot .book-page[aria-hidden="false"][data-page-id="${item.pageId}"]`);
    await expect(face.locator(".running-head span").first()).toHaveText(new RegExp(`^${item.project.number} / `));
    await expect(face.locator(".folio span").first()).toHaveText(pages.find((entry) => entry.id === item.pageId)!.folio);
    await goToChapter(page, "Introduction");
    await expect(book).toHaveAttribute("data-turning", "false");
  }
});

// ---------- Plan Task 11: the introduction as a film still in the Vault scene ----------
const reel = `${run} [data-scene="vault"] button.atlas-reel[data-portfolio-video="introduction"]`;

test("the Vault scene shows the introduction as a film still, and nothing of the recording loads before it is pressed", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const media: string[] = [];
  page.on("request", (request) => {
    if (/\.(mp4|m3u8|vtt)(\?|$)/.test(request.url()) || request.url().includes("yourvaultstorage.com")) media.push(request.url());
  });
  await page.goto("/");
  await scrollScene(page, "vault", 0.55);
  const button = page.locator(reel);
  await expect(button).toBeVisible();
  await expect(button).toHaveAccessibleName("Watch my introduction · 2:31 Hosted on Vault");
  await expect(button).toHaveAttribute("aria-haspopup", "dialog");
  // The still: a 16:9 poster, loaded, between the scene's links and the foot of the window.
  await expect.poll(() => loaded(page, `${reel} img`)).toBe(true);
  const still = (await button.locator("[data-video-still] .atlas-reel-picture").boundingBox())!;
  expect(still.width / still.height).toBeCloseTo(16 / 9, 1);
  const links = (await scene(page, "vault").locator(".obs-trailer-links").boundingBox())!;
  expect(still.y).toBeGreaterThanOrEqual(links.y + links.height);
  expect(still.y + still.height).toBeLessThanOrEqual(800);
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
  expect(media).toEqual([]);

  // Pressed, the player grows out of the still: one 420ms run of transform and opacity.
  await button.focus();
  await page.keyboard.press("Enter");
  const dialog = page.locator("dialog.media-inspector--video");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("data-grow", "");
  const growth = await dialog.evaluate((node) =>
    node.getAnimations().map((animation) => ({
      duration: (animation.effect!.getTiming().duration as number) ?? 0,
      properties: [...new Set((animation.effect as KeyframeEffect).getKeyframes().flatMap((frame) => Object.keys(frame)))].filter((key) => !["offset", "easing", "composite", "computedOffset"].includes(key)).sort(),
    })),
  );
  expect(growth).toEqual([{ duration: 420, properties: ["opacity", "transform"] }]);
  const start = Number(await dialog.evaluate((node) => getComputedStyle(node).getPropertyValue("--grow-scale")));
  expect(start).toBeGreaterThan(0.05);
  expect(start).toBeLessThan(0.5);
  await expect.poll(() => dialog.evaluate((node) => node.getAnimations().length)).toBe(0);
  expect(await dialog.evaluate((node) => getComputedStyle(node).transform)).toBe("none");
  await expect(dialog.getByRole("button", { name: "Close", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(button).toBeFocused();
});

test("reduced motion: the film still opens the player with no growth", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const button = page.locator(reel);
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeVisible();
  await button.click();
  const dialog = page.locator("dialog.media-inspector--video");
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((node) => node.hasAttribute("data-grow"))).toBe(false);
  expect(await dialog.evaluate((node) => node.getAnimations().length)).toBe(0);
});

test("on a phone the pinned Vault scene leaves the watch link to the opening scene; standing still it is words alone, a full target, and opens the player without growth", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await scrollScene(page, "vault", 0.55);
  const button = page.locator(reel);
  // Pinned: the print takes the room (step 5, 23 November 2026); the opening scene has the link.
  await expect(scene(page, "vault")).toHaveAttribute("data-state", "active");
  await expect(button).toBeHidden();
  await expect(page.locator(`${run} [data-scene="hello"] [data-portfolio-video="introduction"]`)).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(`${run} .obs-trailer`)).toHaveAttribute("data-mode", "still");
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeVisible();
  await expect(button.locator("[data-video-still]")).toBeHidden();
  const box = (await button.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(43.5);
  expect(box.x).toBeGreaterThanOrEqual(15.5);
  expect(box.x + box.width).toBeLessThanOrEqual(375 - 15.5);
  await button.click();
  const dialog = page.locator("dialog.media-inspector--video");
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((node) => node.hasAttribute("data-grow"))).toBe(false);
});

// ---------- Plan Task 12: a print answers the hand ----------
test("a print rises 4px under the pointer and with keyboard focus, in 180ms; standing still it does not move", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await scrollScene(page, "pipeline", 0.55);
  const sheet = page.locator(`${run} [data-scene="pipeline"] .atlas-print-sheet`);
  const lift = () => sheet.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m42);
  await expect.poll(() => shown(page, `${run} [data-scene="pipeline"] .atlas-print`)).toEqual([1]);
  expect(await lift()).toBe(0);
  expect(await sheet.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe("0.18s");
  expect(await sheet.evaluate((node) => getComputedStyle(node).transitionProperty)).toBe("transform");
  await sheet.hover();
  await expect.poll(lift).toBe(-4);
  await page.mouse.move(8, 8);
  await expect.poll(lift).toBe(0);
  await sheet.locator("a").focus();
  await expect.poll(lift).toBe(-4);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(`${run} .obs-trailer`)).toHaveAttribute("data-mode", "still");
  await sheet.hover();
  expect(await sheet.evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration))).toBeLessThanOrEqual(0.001);
  expect(await lift()).toBe(0);
});
