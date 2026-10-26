import { test, expect, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await settled(page, 1);
}

async function settled(page: Page, index: number) {
  await expect(page.locator("#book")).toHaveAttribute(
    "data-current-page",
    String(index),
  );
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
}

async function hasRotation(page: Page, sign: number) {
  return page.locator(".library-slot [data-page]").evaluateAll(
    (faces, sign) =>
      faces.some((face) => {
        const angle = (face as HTMLElement).style.transform.match(
          /rotate\(([-+\d.e]+)rad\)/,
        )?.[1];
        return angle !== undefined && Number(angle) * sign > 0.001;
      }),
    sign,
  );
}

async function middlePoint(page: Page, forward: boolean) {
  return page.locator("#book").evaluate((book, forward) => {
    const b = book.getBoundingClientRect();
    // Existing project links and scrollable diagram regions retain priority
    // over the enlarged turn zones; fall back to clear outer-margin paper.
    for (const dx of [80, 64, 48, 32, 16, 8]) {
      const x = forward ? b.right - dx : b.left + dx;
      for (let offset = 0; offset < b.height / 2 - 128; offset += 16) {
        for (const direction of [1, -1]) {
          const y = b.top + b.height / 2 + offset * direction;
          // Chromium expands nearby link targets for touch. Choose actual page
          // padding with clearance so this check tests turning, not link routing.
          if (
            [-12, 0, 12].every(( ox) =>
              [0, -24, 24].every(
                (dy) =>
                  !document
                    .elementFromPoint(x + ox, y + dy)
                    ?.closest('a,button,[role="region"]'),
              ),
            )
          )
            return { x, y };
        }
      }
    }
    throw new Error("No non-interactive middle-edge point available");
  }, forward);
}

for (const width of [375, 768, 1024]) {
  test(`${width}px touch corners fold from their selected origin without duplicate turns`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: test.info().project.use.baseURL as string,
      viewport: { width, height: 1400 },
      hasTouch: true,
      isMobile: width < 768,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await open(page);
    const step = width < 768 ? 1 : 2;
    for (const top of [true, false]) {
      for (const forward of [true, false]) {
        const point = await page.locator("#book").evaluate(
          (book, { forward, top }) => {
            const b = book.getBoundingClientRect();
            // Shorter phone pages put real contents links in the former fixed
            // test coordinate. Keep links authoritative; tap clear corner paper.
            for (const dx of [80, 64, 48, 32, 8]) {
              for (const dy of [100, 84, 68, 32, 8]) {
                const x = forward ? b.right - dx : b.left + dx;
                const y = top ? b.top + dy : b.bottom - dy;
                if (
                  [0, -12, 12].every(
                    (offset) =>
                      !document
                        .elementFromPoint(x, y + offset)
                        ?.closest('a,button,[role="region"]'),
                  )
                )
                  return { x, y };
              }
            }
            throw Error("No clear corner paper available");
          },
          { forward, top },
        );
        await page.touchscreen.tap(point.x, point.y);
        await expect(page.locator("#book")).toHaveAttribute(
          "data-turning",
          "true",
        );
        const sign = (forward ? -1 : 1) * (top ? 1 : -1);
        await expect.poll(() => hasRotation(page, sign)).toBe(true);
        await settled(page, forward ? 1 + step : 1);
        await page.waitForTimeout(900);
        await settled(page, forward ? 1 + step : 1);
      }
    }
    // The full outer edge is active, well away from the old corner squares.
    for (const forward of [true, false]) {
      const point = await middlePoint(page, forward);
      await page.touchscreen.tap(point.x, point.y);
      await expect.poll(() => hasStraightFold(page)).toBe(true);
      await settled(page, forward ? 1 + step : 1);
      await expect(
        page.locator('.library-slot .--hard:not([data-page-id="cover"])'),
      ).toHaveCount(0);
      await page.waitForTimeout(900);
      await settled(page, forward ? 1 + step : 1);
    }
    if (width < 768) {
      await page
        .getByRole("button", { name: "Next page", exact: true })
        .click();
      await settled(page, 2);
    }
    await page.setViewportSize({ width, height: width >= 1024 ? 600 : 844 });
    await page.evaluate(() => scrollTo(0, 0));
    const b = (await page.locator("#book").boundingBox())!;
    const session = await context.newCDPSession(page);
    const x = b.x + b.width - 8;
    const y = b.y + 20;
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let i = 1; i <= 6; i++)
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y - i * 24 }],
      });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect
      .poll(() =>
        width < 768
          ? page
              .locator('.library-slot [data-page="2"] .page-inner')
              .evaluate((el) => el.scrollTop)
          : page.evaluate(() => scrollY),
      )
      .toBeGreaterThan(0);
    await settled(page, width < 768 ? 2 : 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    await context.close();
  });
}

async function hasStraightFold(page: Page) {
  return page.locator(".library-slot [data-page]").evaluateAll((faces) =>
    faces.some((face) => {
      const element = face as HTMLElement;
      const angle = element.style.transform.match(
        /rotateY\(([-+\d.e]+)deg\)/,
      )?.[1];
      const tilt =
        angle === undefined ? 0 : (((Number(angle) % 360) + 540) % 360) - 180;
      return (
        getComputedStyle(element).display !== "none" &&
        angle !== undefined &&
        Math.abs(tilt) > 5 &&
        Math.abs(tilt) < 175 &&
        element.style.clipPath === "none"
      );
    }),
  );
}

for (const width of [375, 768, 1280, 1920]) {
  test(`${width}px expanded middle edges turn straight and restore corner curls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1400 });
    await open(page);
    const step = width < 768 ? 1 : 2;
    const b = (await page.locator("#book").boundingBox())!;
    for (const forward of [true, false]) {
      const point = await middlePoint(page, forward);
      await page.mouse.click(point.x, point.y);
      await expect.poll(() => hasStraightFold(page)).toBe(true);
      await settled(page, forward ? 1 + step : 1);
      await expect(
        page.locator('.library-slot .--hard:not([data-page-id="cover"])'),
      ).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    // Switching modes must not leave the paper rigid on the next corner turn.
    await page.mouse.click(b.x + b.width - 80, b.y + 100);
    await expect.poll(() => hasRotation(page, -1)).toBe(true);
    await settled(page, 1 + step);
    await page.mouse.click(b.x + 80, b.y + 100);
    await settled(page, 1);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".flip-engine")).toHaveCount(0);
    let point = await middlePoint(page, true);
    await page.mouse.click(point.x, point.y);
    await settled(page, 1 + step);
    point = await middlePoint(page, false);
    await page.mouse.click(point.x, point.y);
    await settled(page, 1);
  });
}

for (const width of [375, 768]) {
  test(`${width}px mouse corners and reduced-motion corners remain clickable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1400 });
    await open(page);
    const step = width < 768 ? 1 : 2;
    for (const reduced of [false, true]) {
      if (reduced) {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(page.locator(".flip-engine")).toHaveCount(0);
      }
      const b = (await page.locator("#book").boundingBox())!;
      await page.mouse.click(b.x + b.width - 8, b.y + 8);
      if (!reduced) await expect.poll(() => hasRotation(page, -1)).toBe(true);
      await settled(page, 1 + step);
      await page.mouse.click(b.x + 8, b.y + 8);
      await settled(page, 1);
    }
  });
}

test("favicon fallbacks are declared and served as valid icon files", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.locator('link[rel="icon"][type="image/png"]'),
  ).toHaveAttribute("href", "/favicon-32.png");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/apple-touch-icon.png",
  );
  for (const [url, size] of [
    ["/favicon-32.png", 32],
    ["/apple-touch-icon.png", 180],
  ] as const) {
    const response = await page.request.get(url);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
    const bytes = await response.body();
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    expect(bytes.readUInt32BE(16)).toBe(size);
    expect(bytes.readUInt32BE(20)).toBe(size);
  }
  const ico = await page.request.get("/favicon.ico");
  expect(ico.ok()).toBe(true);
  const bytes = await ico.body();
  expect(bytes.readUInt16LE(2)).toBe(1);
  expect(bytes.readUInt16LE(4)).toBe(2);
});
