import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5173",
    channel: "msedge",
    headless: true,
    reducedMotion: "no-preference",
    viewport: { width: 1280, height: 1400 },
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
