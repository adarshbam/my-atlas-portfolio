import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<button type="button" class="cover-open" aria-label="Open book"><span aria-hidden="true">01</span></button>');
const btn = page.getByRole("button", { name: "Open book", exact: true });
console.log("Found:", await btn.count());
console.log("Text content:", await btn.innerText());
await browser.close();
