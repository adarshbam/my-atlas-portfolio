import { chromium, expect, request } from "@playwright/test";
import { baseURL, json } from "./day07-common.mjs";

const browser = await chromium.launch({ channel: "msedge", headless: true });
let links;
try {
  const page = await browser.newPage();
  await page.goto(baseURL);
  await expect(page.locator("#book")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Reading mode", exact: true }).click();
  links = await page.locator("a").evaluateAll((elements) => [...new Map(elements.filter((el) => !el.closest('[aria-hidden=true],[inert]')).map((el) => [el.href, { href: el.href, text: el.textContent.trim() }])).values()]);
} finally { await browser.close(); }
const client = await request.newContext({ timeout: 12000 });
const results = [];
try {
  for (let index = 0; index < links.length; index += 3) {
    const batch = await Promise.all(links.slice(index,index+3).map(async (link) => {
      if (link.href.startsWith("mailto:")) return { ...link, state: "mailto syntax inspected; no email sent" };
      if (!link.href.startsWith("http")) return { ...link, state: "local anchor" };
      try {
        const response = await client.get(link.href.replace(/#.*$/, ""));
        const status = response.status();
        return { ...link, status, finalURL: response.url(), state: status >= 200 && status < 400 ? "reachable" : status === 401 || status === 403 || status === 429 ? "access/rate-limit unresolved" : "HTTP failure; inspect before classifying link defect" };
      } catch (error) { return { ...link, state: "transport unresolved", error: error.message.split("\n")[0] }; }
    }));
    results.push(...batch); console.log(JSON.stringify(batch));
  }
} finally { await client.dispose(); }
await json("destinations", results);
console.log(JSON.stringify({ total: results.length, unresolved: results.filter((r) => r.state.includes("unresolved") || r.state.includes("failure")).length }));
