import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { pages } from "../src/data/portfolio";

test("D5-5.3.2 editable controls, widgets and consumed events own their arrow keys", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page
    .getByRole("navigation", { name: "Portfolio chapters" })
    .getByRole("button", { name: "Vault Storage", exact: true })
    .click();
  await expect(page.locator("#book")).toHaveAttribute("data-turning", "false");
  for (const kind of ["input", "textarea", "editable", "slider", "consumed"]) {
    await page.evaluate((kind) => {
      const el = document.createElement(
        kind === "input" || kind === "textarea" ? kind : "div",
      );
      el.id = "keyboard-fixture";
      el.tabIndex = 0;
      if (kind === "editable") el.setAttribute("contenteditable", "");
      if (kind === "slider") el.setAttribute("role", "slider");
      if (kind === "consumed")
        el.addEventListener("keydown", (e) => e.preventDefault());
      document
        .querySelector('.library-slot [data-page="3"] .page-content')!
        .append(el);
      el.focus();
    }, kind);
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#book")).toHaveAttribute(
      "data-current-page",
      "3",
    );
    await expect(page.locator("#book")).toHaveAttribute(
      "data-turning",
      "false",
    );
    await page.locator("#keyboard-fixture").evaluate((el) => el.remove());
  }
});

for (const width of [375, 1280]) {
  test(`D5-5.3.3 ${width}px focus survives native/reduced replacement and contents jumps`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
    const nav = page.getByRole("navigation", { name: "Portfolio chapters" });
    await nav.getByRole("button", { name: "Pipeline", exact: true }).click();
    await expect(page.locator("#book")).toHaveAttribute(
      "data-turning",
      "false",
    );
    const face = page.locator('.library-slot [data-page-id="pipeline"]');
    await face.locator("h2").focus();
    await page.keyboard.press("Tab");
    await expect(face.locator("a").first()).toBeFocused();
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reducedFace = page.locator(
      '.plain-face[aria-hidden=false] [data-page-id="pipeline"]',
    );
    await expect(reducedFace.locator("h2")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(reducedFace.locator("a").first()).toBeFocused();
    await expect(reducedFace.locator("a").first()).toHaveCSS(
      "outline-style",
      "solid",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(face.locator("h2")).toBeFocused();
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[inert],[aria-hidden="true"]'),
      ),
    ).toBe(false);
  });

  test(`D5-5.3.4 ${width}px preference change during turn has no stranded fold or stale navigation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    const book = page.locator("#book");
    await expect(book).toHaveAttribute("data-ready", "true");
    await page.getByRole("button", { name: "Open book", exact: true }).click();
    await expect(book).toHaveAttribute("data-turning", "true");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(book).toHaveAttribute("data-mode", "reduced");
    await expect(book).toHaveAttribute("data-turning", "false");
    await expect(page.locator(".flip-engine")).toHaveCount(0);
    await page
      .getByRole("navigation", { name: "Portfolio chapters" })
      .getByRole("button", { name: "Contact", exact: true })
      .click();
    await expect(book).toHaveAttribute("data-logical-page", "12");
    await page
      .getByRole("button", { name: "Reading mode", exact: true })
      .click();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(book).toHaveAttribute("data-mode", "reading");
    await expect(page.locator(".flip-engine")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Return to book", exact: true })
      .click();
    await expect(book).toHaveAttribute(
      "data-current-page",
      width < 768 ? "12" : "11",
    );
    await expect(book).toHaveAttribute("data-turning", "false");
    expect(errors).toEqual([]);
  });
}

test("D5-5.3.1 D5-5.3.5 full linear tab order reaches contact; active headings and controls are semantic", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reading mode", exact: true }).click();
  await page.locator(".reading-document .cover-open").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#reading-introduction h2")).toBeFocused();
  const visited: string[] = [];
  for (let n = 0; n < 65; n++) {
    await page.keyboard.press("Tab");
    const active = await page.evaluate(() => ({
      text: document.activeElement?.textContent?.trim() ?? "",
      hidden: !!document.activeElement?.closest('[inert],[aria-hidden="true"]'),
      tag: document.activeElement?.tagName,
      outline: getComputedStyle(document.activeElement!).outlineStyle,
    }));
    expect(active.hidden).toBe(false);
    if (active.tag === "A" || active.tag === "BUTTON")
      expect(active.outline).toBe("solid");
    visited.push(active.text);
    if (active.text.includes("Download résumé")) break;
  }
  expect(visited.some((x) => x.includes("Download résumé"))).toBe(true);
  for (let n = 0; n < 5; n++) await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[inert],[aria-hidden="true"]'),
    ),
  ).toBe(false);
});

for (const width of [375, 1280]) {
  for (const mode of ["native", "reduced", "reading"] as const) {
    test(`D5-5.3.5 ${width}px ${mode}: Axe for final content and presentation`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
      });
      await page.goto("/");
      await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
      if (mode === "reading")
        await page
          .getByRole("button", { name: "Reading mode", exact: true })
          .click();
      const targets =
        mode === "reading"
          ? [0]
          : pages
              .map((_, i) => i)
              .filter((i) => width < 768 || i === 0 || i % 2 === 1);
      const records = [];
      for (const index of targets) {
        if (index > 0)
          await page
            .getByRole("button", { name: "Next page", exact: true })
            .click();
        await expect(page.locator("#book")).toHaveAttribute(
          "data-current-page",
          String(index),
        );
        await expect(page.locator("#book")).toHaveAttribute(
          "data-turning",
          "false",
        );
        if (mode === "reduced")
          for (const face of await page
            .locator(".plain-face[aria-hidden=false]")
            .all())
            await expect(face).toHaveCSS("opacity", "1");
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        records.push({
          index,
          violations: results.violations,
          incomplete: results.incomplete,
        });
      }
      await testInfo.attach(`axe-${width}-${mode}`, {
        body: JSON.stringify(records, null, 2),
        contentType: "application/json",
      });
      expect(records.flatMap((record) => record.violations)).toEqual([]);
    });
  }
}
