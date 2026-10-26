import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";

test("release metadata describes the actual portfolio without an invented public origin", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Adarsh Singh — Engineering Atlas");
  const description = await page
    .locator('meta[name="description"]')
    .getAttribute("content");
  expect(description?.length).toBeGreaterThan(40);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    await page.title(),
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    description!,
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
    "content",
    "website",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary",
  );
  const originFields = await page
    .locator(
      'link[rel="canonical"],meta[property="og:url"],meta[property="og:image"]',
    )
    .evaluateAll((elements) =>
      elements.map(
        (el) => el.getAttribute("href") ?? el.getAttribute("content"),
      ),
    );
  for (const value of originFields) {
    expect(value).toMatch(/^https:\/\//);
    expect(value).not.toMatch(
      /localhost|127\.0\.0\.1|example\.(com|org)|yourdomain/,
    );
  }
});

test("declared local assets deliver the expected body and MIME rather than an HTML fallback", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Reading mode", exact: true }).click();
  const paths = await page.evaluate(() => [
    ...new Set(
      [
        ...[...document.querySelectorAll<HTMLLinkElement>("link[href]")].map(
          (el) => el.getAttribute("href")!,
        ),
        ...[
          ...document.querySelectorAll<HTMLImageElement>(
            ".reading-document img",
          ),
        ].flatMap((el) => [
          el.getAttribute("src")!,
          ...el.srcset.split(",").map((item) => item.trim().split(/\s+/)[0]),
        ]),
        ...[
          ...document.querySelectorAll<HTMLAnchorElement>(
            ".reading-document a",
          ),
        ].map((el) => el.getAttribute("href")!),
      ].filter((value) => value?.startsWith("/") && !value.startsWith("//")),
    ),
  ]);
  const records = [];
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const type = response.headers()["content-type"] ?? "";
    const body = await response.body();
    expect(body.length, path).toBeGreaterThan(0);
    expect(type, path).not.toContain("text/html");
    if (/\.webp$/.test(path)) {
      expect(type).toContain("image/webp");
      expect(body.subarray(8, 12).toString()).toBe("WEBP");
    } else if (/\.jpe?g$/.test(path)) {
      expect(type).toContain("image/jpeg");
      expect(body.subarray(0, 2).toString("hex")).toBe("ffd8");
    } else if (/\.png$/.test(path)) {
      expect(type).toContain("image/png");
      expect(body.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    } else if (/\.woff2$/.test(path)) {
      expect(type).toContain("font/woff2");
      expect(body.subarray(0, 4).toString()).toBe("wOF2");
    } else if (/\.svg$/.test(path)) {
      expect(type).toContain("image/svg+xml");
      expect(body.toString()).toContain("<svg");
    } else if (/\.pdf$/.test(path)) {
      expect(type).toContain("application/pdf");
      expect(body.subarray(0, 5).toString()).toBe("%PDF-");
      expect(createHash("sha256").update(body).digest("hex")).toBe(
        "07cfd35fd117b2eb3fb26bf4d0956cebb2dd53d16a3e0dc62482f6f998c17daa",
      );
    }
    records.push({ path, bytes: body.length, contentType: type });
  }
  expect(records.some((r) => r.path.endsWith(".pdf"))).toBe(true);
  await testInfo.attach("local-delivery", {
    body: JSON.stringify(records, null, 2),
    contentType: "application/json",
  });
});
