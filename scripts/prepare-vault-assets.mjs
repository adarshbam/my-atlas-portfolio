import sharp from "sharp";
import { mkdir, writeFile, stat, readFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const revisionSource = "docs/evidence/vault/revision";
const output = "public/images/vault";
const captureReport = JSON.parse(await readFile(`${revisionSource}/workflow-and-capture-report.json`, "utf8"));
const captureKeys = {
  "github-workbench": "githubWorkbench", "owner-settings": "ownerSettings",
  "drive-transfer": "driveTransfer", "populated-demo-vault": "populatedDemoVault",
  "billing-comparison": "billingComparison", "user-management": "userManagement",
};
await mkdir(output, { recursive: true });

// 1. Privacy-crop user-management-2026-10-25.jpg in-place (exclude directory cards at y >= 630)
const userMgmtPath = `${revisionSource}/user-management-2026-10-25.jpg`;
const rawUserBytes = await readFile(userMgmtPath);
const rawUserMeta = await sharp(rawUserBytes).metadata();
if (rawUserMeta.height && rawUserMeta.height > 630) {
  const croppedBuffer = await sharp(rawUserBytes)
    .extract({ left: 0, top: 0, width: 1440, height: 630 })
    .jpeg({ quality: 90 })
    .toBuffer();
  await writeFile(userMgmtPath, croppedBuffer);
}

const captures = [
  {
    name: "github-workbench",
    role: "hero-1",
    source: `${revisionSource}/github-workbench-2026-10-25.jpg`,
    widths: [480, 800, 1200],
    privacyEdits:
      "Captured on public repository adarshbam/my-storage; excludes private repository list.",
  },
  {
    name: "owner-settings",
    role: "hero-2",
    source: `${revisionSource}/owner-settings-2026-10-25.jpg`,
    widths: [480, 800, 1200],
    privacyEdits:
      "None required; displays system limits and plan configuration in Permanent Owner Demo account.",
  },
  {
    name: "drive-transfer",
    role: "supplementary-1",
    source: `${revisionSource}/drive-transfer-2026-10-25.jpg`,
    widths: [480, 800, 1200],
    privacyEdits:
      "Captured inside disposable Google Drive folder Portfolio Demo 2026-10-25 with non-sensitive fixtures only.",
  },
  {
    name: "populated-demo-vault",
    role: "supplementary-2",
    source: `${revisionSource}/populated-demo-vault-2026-10-25.jpg`,
    widths: [480, 800, 1200],
    privacyEdits:
      "Captured inside disposable Vault folder Portfolio Demo 2026-10-25 with non-sensitive fixtures only.",
  },
  {
    name: "billing-comparison",
    role: "supplementary-3",
    source: `${revisionSource}/billing-comparison-2026-10-25.jpg`,
    widths: [480, 800, 1200],
    privacyEdits:
      "None required; displays Permanent Demonstration Subscription and plan tier cards.",
  },
  {
    name: "user-management",
    role: "supplementary-4",
    source: `${revisionSource}/user-management-2026-10-25.jpg`,
    widths: [480, 800, 1200],
    cropAppliedToSource: { left: 0, top: 0, width: 1440, height: 630 },
    privacyEdits:
      "Cropped to top 1440x630 region (administration header, 4 system metric cards, demo session banner, and role/state filter bar) to exclude individual user directory cards and personal email addresses.",
  },
];

const entries = [];
for (const capture of captures) {
  const bytes = await readFile(capture.source);
  const metadata = await sharp(bytes).metadata();
  const fullResolution = `${output}/${capture.name}-source.jpg`;
  await copyFile(capture.source, fullResolution);
  const derivatives = [];
  for (const width of capture.widths) {
    const file = `${output}/${capture.name}-${width}.webp`;
    const result = await sharp(bytes)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 86, effort: 6 })
      .toFile(file);
    derivatives.push({
      file,
      width: result.width,
      height: result.height,
      bytes: (await stat(file)).size,
    });
  }
  entries.push({
    name: capture.name,
    role: capture.role,
    source: capture.source,
    fullResolution,
    provenance: {
      url: captureReport.captures[captureKeys[capture.name]].url,
      capturedAt: captureReport.captures[captureKeys[capture.name]].capturedAt,
      viewport: captureReport.captures[captureKeys[capture.name]].viewport,
      method: "Live browser capture; original product colors. User-directory source privacy-cropped.",
      ...(capture.name === "drive-transfer" ? { limitation: "API copy transfers; session clipboard programmatically staged. Not completed production-UI move evidence." } : {}),
    },
    sha256: createHash("sha256").update(bytes).digest("hex").toUpperCase(),
    width: metadata.width,
    height: metadata.height,
    crop: capture.cropAppliedToSource ?? null,
    privacyEdits: capture.privacyEdits,
    derivatives,
  });
}

await writeFile(
  `${revisionSource}/assets.json`,
  JSON.stringify(entries, null, 2) + "\n",
);
await writeFile(
  "docs/evidence/vault/assets.json",
  JSON.stringify(entries, null, 2) + "\n",
);
console.log(JSON.stringify(entries, null, 2));
