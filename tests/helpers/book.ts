import { expect, type Page } from "@playwright/test";

export async function openContents(page: Page) {
  const trigger = page.getByRole("button", { name: "Contents", exact: true });
  if ((await trigger.getAttribute("aria-expanded")) !== "true")
    await trigger.click();
  await expect(page.locator("#atlas-contents")).toBeVisible();
}

export function chapterButton(page: Page, name: string) {
  return page
    .locator(".chapter-nav button")
    .filter({
      hasText: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`),
    });
}

export async function goToChapter(page: Page, name: string) {
  await openContents(page);
  await chapterButton(page, name).click();
}
