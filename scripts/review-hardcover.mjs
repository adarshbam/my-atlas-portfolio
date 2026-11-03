import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { cpus } from "node:os";
await mkdir("docs/review", { recursive: true });
await mkdir("tmp/hardcover", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
for (const width of [375, 768, 1280, 1920]) {
  const height =
    width === 375 ? 844 : width === 768 ? 1024 : width === 1280 ? 900 : 1080;
  const record = width !== 1920;
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: width < 1280,
    isMobile: width < 768,
    ...(record
      ? {
          recordVideo: { dir: "tmp/hardcover/videos", size: { width, height } },
        }
      : {}),
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4173");
  await page.locator("#book[data-ready=true]").waitFor();
  await page.evaluate(() => document.fonts.ready);
  const settle = async (index) => {
    await expect(page.locator("#book")).toHaveAttribute(
      "data-current-page",
      String(index),
    );
    await expect(page.locator("#book")).toHaveAttribute(
      "data-turning",
      "false",
    );
  };
  let session,
    trace = [];
  if (width === 1280) {
    session = await context.newCDPSession(page);
    session.on("Tracing.dataCollected", (e) => trace.push(...e.value));
    await session.send("Tracing.start", {
      categories: "devtools.timeline,v8,blink.user_timing",
      transferMode: "ReportEvents",
    });
  }
  const inspect = async (state) => {
    await page.mouse.move(0, 0);
    await page.evaluate(() => scrollTo(0, 0));
    const metrics = await page.evaluate(() => ({
      page: document.querySelector("#book").getAttribute("data-current-page"),
      overflow: document.documentElement.scrollWidth > innerWidth,
      faces: [
        ...document.querySelectorAll(
          ".library-slot [data-page][aria-hidden=false],.plain-face[aria-hidden=false] [data-page]",
        ),
      ].map((face) => {
        const inner = face.querySelector(".page-inner"),
          content = face.querySelector(".page-content"),
          folio = face.querySelector(".folio");
        return {
          id: face.dataset.pageId,
          innerHeight: inner.clientHeight,
          innerScroll: inner.scrollHeight,
          contentHeight: content?.clientHeight ?? 0,
          contentScroll: content?.scrollHeight ?? 0,
          folioBottom:
            folio?.getBoundingClientRect().bottom ??
            face.getBoundingClientRect().bottom,
          pageBottom: face.getBoundingClientRect().bottom,
        };
      }),
      coverHead: [
        ...document.querySelectorAll(
          ".library-slot [data-page-id=cover] .running-head span",
        ),
      ].map((el) => ({
        text: el.textContent,
        rect: el.getBoundingClientRect().toJSON(),
        color: getComputedStyle(el).color,
      })),
    }));
    results.push({ width, state, metrics, errors: [...errors] });
    if (
      metrics.overflow ||
      metrics.faces.some(
        (face) =>
          face.innerScroll > face.innerHeight + 1 ||
          face.contentScroll > face.contentHeight + 1 ||
          face.folioBottom > face.pageBottom,
      )
    )
      throw Error(`Overflow at ${width} ${state}`);
    await page.screenshot({
      path: `docs/review/hardcover-${width}-${state}.png`,
      fullPage: !record,
    });
  };
  await inspect("cover");
  await page.evaluate(() => {
    window.coverSamples = [];
    const start = performance.now();
    const tick = () => {
      const book = document.querySelector("#book");
      window.coverSamples.push({
        time: performance.now() - start,
        scale: Number(book.dataset.presentationScale),
        progress: Number(book.dataset.openness),
        transform: book.style.transform,
      });
      if (performance.now() - start < 1400) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await page.waitForTimeout(150);
  await page.screenshot({
    path: `docs/review/hardcover-${width}-opening-progress.png`,
    fullPage: !record,
  });
  await settle(1);
  await inspect("opening");
  if (width < 768) {
    await page.keyboard.press("ArrowRight");
    await settle(2);
    await inspect("contents");
  }
  await page
    .getByRole("navigation", { name: "Portfolio chapters" })
    .getByRole("button", { name: "Vault Storage", exact: true })
    .click();
  await settle(3);
  await inspect("vault");
  await page
    .getByRole("navigation", { name: "Portfolio chapters" })
    .getByRole("button", { name: "Introduction", exact: true })
    .click();
  await settle(1);
  await page
    .getByRole("button", { name: "Previous page", exact: true })
    .click();
  await settle(0);
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await settle(1);
  await writeFile(
    `tmp/hardcover/${width}-opening-samples.json`,
    JSON.stringify(await page.evaluate(() => window.coverSamples), null, 2),
  );
  // Keep a continuous record of both normal native turns and the reading mode.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".flip-engine")).toHaveCount(0);
  await inspect("reduced-opening");
  await page
    .getByRole("navigation", { name: "Portfolio chapters" })
    .getByRole("button", { name: "Cover", exact: true })
    .click();
  await settle(0);
  await page.waitForTimeout(250);
  await inspect("reduced-cover");
  if (session) {
    const complete = new Promise((resolve) =>
      session.once("Tracing.tracingComplete", resolve),
    );
    await session.send("Tracing.end");
    await complete;
    await writeFile(
      "tmp/hardcover/desktop-trace.json",
      JSON.stringify({ traceEvents: trace }),
    );
  }
  await context.close();
  if (record)
    await page.video().saveAs(`docs/review/hardcover-${width}-continuous.webm`);
}
await writeFile(
  "tmp/hardcover/layout.json",
  JSON.stringify(
    { browser: browser.version(), cpu: cpus()[0]?.model, results },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    {
      browser: browser.version(),
      cpu: cpus()[0]?.model,
      states: results.length,
      errors: results.flatMap((r) => r.errors),
      coverHead: results.find((r) => r.width === 1280)?.metrics.coverHead,
    },
    null,
    2,
  ),
);
await browser.close();
