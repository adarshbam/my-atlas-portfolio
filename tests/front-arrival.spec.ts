import { test, expect, type Page } from "@playwright/test";

// The arrival at the book: docs/FRONT-PAGE-TRAILER-PLAN-2026-11-22.md, Task 4.
const run = ".atlas-run";
const arrival = "#book-arrival";
const cover = '#book [data-page-id="cover"]:visible';

const toArrival = (page: Page, fraction: number) =>
  page.evaluate((f) => {
    const node = document.getElementById("book-arrival")!;
    scrollTo(0, node.getBoundingClientRect().top + scrollY + (node.offsetHeight - innerHeight) * f);
  }, fraction);
const arrive = (page: Page) =>
  page.locator(arrival).evaluate((node) => Number((node as HTMLElement).style.getPropertyValue("--arrive")));
const bookTransform = (page: Page) =>
  page.locator(".atlas-arrival-book").evaluate((node) => getComputedStyle(node).transform);
const bookScale = (page: Page) =>
  page.locator(".atlas-arrival-book").evaluate((node) => new DOMMatrix(getComputedStyle(node).transform).a);

test("the book's code is not fetched until the reader nears it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const chunks: string[] = [];
  page.on("request", (request) => {
    if (/book-slider-[^/]*\.js/.test(request.url())) chunks.push(request.url());
  });
  await page.goto("/");
  await expect(page.locator(`${run} h1`)).toBeVisible();
  await page.waitForTimeout(1500);
  expect(chunks).toEqual([]);
  await expect(page.locator("#book")).toHaveCount(0);
  await toArrival(page, 0);
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  expect(chunks.length).toBeGreaterThan(0);
});

test("scrolling through the arrival pushes in on the book and ends on the ordinary cover", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  // Before the camera starts in (0.34 of the way, step 5 round 2).
  await toArrival(page, 0.3);
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await expect.poll(() => arrive(page)).toBeCloseTo(0.3, 2);
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "false");
  // On the desk: the contact lines are showing, the book is small and not yet operable.
  await expect(page.locator(`${arrival} .atlas-arrival-copy h2`)).toHaveText("The whole atlas");
  await expect(page.locator(`${arrival} .atlas-arrival-copy`).getByRole("link", { name: "Email me" })).toBeVisible();
  expect(await bookScale(page)).toBeCloseTo(0.55, 2);
  expect(await page.locator(".atlas-arrival-book").evaluate((node) => getComputedStyle(node).pointerEvents)).toBe("none");
  const small = (await page.locator(cover).first().boundingBox())!;

  await toArrival(page, 0.7);
  await expect.poll(() => bookScale(page)).toBeGreaterThan(0.6);
  expect(await bookScale(page)).toBeLessThan(1);

  await toArrival(page, 1);
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  expect(await bookTransform(page)).toBe("none");
  // The lamp-lit desk stays under the usable book (the user's decision, 23 November 2026):
  // the painted desk is still there at full strength, and its contact lines are not.
  expect(await page.locator(".atlas-arrival-night").evaluate((node) => [getComputedStyle(node).visibility, Number(getComputedStyle(node).opacity)])).toEqual(["visible", 1]);
  await expect.poll(() => page.locator(".atlas-arrival-desk img").evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
  expect(await page.locator(".atlas-arrival-copy").evaluate((node) => getComputedStyle(node).visibility)).toBe("hidden");
  await expect(page.locator(".book-toolbar")).toBeVisible();
  expect(await page.locator(".book-toolbar").evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
  await expect(page.locator(".pagination")).toBeVisible();
  // The ordinary closed-book view: the whole cover on screen, centred, larger than it was on the desk.
  const box = (await page.locator(cover).first().boundingBox())!;
  expect(box.width).toBeGreaterThan(small.width * 1.6);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(900);
  expect(Math.abs(box.x + box.width / 2 - 640)).toBeLessThanOrEqual(16);
  // And it works: the cover opens.
  await page.getByRole("button", { name: "Open book" }).first().click();
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "1");
  expect(errors).toEqual([]);
});

for (const [width, height] of [[375, 600], [375, 900], [1280, 600], [1280, 900]] as const)
  test(`${width}x${height}: a link to the book lands on a finished arrival and a usable book`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/#book");
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
    expect(await bookTransform(page)).toBe("none");
    // Nothing is trapped by the pinned block: toolbar, cover and pager can each be reached.
    for (const selector of [".book-toolbar", cover, ".pagination"]) {
      const target = page.locator(selector).first();
      await target.scrollIntoViewIfNeeded();
      await expect(target).toBeInViewport();
    }
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.locator("#book")).not.toHaveAttribute("data-logical-page", "0");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

test("flinging to the bottom still ends on a finished arrival", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator(`${run} h1`)).toBeVisible();
  await page.mouse.move(640, 450);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 6000);
  await page.waitForTimeout(1500);
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  expect(await bookTransform(page)).toBe("none");
});

test("returning from the story lands back on the book, on the page that was open", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#book");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await page.locator(".chapter-nav button").filter({ hasText: /^Vault Storage$/ }).click();
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "3");
  const before = await page.evaluate(() => scrollY);
  expect(before).toBeGreaterThan(900);
  await page.locator("[data-open-story]").first().evaluate((link: HTMLAnchorElement) => link.click());
  await expect(page.locator(".obs-hero h1")).toBeVisible();
  await page.getByRole("link", { name: /Back to the atlas/ }).click();
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "3");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
});

test("a project's book link opens the book on that project's page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.locator(`${run} [data-scene="vault"]`).getByRole("button", { name: "Read this in the book" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "3");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
});

test("reduced motion: the desk is a still block and the book is full size from the start", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(arrival)).toHaveAttribute("data-mode", "still");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  await page.locator(arrival).scrollIntoViewIfNeeded();
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  expect(await bookTransform(page)).toBe("none");
  // The night layer is a plain block in the flow; the painted desk lies under it and the book alike.
  expect(await page.locator(".atlas-arrival-night").evaluate((node) => getComputedStyle(node).position)).toBe("static");
  const desk = (await page.locator(".atlas-arrival-desk").boundingBox())!;
  const pin = (await page.locator(".atlas-arrival-pin").boundingBox())!;
  expect(Math.abs(desk.height - pin.height)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await expect(page.locator(`${arrival} .atlas-arrival-copy`).getByRole("link", { name: "Email me" })).toBeVisible();
  // Visible is not enough: an element at opacity 0 still counts as visible.
  expect(await page.locator(`${arrival} .atlas-arrival-copy`).evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
  expect(await page.locator(`${arrival} .atlas-arrival-night`).evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
});

test("the whole page scrolls without layout shift", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    const store = window as unknown as { __cls: number };
    store.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[])
        if (!entry.hadRecentInput) store.__cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/");
  await expect(page.locator(`${run} h1`)).toBeVisible();
  await page.evaluate(async () => {
    const end = () => document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y <= end(); y += 240) {
      scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    }
    scrollTo(0, end());
  });
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.05);
});

// ---------- Found by review, 23 November 2026 ----------

test("tabbing from the run to the desk's contact links brings them out from under the run", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator(`${run} h1`)).toBeVisible();
  // Go to the last link in the run by keyboard-style focus, then Tab on into the arrival.
  await page.locator(`${run} .obs-trailer-rail a`).last().focus();
  await page.keyboard.press("Tab");
  const email = page.locator(`${arrival} .atlas-arrival-copy`).getByRole("link", { name: "Email me" });
  await expect(email).toBeFocused();
  // The focused link is what is actually on screen at its own centre, at full strength.
  await expect
    .poll(() =>
      email.evaluate((link) => {
        const box = link.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return link.contains(hit) && Number(getComputedStyle(link.closest(".atlas-arrival-copy")!).opacity);
      }),
    )
    .toBe(1);
});

test("the opening links cannot be pressed once the opening words have gone", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const hello = page.locator(`${run} [data-scene="hello"]`);
  await expect(hello).toHaveAttribute("data-beat", "0");
  expect(await hello.locator(".atlas-hello-copy").evaluate((node) => getComputedStyle(node).pointerEvents)).toBe("auto");
  await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>(".atlas-run .obs-trailer")!;
    const scene = track.querySelector<HTMLElement>('[data-scene="hello"]')!;
    const total = Number(getComputedStyle(track).getPropertyValue("--obs-trailer-units"));
    scrollTo(0, ((track.offsetHeight - innerHeight) * Number(scene.dataset.span) * 0.6) / total);
  });
  await expect(hello).toHaveAttribute("data-beat", "1");
  await expect(hello).toHaveAttribute("data-state", "active");
  expect(await hello.locator(".atlas-hello-copy").evaluate((node) => getComputedStyle(node).pointerEvents)).toBe("none");
});

test("a rail tick moves keyboard focus to its scene", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.locator(`${run} .obs-trailer-rail a[data-tick="vault"]`).focus();
  await page.keyboard.press("Enter");
  const vault = page.locator(`${run} [data-scene="vault"]`);
  await expect(vault).toHaveAttribute("data-state", "active");
  await expect(vault.locator("h2")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(vault.getByRole("link", { name: "Live site", exact: true })).toBeFocused();
  expect(new URL(page.url()).hash).toBe("");
});

test("Explore Vault from the opening's introduction player takes the reader to Vault in the book", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator(`${run} h1`)).toBeVisible();
  await expect(page.locator("#book")).toHaveCount(0);
  // The player's own button dispatches this event (public/media-viewer.js).
  await page.evaluate(() => document.dispatchEvent(new CustomEvent("atlas:video-vault")));
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "3");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
});

test("a book link pressed while the book's code is still loading still opens that page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  // Hold the book's code back so the press lands while it is in flight.
  await page.route(/book-slider-[^/]*.js/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.continue();
  });
  await page.goto("/");
  await toArrival(page, 0); // near enough for the book to start loading
  await page.waitForTimeout(200);
  await expect(page.locator("#book")).toHaveCount(0);
  await page.locator(`${run} [data-scene="vault"]`).getByRole("button", { name: "Read this in the book" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "3");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
});

// ---------- Opening the book: plan Task 10 ----------

const shell = "#book";
const dimLayer = ".atlas-arrival-dim";
const bandLayer = ".atlas-arrival-band";
const dimOpacity = (page: Page) => page.locator(dimLayer).evaluate((node) => Number(getComputedStyle(node).opacity));
const dimToken = (page: Page) =>
  page.locator(arrival).evaluate((node) => Number(getComputedStyle(node).getPropertyValue("--arrival-dim")));
/** Animations under the arrival that are still running: CSS animations, transitions and scripted ones. */
const runningUnderArrival = (page: Page) =>
  page.locator(arrival).evaluate((node) =>
    node
      .getAnimations({ subtree: true })
      .filter((animation) => animation.playState === "running")
      .map((animation) => (animation as CSSAnimation).animationName ?? (animation as CSSTransition).transitionProperty ?? "scripted"),
  );
const turnedTo = async (page: Page, logicalPage: number) => {
  await expect(page.locator(shell)).toHaveAttribute("data-logical-page", String(logicalPage));
  await expect(page.locator(shell)).toHaveAttribute("data-turning", "false");
};

test("opening the book: the shell names the turn, the desk goes dark and stays dark, and is lit again when the cover closes", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#book");
  await expect(page.locator(shell)).toHaveAttribute("data-ready", "true");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  const token = await dimToken(page);
  expect(token).toBe(0.5);

  // Closed: the desk is lit, no turn is named, and the band is not showing.
  expect(await dimOpacity(page)).toBe(0);
  expect(await page.locator(shell).getAttribute("data-turn-kind")).toBeNull();
  await expect(page.locator(bandLayer)).toHaveCount(1);
  expect(await page.locator(bandLayer).evaluate((node) => getComputedStyle(node).display)).toBe("none");
  // The layer is nothing to a reader: no name, no press, no place in the layout.
  const layer = await page.locator(dimLayer).evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      hidden: node.getAttribute("aria-hidden"),
      text: node.textContent,
      children: node.childElementCount,
      position: style.position,
      pointer: style.pointerEvents,
      duration: style.transitionDuration,
      property: style.transitionProperty,
      first: node.parentElement!.firstElementChild!.className,
    };
  });
  // It lies inside the desk's layer, straight after the painting, so it darkens the painted desk.
  expect(layer).toEqual({ hidden: "true", text: "", children: 0, position: "absolute", pointer: "none", duration: "0.42s", property: "opacity", first: "atlas-arrival-desk" });
  expect(await page.locator(dimLayer).evaluate((node) => node.previousElementSibling?.className)).toBe("atlas-arrival-desk");
  expect(await page.locator(bandLayer).getAttribute("aria-hidden")).toBe("true");

  // The cover opens: the turn is named while it lasts, and the desk starts to go dark.
  await page.getByRole("button", { name: "Open book" }).first().click();
  await expect(page.locator(shell)).toHaveAttribute("data-turn-kind", "cover-open");
  await expect(page.locator(shell)).toHaveAttribute("data-turning", "true");
  await expect.poll(() => dimOpacity(page)).toBeGreaterThan(0);
  // One band of light, over the cover's own place (the right-hand page) and clipped to it.
  const band = await page.locator(bandLayer).evaluate((node) => {
    const style = getComputedStyle(node);
    const light = getComputedStyle(node, "::before");
    const box = node.getBoundingClientRect();
    const book = node.parentElement!.getBoundingClientRect();
    return {
      display: style.display,
      overflow: style.overflowX,
      pointer: style.pointerEvents,
      name: light.animationName,
      duration: light.animationDuration,
      count: light.animationIterationCount,
      leftOfSpine: Math.round(box.left - (book.left + book.width / 2)),
      rightOfBook: Math.round(box.right - book.right),
      tall: Math.round(box.height - book.height),
    };
  });
  expect(band).toEqual({ display: "block", overflow: "clip", pointer: "none", name: "atlas-arrival-band", duration: "0.8s", count: "1", leftOfSpine: 0, rightOfBook: 0, tall: 0 });
  // Nothing is drawn on the bare desk to the left as if a page already lay there.
  expect(await page.locator(shell).evaluate((node) => getComputedStyle(node).boxShadow)).toBe("none");
  expect(await page.locator(`${shell} .stf__hardInnerShadow`).evaluate((node) => getComputedStyle(node).backfaceVisibility)).toBe("hidden");

  // Open: the turn is no longer named, the band is over, and the desk stays dark at the token's value.
  await turnedTo(page, 1);
  expect(await page.locator(shell).getAttribute("data-turn-kind")).toBeNull();
  await expect.poll(() => dimOpacity(page)).toBe(token);
  await expect.poll(() => runningUnderArrival(page)).toEqual([]);
  expect(await page.locator(bandLayer).evaluate((node) => getComputedStyle(node).display)).toBe("none");
  expect(await page.locator(shell).evaluate((node) => getComputedStyle(node).boxShadow)).not.toBe("none");
  // The dark desk takes no press: what is under the pointer on the bare desk is not the layer,
  // and the book's own theme switch works through it and leaves it as it is.
  expect(await page.evaluate(() => document.elementFromPoint(8, 450)?.className)).not.toBe("atlas-arrival-dim");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await dimOpacity(page)).toBe(token);
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await dimOpacity(page)).toBe(token);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  // A page turn inside the book is named as one, and the desk stays dark through it.
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.locator(shell)).toHaveAttribute("data-turn-kind", "page");
  expect(await dimOpacity(page)).toBe(token);
  await turnedTo(page, 3);
  expect(await page.locator(shell).getAttribute("data-turn-kind")).toBeNull();
  expect(await dimOpacity(page)).toBe(token);
  await page.getByRole("button", { name: "Previous page" }).click();
  await turnedTo(page, 1);

  // The cover closes: named while it lasts; the desk is lit again and stays lit.
  await page.getByRole("button", { name: "Previous page" }).click();
  await expect(page.locator(shell)).toHaveAttribute("data-turn-kind", "cover-close");
  await expect.poll(() => dimOpacity(page)).toBeLessThan(token);
  await turnedTo(page, 0);
  await expect(page.locator(shell)).toHaveAttribute("data-cover", "true");
  expect(await page.locator(shell).getAttribute("data-turn-kind")).toBeNull();
  await expect.poll(() => dimOpacity(page)).toBe(0);
  expect(errors).toEqual([]);
});

test("opening the book on a phone: the band keeps to the one page and the desk goes dark and light again", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/#book");
  await expect(page.locator(shell)).toHaveAttribute("data-ready", "true");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  const token = await dimToken(page);
  expect(await dimOpacity(page)).toBe(0);
  await page.getByRole("button", { name: "Open book" }).first().click();
  await expect(page.locator(shell)).toHaveAttribute("data-turn-kind", "cover-open");
  const band = await page.locator(bandLayer).evaluate((node) => {
    const box = node.getBoundingClientRect();
    const book = node.parentElement!.getBoundingClientRect();
    return { display: getComputedStyle(node).display, left: Math.round(box.left - book.left), right: Math.round(box.right - book.right), tall: Math.round(box.height - book.height) };
  });
  expect(band).toEqual({ display: "block", left: 0, right: 0, tall: 0 });
  await turnedTo(page, 1);
  await expect.poll(() => dimOpacity(page)).toBe(token);
  await expect.poll(() => runningUnderArrival(page)).toEqual([]);
  // The toolbar and the pager still take a press on the dark desk.
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await expect(page.locator("#atlas-contents")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Previous page" }).click();
  await expect(page.locator(shell)).toHaveAttribute("data-turn-kind", "cover-close");
  await turnedTo(page, 0);
  await expect.poll(() => dimOpacity(page)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("a book that is already open when the reader reaches it has its desk dark", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.locator(`${run} [data-scene="vault"]`).getByRole("button", { name: "Read this in the book" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(shell)).toHaveAttribute("data-ready", "true");
  await turnedTo(page, 3);
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  await expect.poll(async () => dimOpacity(page)).toBe(await dimToken(page));
});

for (const [width, height] of [[1280, 900], [375, 812]] as const)
  test(`${width}px reduced motion: the desk is dark at once while the book is open, with no band and nothing moving`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#book");
    await expect(page.locator(shell)).toHaveAttribute("data-ready", "true");
    await expect(page.locator(shell)).toHaveAttribute("data-mode", "reduced");
    const token = await dimToken(page);
    expect(await dimOpacity(page)).toBe(0);
    await expect(page.locator(bandLayer)).toHaveCount(0);

    // The press and the reading of the layer happen in one task: no frame may lie between them.
    const atOnce = await page.getByRole("button", { name: "Open book" }).first().evaluate(async (button: HTMLElement) => {
      button.click();
      // React commits a press made by script in a microtask; one is enough to see the result.
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
      return Number(getComputedStyle(document.querySelector(".atlas-arrival-dim")!).opacity);
    });
    expect(atOnce).toBe(token);
    await expect(page.locator(shell)).toHaveAttribute("data-logical-page", "1");
    await expect(page.locator(shell)).toHaveAttribute("data-cover", "false");
    expect(await page.locator(shell).getAttribute("data-turn-kind")).toBeNull();
    expect(await dimOpacity(page)).toBe(token);

    // Nothing under the arrival is moving, and nothing there can: no running animation, and no
    // transition longer than a millisecond. The still pages' own 200ms cross-fade from one
    // page to the next (.plain-face, approved long before this task) is the one exception.
    await page.waitForTimeout(400);
    expect(await runningUnderArrival(page)).toEqual([]);
    const slow = await page.locator(arrival).evaluate((node) => {
      const seconds = (value: string) => Math.max(...value.split(",").map((part) => (part.trim().endsWith("ms") ? parseFloat(part) / 1000 : parseFloat(part))));
      const found: string[] = [];
      for (const element of [node, ...node.querySelectorAll("*")]) {
        if (element.classList.contains("plain-face")) continue;
        for (const pseudo of [undefined, "::before", "::after"]) {
          const style = getComputedStyle(element, pseudo);
          if (pseudo && style.content === "none") continue;
          if (seconds(style.transitionDuration) > 0.001 || (style.animationName !== "none" && seconds(style.animationDuration) > 0.001))
            found.push(`${element.tagName}.${element.className}${pseudo ?? ""} ${style.transitionDuration} ${style.animationName}`);
        }
      }
      return found;
    });
    expect(slow).toEqual([]);

    // Back on the cover the desk is lit, again at once.
    const lit = await page.getByRole("button", { name: "Previous page" }).evaluate(async (button: HTMLElement) => {
      button.click();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));
      return Number(getComputedStyle(document.querySelector(".atlas-arrival-dim")!).opacity);
    });
    expect(lit).toBe(0);
    await expect(page.locator(shell)).toHaveAttribute("data-cover", "true");
  });

// ---------- Found by review of step 3, 23 November 2026 ----------

/** Where keyboard focus is, in words a failure message can be read by. */
const focusIs = (page: Page) =>
  page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active || active === document.body) return "nowhere";
    const where = active.closest("#book") ? "in the book" : active.closest(".atlas") ? "in the atlas" : active.closest(".atlas-arrival-copy") ? "on the desk" : active.closest(".atlas-run") ? "in the run" : "elsewhere";
    return `${where}: ${active.tagName.toLowerCase()} ${(active.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40)}`;
  });

for (const motion of ["no-preference", "reduce"] as const)
  test(`${motion}: the book's own skip link leaves the reader at the book, on the open page's heading`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto("/#book");
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
    const before = await page.evaluate(() => scrollY);
    expect(before).toBeGreaterThan(900);
    // The first stop in the atlas is its skip link.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to portfolio" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect.poll(() => focusIs(page)).toBe("in the book: h2 AdarshSingh");
    // Nothing follows a frame or a moment later: the page has not moved, the book is still
    // the book the reader had, and the address did not become a navigation.
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
    await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "0");
    expect(await focusIs(page)).toBe("in the book: h2 AdarshSingh");
    // And the next Tab carries on inside the book.
    await page.keyboard.press("Tab");
    expect(await focusIs(page)).toMatch(/^in the book: /);
    expect(await page.evaluate(() => scrollY)).toBe(before);
  });

test("the skip link pressed from a later page keeps that page and goes to its heading", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#book");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await page.locator(".chapter-nav button").filter({ hasText: /^Vault Storage$/ }).click();
  await turnedTo(page, 3);
  const before = await page.evaluate(() => scrollY);
  await page.getByRole("link", { name: "Skip to portfolio" }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => focusIs(page)).toMatch(/^in the book: h2 /);
  await page.waitForTimeout(400);
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "3");
  expect(await page.evaluate(() => scrollY)).toBe(before);
  expect(await page.evaluate(() => (document.activeElement as HTMLElement).closest("[data-page]")?.getAttribute("data-page"))).toBe("3");
});

test("changing only the address to #book, with no reload, takes the reader to the book", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator(`${run} h1`)).toBeVisible();
  await expect(page.locator("#book")).toHaveCount(0);
  await page.evaluate(() => {
    location.hash = "book";
  });
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  expect(await bookTransform(page)).toBe("none");
  await expect(page.locator(".book-toolbar")).toBeInViewport();
  await expect.poll(() => focusIs(page)).toMatch(/^in the (atlas|book): /);
});

for (const [width, height, motion] of [
  [375, 812, "reduce"],
  [1280, 900, "reduce"],
  [812, 375, "no-preference"], // a phone on its side: the page stands still there too
  [1280, 900, "no-preference"],
] as const)
  test(`${width}x${height} ${motion}: the book's skip link is not drawn until it has focus`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: motion });
    await page.goto("/#book");
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
    const still = (await page.locator(arrival).getAttribute("data-mode")) === "still";
    // Standing still, the link's parked place is on the desk block above the book: bring that
    // on screen. (Pinned, the same scroll would leave the arrival, and the link with it.)
    if (still) {
      // A touch of the wheel ends the hold that keeps a new arrival at the book; then the page
      // is moved by an exact amount (Edge scales a wheel step by the window's height).
      await page.mouse.move(4, height / 2);
      await page.mouse.wheel(0, -1);
      await page.waitForTimeout(100);
      // (On a tall phone the page ends with the book already this far down.)
      await page.evaluate(() => scrollBy(0, Math.min(0, document.querySelector(".atlas-arrival-book")!.getBoundingClientRect().top - 160)));
      await expect.poll(() => page.locator(".atlas-arrival-book").evaluate((node) => Math.round(node.getBoundingClientRect().top))).toBeGreaterThanOrEqual(160);
    }
    const skip = page.locator(`${arrival} .skip-link`);
    const drawn = () =>
      skip.evaluate((link) => {
        const box = link.getBoundingClientRect();
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        const onScreen = x >= 0 && x < innerWidth && y >= 0 && y < innerHeight;
        return {
          clip: getComputedStyle(link).clipPath,
          onScreen,
          // A fully clipped box is neither painted nor found by a press at its place.
          found: onScreen && link.contains(document.elementFromPoint(x, y)),
        };
      });
    expect(await drawn()).toEqual({ clip: "inset(50%)", onScreen: still, found: false });
    // It is still a stop for the keyboard, and shows itself when reached.
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport({ ratio: 1 });
    expect(await drawn()).toEqual({ clip: "none", onScreen: true, found: true });
    expect(await skip.evaluate((link) => link.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  });

test("back from the story, keyboard focus is on Contents at the book, and the next Tab stays there", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#book");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await page.locator(".chapter-nav button").filter({ hasText: /^Vault Storage$/ }).click();
  await turnedTo(page, 3);
  const before = await page.evaluate(() => scrollY);
  // By keyboard, as a reader would: Contents, then "My story" inside it.
  const contents = page.getByRole("button", { name: "Contents", exact: true });
  await contents.focus();
  await page.keyboard.press("Enter");
  await page.locator("#atlas-contents [data-open-story]").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".obs-hero h1")).toBeVisible();
  await page.getByRole("link", { name: /Back to the atlas/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "3");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
  await expect(contents).toBeFocused();
  // It stays there: nothing takes focus away once the page has settled.
  await page.waitForTimeout(500);
  await expect(contents).toBeFocused();
  await expect(contents).toBeInViewport({ ratio: 1 });
  expect(await contents.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("solid");
  await page.keyboard.press("Tab");
  expect(await focusIs(page)).toMatch(/^in the atlas: /);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
});

test("back from the story by the browser's Back button, focus is at the book too", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#book");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  const before = await page.evaluate(() => scrollY);
  const contents = page.getByRole("button", { name: "Contents", exact: true });
  await contents.focus();
  await page.keyboard.press("Enter");
  await page.locator("#atlas-contents [data-open-story]").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".obs-hero h1")).toBeVisible();
  await page.goBack();
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
  await expect(contents).toBeFocused();
  await page.waitForTimeout(500);
  await expect(contents).toBeFocused();
  await page.keyboard.press("Tab");
  expect(await focusIs(page)).toMatch(/^in the atlas: /);
  expect(await page.evaluate(() => scrollY)).toBe(before);
});

test("back from the story opened from the desk, focus is on the desk's own link, where the reader left", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await toArrival(page, 0.5);
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await expect.poll(() => arrive(page)).toBeCloseTo(0.5, 2);
  const before = await page.evaluate(() => scrollY);
  const story = page.locator(`${arrival} .atlas-arrival-copy`).getByRole("link", { name: "My story" });
  await story.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".obs-hero h1")).toBeVisible();
  await page.getByRole("link", { name: /Back to the atlas/ }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
  await expect(story).toBeFocused();
  await page.waitForTimeout(500);
  await expect(story).toBeFocused();
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "false");
  expect(await page.locator(`${arrival} .atlas-arrival-copy`).evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
  expect(await page.evaluate(() => scrollY)).toBe(before);
});

test("the story reloaded, then back: the reader left from the book and is put back in it, focus included", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#book");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await page.locator(".chapter-nav button").filter({ hasText: /^Vault Storage$/ }).click();
  await turnedTo(page, 3);
  const before = await page.evaluate(() => scrollY);
  await page.getByRole("button", { name: "Contents", exact: true }).click();
  await page.locator("#atlas-contents [data-open-story]").click();
  await expect(page.locator(".obs-hero h1")).toBeVisible();
  // After a reload nothing remembers which link was pressed; only the place is stored.
  await page.reload();
  await expect(page.locator(".obs-hero h1")).toBeVisible();
  await page.getByRole("link", { name: /Back to the atlas/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#book")).toHaveAttribute("data-logical-page", "3");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
  await expect.poll(() => focusIs(page)).toMatch(/^in the (atlas|book): /);
  await page.waitForTimeout(500);
  await page.keyboard.press("Tab");
  expect(await focusIs(page)).toMatch(/^in the (atlas|book): /);
  expect(await page.evaluate(() => scrollY)).toBe(before);
});

test("the story reloaded, then back: the reader left from the desk and focus is on the desk's link", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await toArrival(page, 0.5);
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await expect.poll(() => arrive(page)).toBeCloseTo(0.5, 2);
  const before = await page.evaluate(() => scrollY);
  const story = page.locator(`${arrival} .atlas-arrival-copy`).getByRole("link", { name: "My story" });
  await story.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".obs-hero h1")).toBeVisible();
  await page.reload();
  await expect(page.locator(".obs-hero h1")).toBeVisible();
  await page.getByRole("link", { name: /Back to the atlas/ }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
  await expect(story).toBeFocused();
  await page.waitForTimeout(500);
  await expect(story).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(before);
});

test("a reader who opens the story's address first and comes back lands at the top with focus left alone", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/story");
  await expect(page.locator(".obs-hero h1")).toBeVisible();
  await page.getByRole("link", { name: /Back to the atlas/ }).click();
  await expect(page.locator(`${run} h1`)).toBeVisible();
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  expect(await focusIs(page)).toBe("nowhere");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "false");
});

test("widening the window at the book keeps the reader arrived", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await page.goto("/#book");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  await page.mouse.move(500, 350);
  await page.mouse.wheel(0, 1); // the reader has touched the page: the landing hold is over
  await page.waitForTimeout(100);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
  expect(await bookTransform(page)).toBe("none");
});

// A tab left open across a new build asks for files that are no longer served.
for (const chunk of ["Story", "book-slider"] as const) {
  test(`a missing ${chunk} file (a tab older than the build) reloads the page once instead of leaving it empty`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await expect(page.locator(`${run} h1`)).toBeVisible();
    // Every request for the file fails, as for a stale tab, until the page itself is loaded again.
    let failed = 0;
    let stale = true;
    page.on("request", (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) stale = false;
    });
    await page.route(new RegExp(`/assets/${chunk}-.*\.js`), (route) => {
      if (!stale) return route.continue();
      failed++;
      return route.fulfill({ status: 404, body: "not found" });
    });
    if (chunk === "Story") {
      await toArrival(page, 0.5);
      await page.locator(`${arrival} .atlas-arrival-copy`).getByRole("link", { name: "My story" }).click();
      await expect(page.locator(".obs-hero h1")).toBeVisible({ timeout: 15_000 });
      expect(new URL(page.url()).pathname).toBe("/story");
    } else {
      await page.locator(`${run} [data-scene="hello"]`).getByRole("link", { name: "Skip to the book" }).click();
      await expect(page.locator("#book")).toHaveAttribute("data-ready", "true", { timeout: 15_000 });
      await expect(page.locator(arrival)).toHaveAttribute("data-arrived", "true");
    }
    expect(failed).toBeGreaterThanOrEqual(1);
    expect(stale).toBe(false);
    expect(await page.evaluate(() => document.getElementById("root")!.childElementCount)).toBeGreaterThan(0);
  });
}

// ---------- The run dissolves into the desk (the user's decision, 23 November 2026) ----------
test("the run does not slide off the desk: pinned, its words go, then the stage dissolves into the desk under it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const stage = page.locator(`${run} .obs-trailer-stage`);
  const state = () =>
    page.evaluate(() => {
      const stageNode = document.querySelector<HTMLElement>(".atlas-run .obs-trailer-stage")!;
      const opacity = (selector: string) => Number(getComputedStyle(document.querySelector(selector)!).opacity);
      return {
        stageTop: Math.round(stageNode.getBoundingClientRect().top),
        pinTop: Math.round(document.querySelector(".atlas-arrival-pin")!.getBoundingClientRect().top),
        stage: opacity(".atlas-run .obs-trailer-stage"),
        words: opacity('.atlas-run [data-scene="references"] .atlas-voices'),
        copy: opacity(".atlas-arrival-copy"),
        gone: stageNode.dataset.gone,
      };
    });

  // The desk is already pinned under the run while the last scene is whole.
  await toArrival(page, 0.12);
  await expect.poll(() => arrive(page)).toBeCloseTo(0.12, 2);
  expect(await state()).toEqual({ stageTop: 0, pinTop: 0, stage: 1, words: 1, copy: 0, gone: "false" });

  // First the words go; the painting is still whole and still pinned.
  await toArrival(page, 0.25);
  await expect.poll(async () => (await state()).words).toBeLessThan(0.5);
  let now = await state();
  expect(now.words).toBeGreaterThan(0);
  expect({ stageTop: now.stageTop, stage: now.stage, copy: now.copy }).toEqual({ stageTop: 0, stage: 1, copy: 0 });

  // Then the stage itself: half way through it is half there, with no words left, and has not moved.
  await toArrival(page, 0.3);
  await expect.poll(async () => (await state()).stage).toBeLessThan(0.7);
  now = await state();
  expect(now.stage).toBeGreaterThan(0.3);
  expect({ stageTop: now.stageTop, pinTop: now.pinTop, words: now.words }).toEqual({ stageTop: 0, pinTop: 0, words: 0 });

  // Gone: it scrolls away unseen, takes no press, and the desk's lines are up.
  await toArrival(page, 0.37);
  await expect(stage).toHaveAttribute("data-gone", "true");
  now = await state();
  expect({ stage: now.stage, pinTop: now.pinTop, copy: now.copy }).toEqual({ stage: 0, pinTop: 0, copy: 1 });
  expect(now.stageTop).toBeLessThan(0);
  expect(await stage.evaluate((node) => [getComputedStyle(node).pointerEvents, getComputedStyle(node.querySelector("a")!).pointerEvents])).toEqual(["none", "none"]);
  // What is under the pointer in the middle of the screen is the desk or the book, never the run.
  expect(await page.evaluate(() => !!document.elementFromPoint(640, 400)?.closest("#book-arrival"))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

  // Back up: the run is whole again.
  await toArrival(page, 0.12);
  await expect(stage).toHaveAttribute("data-gone", "false");
  await expect.poll(async () => (await state()).words).toBe(1);
  expect((await state()).stage).toBe(1);
});

test("from the book, Shift+Tab into the dissolved run brings the references back to rest", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await toArrival(page, 0.5);
  await expect(page.locator(`${run} .obs-trailer-stage`)).toHaveAttribute("data-gone", "true");
  const email = page.locator(`${arrival} .atlas-arrival-copy`).getByRole("link", { name: "Email me" });
  await email.focus();
  await page.keyboard.press("Shift+Tab");
  // The stop before the desk's first link is in the run (its rail or its last scene): it is on screen again, whole.
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest(".atlas-run"))).toBe(true);
  await expect.poll(() => page.locator(`${run} .obs-trailer-stage`).evaluate((node) => Number(getComputedStyle(node).opacity))).toBe(1);
  await expect(page.locator(`${run} .obs-trailer-stage`)).toHaveAttribute("data-gone", "false");
});
