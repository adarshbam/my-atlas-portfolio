import { test, expect, type Page } from "@playwright/test";
import { pages } from "../src/data/portfolio";
const architectureIndex = pages.findIndex(
  (page) => page.id === "vault-architecture",
);

const book = (page: Page) => page.locator("#book");
async function settled(page: Page, index: number) {
  await expect(book(page)).toHaveAttribute("data-current-page", String(index));
  await expect(book(page)).toHaveAttribute("data-turning", "false");
}
async function open(page: Page) {
  await page.goto("/");
  await expect(book(page)).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await settled(page, 1);
}
async function drag(page: Page, forward: boolean, cancel = false, top = false) {
  const b = (await book(page).boundingBox())!;
  const x = forward ? b.x + b.width - 6 : b.x + 6,
    y = top ? b.y + 10 : b.y + b.height - 10;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(
    b.x + b.width / 2 + (forward ? -60 : 60),
    y + (top ? 90 : -90),
    {
      steps: 18,
    },
  );
  await expect(book(page)).toHaveAttribute("data-turning", "true");
  if (cancel) await page.mouse.move(x, y, { steps: 18 });
  else
    await page.mouse.move(
      forward ? b.x + 20 : b.x + b.width - 20,
      y + (top ? 20 : -20),
      {
        steps: 18,
      },
    );
  await page.mouse.up();
  await page.mouse.move(b.x + b.width / 2, b.y - 20);
  await expect(book(page)).toHaveAttribute("data-turning", "false");
}

async function sampleTurn(page: Page, direction: "Next" | "Previous") {
  return page.evaluate(async (direction) => {
    const book = document.querySelector<HTMLElement>("#book")!;
    const root = book.querySelector(".flip-engine");
    const baseline = {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    };
    const frames: {
      time: number;
      folded: boolean;
      overflow: boolean;
      opaque: boolean;
      gutterBehindPaper: boolean;
    }[] = [];
    const started = performance.now();
    document
      .querySelector<HTMLButtonElement>(`[aria-label="${direction} page"]`)!
      .click();
    await new Promise<void>((resolve) => {
      const tick = () => {
        const time = performance.now() - started;
        frames.push({
          time,
          folded: [...book.querySelectorAll<HTMLElement>("[data-page]")].some(
            (face) => !!face.style.clipPath && !!face.style.transform,
          ),
          overflow:
            document.documentElement.scrollWidth > baseline.width ||
            document.documentElement.scrollHeight > baseline.height,
          opaque: [...book.querySelectorAll<HTMLElement>("[data-page]")].every(
            (face) => {
              const style = getComputedStyle(face);
              const surface =
                face.querySelector<HTMLElement>(".sheet-surface")!;
              const material = getComputedStyle(surface);
              const alpha = material.backgroundColor.match(
                /rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/,
              )?.[1];
              return (
                style.opacity === "1" &&
                material.opacity === "1" &&
                (alpha === undefined || Number(alpha) === 1) &&
                style.mixBlendMode === "normal" &&
                material.mixBlendMode === "normal" &&
                surface.closest("[data-page]") === face &&
                style.transformStyle === "flat"
              );
            },
          ),
          gutterBehindPaper:
            book.dataset.turning !== "true" ||
            !book.querySelector(".book-gutter") ||
            getComputedStyle(book.querySelector(".book-gutter")!).visibility ===
              "hidden",
        });
        if (time < 1100) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    return {
      frames,
      sameEngine: root === book.querySelector(".flip-engine"),
    };
  }, direction);
}

for (const width of [375, 768, 1280, 1920])
  test(`${width}px arrow turns visibly fold without transient overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1400 });
    await open(page);
    for (const direction of ["Next", "Previous"] as const) {
      const { frames, sameEngine } = await sampleTurn(page, direction);
      const folded = frames.filter((frame) => frame.folded);
      expect(folded.length).toBeGreaterThan(5);
      expect(folded.at(-1)!.time - folded[0].time).toBeGreaterThan(200);
      expect(frames.some((frame) => frame.overflow)).toBe(false);
      expect(
        frames.every((frame) => frame.opaque && frame.gutterBehindPaper),
      ).toBe(true);
      expect(sameEngine).toBe(true);
      await settled(page, direction === "Previous" ? 1 : width < 768 ? 2 : 3);
    }
  });

test("corner hover stays bounded, returns without turning, and permits click turns", async ({
  page,
}) => {
  await open(page);
  const b = (await book(page).boundingBox())!;
  const dimensions = await page.evaluate(() => [
    document.documentElement.scrollWidth,
    document.documentElement.scrollHeight,
  ]);
  for (const index of [1, 3]) {
    if (index === 3) {
      await page
        .getByRole("button", { name: "Next page", exact: true })
        .click();
      await settled(page, 3);
    }
    const x = index === 1 ? b.x + b.width - 6 : b.x + 6;
    for (const top of [true, false]) {
      const y = top ? b.y + 10 : b.y + b.height - 10;
      await page.mouse.move(x, y);
      const face = page.locator(
        `.library-slot [data-page="${index === 1 ? 3 : 2}"]`,
      );
      await expect
        .poll(() => face.evaluate((x) => (x as HTMLElement).style.clipPath))
        .not.toBe("");
      await page.waitForTimeout(200);
      const foldSize = await face.evaluate((x) => {
        const values = (x as HTMLElement).style.clipPath
          .match(/-?[\d.]+(?=px)/g)!
          .map(Number);
        const xs = values.filter((_, i) => i % 2 === 0);
        const ys = values.filter((_, i) => i % 2 !== 0);
        return Math.min(
          Math.max(...xs) - Math.min(...xs),
          Math.max(...ys) - Math.min(...ys),
        );
      });
      expect(foldSize).toBeGreaterThan(48);
      const lifted = await face.getAttribute("style");
      await page.mouse.move(x + (index === 1 ? -20 : 20), y + (top ? 20 : -20));
      await page.waitForTimeout(1000);
      expect(await face.getAttribute("style")).toBe(lifted);
      await settled(page, index);
      expect(
        await page.evaluate(() => [
          document.documentElement.scrollWidth,
          document.documentElement.scrollHeight,
        ]),
      ).toEqual(dimensions);
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await expect
        .poll(() => face.evaluate((x) => (x as HTMLElement).style.clipPath))
        .toBe("");
      await settled(page, index);
    }
  }
  await page.mouse.move(b.x + 6, b.y + 10);
  await expect
    .poll(() =>
      page
        .locator('.library-slot [data-page="2"]')
        .evaluate((x) => (x as HTMLElement).style.clipPath),
    )
    .not.toBe("");
  await page.keyboard.press("ArrowLeft");
  await settled(page, 1);
  await page.mouse.click(b.x + b.width - 6, b.y + b.height - 10);
  await expect(book(page)).toHaveAttribute("data-turning", "true");
  await settled(page, 3);
});

test("all four lifted corners can be dragged to commit or cancel", async ({
  page,
}) => {
  await open(page);
  for (const top of [true, false]) {
    await drag(page, true, true, top);
    await settled(page, 1);
    await drag(page, true, false, top);
    await settled(page, 3);
    await drag(page, false, true, top);
    await settled(page, 3);
    await drag(page, false, false, top);
    await settled(page, 1);
  }
});

test("reduced pagination retains a visible 200ms opacity crossfade", async ({
  page,
}) => {
  await open(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".flip-engine")).toHaveCount(0);
  const samples = await page.evaluate(async () => {
    document
      .querySelector<HTMLButtonElement>('[aria-label="Next page"]')!
      .click();
    const face = document.querySelector<HTMLElement>(
      '.plain-face:has([data-page="3"])',
    )!;
    const samples: number[] = [];
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const tick = () => {
        samples.push(Number(getComputedStyle(face).opacity));
        if (performance.now() - start < 300) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    return samples;
  });
  expect(samples.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
  expect(samples.at(-1)).toBe(1);
  await settled(page, 3);
});

for (const width of [375, 768, 1280, 1920])
  test(`${width}px layout, page contents, buttons and reduced motion`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 1400 });
    await open(page);
    const step = width < 768 ? 1 : 2;
    for (let i = 1; i < pages.length; i += step) {
      await settled(page, i);
      const visible = page.locator(
        '.library-slot [data-page][aria-hidden="false"]',
      );
      await expect(visible).toHaveCount(step);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      for (const face of await visible.all()) {
        const inner = face.locator(".page-inner");
        if (width < 768) {
          await expect(inner).toHaveCSS("overflow-y", "auto");
          await inner.evaluate((el) => {
            el.scrollTop = el.scrollHeight;
          });
        } else {
          expect(
            await inner.evaluate(
              (el) => el.scrollHeight <= el.clientHeight + 1,
            ),
          ).toBe(true);
        }
        const folio = face.locator(".folio");
        const f = (await folio.boundingBox())!,
          p = (await face.boundingBox())!;
        expect(f.y + f.height).toBeLessThanOrEqual(p.y + p.height);
      }
      if (i + step < pages.length)
        await page
          .getByRole("button", { name: "Next page", exact: true })
          .click();
    }
    await expect(
      page.getByRole("button", { name: "Next page", exact: true }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Previous page", exact: true })
      .click();
    await settled(page, pages.length - step * 2);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".flip-engine")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Reading mode", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Introduction", exact: false })
      .click();
    await settled(page, 1);
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await settled(page, 1 + step);
    await page.waitForTimeout(250);
    expect(
      await page
        .locator('.plain-face[aria-hidden="false"]')
        .first()
        .evaluate((x) => getComputedStyle(x).opacity),
    ).toBe("1");
    expect(
      await page
        .locator('.plain-face[aria-hidden="false"]')
        .first()
        .evaluate((x) => getComputedStyle(x).transform),
    ).toBe("none");
    expect(errors).toEqual([]);
  });

test("corner drag commits, reverses and cancels without losing faces", async ({
  page,
}) => {
  await open(page);
  for (let i = 0; i < 5; i++) {
    await drag(page, true, true);
    await settled(page, 1);
  }
  for (let i = 0; i < 5; i++) {
    await drag(page, true);
    await settled(page, 3);
    await drag(page, false);
    await settled(page, 1);
  }
});

test("keyboard, focus, contents link, repeated turns and resize cleanup", async ({
  page,
}) => {
  await open(page);
  await page.keyboard.press("Tab");
  await page.getByRole("link", { name: "Skip to portfolio" }).focus();
  await expect(
    page.getByRole("link", { name: "Skip to portfolio" }),
  ).toBeFocused();
  expect(
    await page
      .getByRole("link", { name: "Skip to portfolio" })
      .evaluate((x) => getComputedStyle(x).outlineStyle),
  ).toBe("solid");
  await page.keyboard.press("ArrowRight");
  await settled(page, 3);
  await expect(page.getByRole("status")).toContainText(
    `Page 4 of ${pages.length}`,
  );
  await page.keyboard.press("ArrowLeft");
  await settled(page, 1);
  const toc = page.locator('.library-slot [data-turn-page-id="vault"]');
  await toc.focus();
  await page.keyboard.press("Enter");
  await settled(page, 3);
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("[inert]")),
  ).toBe(false);
  const paragraph = (await page
    .locator(".library-slot .story p")
    .first()
    .boundingBox())!;
  await page.mouse.move(paragraph.x + 4, paragraph.y + 12);
  await page.mouse.down();
  await page.mouse.move(paragraph.x + 180, paragraph.y + 12, { steps: 12 });
  await page.mouse.up();
  expect(
    await page.evaluate(() => getSelection()?.toString().length ?? 0),
  ).toBeGreaterThan(3);
  await settled(page, 3);
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("ArrowLeft");
    await settled(page, 1);
    await page.keyboard.press("ArrowRight");
    await settled(page, 3);
  }
  await page.setViewportSize({ width: 375, height: 1400 });
  await expect(book(page)).toHaveAttribute("data-ready", "true");
  await settled(page, 3);
  await expect(page.locator(".flip-engine")).toHaveCount(1);
  await page.setViewportSize({ width: 1280, height: 1400 });
  await expect(book(page)).toHaveAttribute("data-ready", "true");
  await settled(page, 3);
  await expect(page.locator(".flip-engine")).toHaveCount(1);
  await page.getByRole("button", { name: "Reading mode", exact: true }).click();
  await expect(page.locator(".flip-engine")).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Portfolio chapters" })
    .getByRole("button", { name: "Introduction", exact: true })
    .click();
  await settled(page, 1);
  await page.getByRole("button", { name: "Return to book" }).click();
  await expect(page.locator(".flip-engine")).toHaveCount(1);
});

test("mobile touch swipe and diagram scroll stay inside the page", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 1400 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await open(page);
  const cdp = await context.newCDPSession(page);
  const b = (await book(page).boundingBox())!,
    y = b.y + b.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: b.x + b.width - 32, y }],
  });
  for (let i = 1; i <= 12; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: b.x + b.width - 32 - ((b.width - 64) * i) / 12, y }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await settled(page, 2);
  await page.keyboard.press("ArrowRight");
  await settled(page, 3);
  for (let index = 4; index <= architectureIndex; index++) {
    await page.keyboard.press("ArrowRight");
    await settled(page, index);
  }
  const diagram = page.locator(
    `.library-slot [data-page="${architectureIndex}"] .diagram-nodes[role="region"]`,
  );
  expect(await diagram.evaluate((x) => x.scrollWidth > x.clientWidth)).toBe(
    true,
  );
  await diagram.evaluate((x) => (x.scrollLeft = x.scrollWidth));
  expect(await diagram.evaluate((x) => x.scrollLeft)).toBeGreaterThan(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 375, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 180, y: 600 }],
  });
  for (let i = 1; i <= 6; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 180, y: 600 - i * 40 }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() =>
      page
        .locator(`.library-slot [data-page="${architectureIndex}"] .page-inner`)
        .evaluate((el) => el.scrollTop),
    )
    .toBeGreaterThan(0);
  await settled(page, architectureIndex);
  await context.close();
});
