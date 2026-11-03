import { chromium, expect } from "@playwright/test";
import { baseURL, output, json } from "./day06-common.mjs";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const records = [];
try {
  for (const width of [375,1280]) {
    const context = await browser.newContext({viewport:{width,height:900}});
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__day06Events = [];
      if (PerformanceObserver.supportedEntryTypes.includes("event")) new PerformanceObserver((list) => {
        window.__day06Events.push(...list.getEntries().filter((entry) => entry.interactionId).map((entry) => ({name:entry.name,duration:entry.duration,inputDelay:entry.processingStart-entry.startTime,interactionId:entry.interactionId})));
      }).observe({type:"event",buffered:true,durationThreshold:16});
    });
    const start = performance.now();
    await page.goto(baseURL);
    await expect(page.locator("#book")).toHaveAttribute("data-ready","true");
    await expect(page.locator(".library-slot .cover-role")).toHaveText("Software engineer");
    await expect(page.locator(".library-slot .cover-role")).toBeVisible();
    const roleAt = performance.now()-start;
    const chapters = page.getByRole("navigation",{name:"Portfolio chapters"});
    await chapters.getByRole("button",{name:"Vault Storage",exact:true}).click();
    await expect(page.locator("#book")).toHaveAttribute("data-turning","false");
    await expect(page.locator('.library-slot [data-page-id="vault"]')).toBeVisible();
    const vaultAt = performance.now()-start;
    await chapters.getByRole("button",{name:"Contact",exact:true}).click();
    await expect(page.locator("#book")).toHaveAttribute("data-turning","false");
    const closing = page.locator('.library-slot [data-page-id="colophon"]');
    const resume = closing.getByRole("link",{name:"Download résumé (PDF)"});
    await resume.scrollIntoViewIfNeeded();
    await expect(resume).toBeVisible();
    await expect(closing.locator('a[href^="mailto:"]')).toBeVisible();
    const contactAt = performance.now()-start;
    expect(contactAt).toBeLessThan(30000);
    await page.screenshot({path:`${output}/recruiter-${width}.jpg`,fullPage:true});
    records.push({width,roleAtMs:roleAt,vaultAtMs:vaultAt,contactAtMs:contactAt,eventEntries:await page.evaluate(()=>window.__day06Events),
      interpretation:"Scripted assistant walkthrough with known destinations, not a human/recruiter usability study. EventTiming samples are lab observations of this short sequence, not field INP."});
    await context.close();
  }
} finally { await browser.close(); }
await json("recruiter-walkthrough",{browser:browser.version(),records});
console.log(JSON.stringify(records,null,2));
