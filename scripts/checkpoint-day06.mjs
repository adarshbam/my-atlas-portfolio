import { readFile, writeFile, mkdir } from "node:fs/promises";
await mkdir("docs/review/day06", { recursive: true });
const progress = JSON.parse(
  await readFile("docs/review/day06/progress.json", "utf8"),
);
if (process.argv.length > 2) {
  const additions = (process.argv[2] ?? "").split(",").filter(Boolean);
  if (additions.some((id) => !/^6\.[1-4]\.[1-6]$/.test(id)))
    throw new Error("Invalid exercise ID");
  progress.completed = [
    ...new Set([...progress.completed, ...additions]),
  ].sort();
  if (process.argv[3]) progress.operation = process.argv[3];
  if (process.argv[4]) progress.summary = process.argv[4];
  if (process.argv[5]) progress.next = process.argv[5];
  await writeFile(
    "docs/review/day06/progress.json",
    JSON.stringify(progress, null, 2),
  );
}
const now = new Date().toLocaleString("en-GB", {
  timeZone: "Asia/Kolkata",
  hour12: false,
});
const text = `## Day 6 continuous execution — ${now} IST\n\nUser authorized all Day 6 tasks back to back automatically, with review after technical work and immediately before the final Day 7 handoff. This supersedes the one-exercise default and moves human candidate review to the final boundary. Existing 180-minute allocation, accepted design/native engine, factual evidence limits and no-deployment boundary retained.\n\n**${progress.completed.length}/24 exercises complete.** ${progress.summary}\n\nCurrent operation: ${progress.operation}\n\nNext: ${progress.next}\n\nStarted 26 October 2026 at 08:24 IST; allowance ends by 11:24 IST, excluding no unapproved extra time. Evidence: docs/DAY-06-REVIEW.md and docs/review/day06/. ${progress.limits}\n\n---\n\n`;
for (const path of ["HANDOFF.md", "PROJECT-STATUS.md"]) {
  let old = await readFile(path, "utf8");
  if (old.startsWith("## Day 6 continuous execution"))
    old = old.slice(old.indexOf("\n---\n\n") + "\n---\n\n".length);
  old = old.replace(/^ Day 5 accepted/, "## Day 5 accepted");
  await writeFile(path, text + old);
}
let plan = await readFile("docs/DAY-06.md", "utf8");
if (plan.startsWith("## Day 6 execution checkpoint"))
  plan = plan.slice(plan.indexOf("\n---\n\n") + "\n---\n\n".length);
plan = plan.replace(/^ Day 5 accepted/, "## Day 5 accepted");
plan = plan.replace(
  /^(### (6\.[1-4]\.\d) — .* · \d+ minutes · )(Pending|Complete|Review pending)$/gm,
  (_, prefix, id) =>
    prefix +
    (progress.completed.includes(id)
      ? "Complete"
      : id === "6.4.3" && progress.reviewPending
        ? "Review pending"
        : "Pending"),
);
await writeFile(
  "docs/DAY-06.md",
  `## Day 6 execution checkpoint\n\n${now} IST · ${progress.completed.length}/24. ${progress.summary} Current operation: ${progress.operation} Next: ${progress.next} User review is reserved for the final boundary; earlier planning-only and Day 5 pending statements below are historical.\n\n---\n\n` +
    plan,
);
