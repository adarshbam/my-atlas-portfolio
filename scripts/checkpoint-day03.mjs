import { readFile, writeFile } from "node:fs/promises";

// Documentation helper. Exercise completion still requires evidence supplied by the caller.
const [ids, summary, next, operation = "None running."] = process.argv.slice(2);
if (!ids || !summary || !next)
  throw new Error(
    "Provide comma-separated completed IDs, evidence summary and next action.",
  );
let plan = await readFile("docs/DAY-03.md", "utf8");
for (const id of ids.split(",")) {
  if (!/^3\.[1-4]\.[1-6]$/.test(id)) throw new Error(`Invalid exercise: ${id}`);
  const pattern = new RegExp(
    `(\\| ${id.replaceAll(".", "\\.")} \\|[^\\n]*\\| )[^|\\n]*(\\|)`,
    "g",
  );
  if (!pattern.test(plan)) throw new Error(`Exercise not found: ${id}`);
  plan = plan.replace(
    pattern,
    "$1Complete — see current checkpoint and DAY-03-REVIEW.md $2",
  );
}
const rows = [
  ...plan.matchAll(/^\| (3\.\d\.\d) \| (\d+) \|[^\n]*\| ([^|]+)\|$/gm),
];
const complete = rows.filter((row) => row[3].trim().startsWith("Complete"));
const remaining =
  180 - complete.reduce((total, row) => total + Number(row[2]), 0);
const count = `${complete.length}/24`;
plan = plan.replace(
  /Status: \*\*\d+\/24 exercises complete\*\*\.[^\n]*/,
  `Status: **${count} exercises complete**. Continuous assistant-led Day 3 execution authorized on 25 October. Preserve the accepted book/native engine, 180-minute budget and no deployment. See \`../HANDOFF.md\` and \`DAY-03-REVIEW.md\` for evidence and limits.`,
);
plan = plan.replace(
  /## Current (?:next exercise|checkpoint)[^]*$/,
  `## Current checkpoint\n\n25 October 2026: **${count}** complete; **${remaining} planned minutes remain**. ${summary}\n\nNext bounded action: ${next}\n\nOperation: ${operation}\n`,
);
await writeFile("docs/DAY-03.md", plan);
let handoff = await readFile("HANDOFF.md", "utf8");
handoff = handoff.replace(
  /Updated:[^\n]*/,
  `Updated: 25 October 2026, Asia/Calcutta. Current phase: **Day 3 — Vault Storage flagship**. Checklist **${count}**; **${remaining} planned minutes remain**. Continuous assistant-led execution authorized. No deployment.`,
);
handoff = handoff.replace(
  /## Next bounded action[^]*?(?=Local Vault source exists)/,
  `## Next bounded action\n\n${summary}\n\nNext: ${next}\n\nOperation: ${operation}\n\nEvidence and commands: \`docs/DAY-03-REVIEW.md\`, \`docs/VAULT-EVIDENCE.md\`; active checklist \`docs/DAY-03.md\`. Accepted opening/materials/native engine retained. User controls any manual switch to Gemini Argan 2; no automatic switch, messaging, new chat or deployment. No extra session/time authorized.\n\n`,
);
handoff = handoff.replace(
  "The saved roadmap defaults to user implementation of meaningful production work on later days, with the assistant supplying preparation, templates and verification one exercise at a time. Day 2 alone was explicitly assistant-led. Do not assume that exception extends to Day 3; provide full implementation when the user requests it.",
  "The user explicitly amended Day 3 to continuous assistant-led completion of all 24 exercises on 25 October. Continue without per-exercise confirmation. Other days retain their saved workflow unless amended.",
);
await writeFile("HANDOFF.md", handoff);
let status = await readFile("PROJECT-STATUS.md", "utf8");
status = status.replace(
  /## Current checkpoint[^]*?(?=## Historical implementation)/,
  `## Current checkpoint — Day 3\n\n- Day 02 closed at **24/24**; current design accepted as good enough. Preserve the opening/materials/native StPageFlip engine.\n- **Day 03: ${count}**; **${remaining} planned minutes remain** inside the original three-hour allocation. User authorized continuous assistant-led completion on 25 October. October 30 stays off; no deployment or automatic model switch.\n- ${summary}\n- Next: ${next}\n- Operation: ${operation}\n- Evidence: \`docs/DAY-03-REVIEW.md\`, \`docs/VAULT-EVIDENCE.md\`, active \`docs/DAY-03.md\`, cross-model entry \`HANDOFF.md\`. No credentials/private customer data in handoff.\n- Earlier release limits remain unless superseded by a fresh measured result: mobile LCP 2.92s, field INP unmeasured, physical-device/Safari/Firefox/human motion review not established. Prior 67-check evidence is historical; inconsistent last-run cache was not treated as green.\n\n`,
);
status = status.replace("Earlier release limits remain unless superseded by a fresh measured result: mobile LCP 2.92s, field INP unmeasured, physical-device/Safari/Firefox/human motion review not established. Prior 67-check evidence is historical; inconsistent last-run cache was not treated as green.", "Current measurements and release follow-ups are in docs/DAY-03-REVIEW.md. Field INP, physical-device/Safari/Firefox and human review remain separate from automated checks. Historical test caches are not proof of a new run; final JSON and split-run evidence are recorded in the review.");
await writeFile("PROJECT-STATUS.md", status);
let readme = await readFile("README.md", "utf8");
readme = readme.replace(/^Current phase:[^\n]*/m, `Current phase: **Day 3 — Vault Storage**, **${count}** exercises complete. Four Vault pages form two spreads inside the seven-surface book; accepted opening/materials/native engine retained. Day 02 closed at 24/24. Current verification, limits and next action: [HANDOFF.md](HANDOFF.md) and [Day 3 review](docs/DAY-03-REVIEW.md). No deployment.`);
await writeFile("README.md", readme);
let roadmap = await readFile("PORTFOLIO-ROADMAP.md", "utf8");
roadmap = roadmap.replace(/^Current phase update —[^\n]*/m, `Current phase update — **25 October 2026**: Day 02 is closed at **24/24** and its book design accepted as good enough. Day 03 is **${count}**: four factual Vault pages form two spreads in a seven-surface registry; preserve the native engine. The user authorized continuous assistant-led Day 3 execution. Current evidence and limits: \`docs/DAY-03-REVIEW.md\`; active checklist: \`docs/DAY-03.md\`; continuation: \`HANDOFF.md\`. Original 180-minute allocations, 21-hour total, later dates and October 30 off remain. No deployment or automatic model switch. Earlier dated paragraphs below are historical.`);
await writeFile("PORTFOLIO-ROADMAP.md", roadmap);
console.log(
  `${count} complete; ${remaining} planned minutes remain. ${operation}`,
);
