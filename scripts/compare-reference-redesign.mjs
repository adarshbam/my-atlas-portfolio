import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";

// Derivative QA images only: the source reference is read without modification.
// First run review-reference-redesign.mjs with the same ATLAS_REVIEW_NAME.
const revision = process.env.ATLAS_REVIEW_NAME ?? "reference-redesign";
const output = `docs/review/${revision}`;
const { results } = JSON.parse(
  await readFile(`tmp/${revision}/geometry.json`, "utf8"),
);
await mkdir(output, { recursive: true });
const reference = "docs/artwork/editorial-spread-reference.png";
const referenceMetadata = await sharp(reference).metadata();
const referenceCrop = {
  left: Math.round(referenceMetadata.width * 0.016),
  top: Math.round(referenceMetadata.height * 0.01),
  width: Math.round(referenceMetadata.width * 0.974),
  height: Math.round(referenceMetadata.height * 0.964),
};
const referenceBook = await sharp(reference).extract(referenceCrop).toBuffer();
const opening = results.find(
  (entry) =>
    entry.width === 1920 &&
    entry.mode === "native" &&
    entry.state === "opening",
);
const cover = results.find(
  (entry) =>
    entry.width === 1280 &&
    entry.height === 900 &&
    entry.mode === "native" &&
    entry.state === "cover",
);
if (!opening || !cover)
  throw new Error("Missing native desktop opening/cover review captures.");

async function cropRecord(record, box, padding = 0) {
  const file = `${output}/${record.filename}`;
  const metadata = await sharp(file).metadata();
  const left = Math.max(0, Math.floor(box.x - padding));
  const top = Math.max(0, Math.floor(box.y - padding));
  const right = Math.min(
    metadata.width,
    Math.ceil(box.x + box.width + padding),
  );
  const bottom = Math.min(
    metadata.height,
    Math.ceil(box.y + box.height + padding),
  );
  return sharp(file)
    .extract({ left, top, width: right - left, height: bottom - top })
    .toBuffer();
}

async function sideBySide(filename, leftImage, rightImage, labels, panelWidth) {
  const panels = await Promise.all(
    [leftImage, rightImage].map((input) =>
      sharp(input)
        .resize({ width: panelWidth })
        .toBuffer({ resolveWithObject: true }),
    ),
  );
  const labelHeight = 40;
  const label = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${panelWidth * 2}" height="${labelHeight}"><g fill="#161513" font-family="Georgia,serif" font-size="16"><text x="16" y="27">${labels[0]}</text><text x="${panelWidth + 16}" y="27">${labels[1]}</text></g></svg>`,
  );
  await sharp({
    create: {
      width: panelWidth * 2,
      height:
        Math.max(...panels.map((panel) => panel.info.height)) + labelHeight,
      channels: 3,
      background: "#c9b8a0",
    },
  })
    .composite([
      { input: label, left: 0, top: 0 },
      ...panels.map((panel, index) => ({
        input: panel.data,
        left: index * panelWidth,
        top: labelHeight,
      })),
    ])
    .png()
    .toFile(`${output}/${filename}`);
}

await sideBySide(
  "reference-opening-comparison.png",
  referenceBook,
  await cropRecord(opening, opening.metrics.binding ?? opening.metrics.book, 8),
  ["Reference · matched book width", "Implementation · matched book width"],
  1000,
);

// There is no closed-cover reference image. Compare its dark stock with the
// reference's dark page and label the distinction explicitly.
const referenceDark = await sharp(reference)
  .extract({
    left: Math.round(referenceMetadata.width * 0.046),
    top: Math.round(referenceMetadata.height * 0.032),
    width: Math.round(referenceMetadata.width * 0.454),
    height: Math.round(referenceMetadata.height * 0.92),
  })
  .toBuffer();
await sideBySide(
  "reference-cover-material-comparison.png",
  referenceDark,
  await cropRecord(cover, cover.metrics.faces[0].box, 12),
  ["Reference dark interior page", "Implementation closed cover"],
  550,
);

const face = opening.metrics.faces.find(
  (entry) => entry.id === "introduction",
).box;
for (const [name, box] of [
  [
    "grain",
    {
      x: face.x + face.width * 0.12,
      y: face.y + face.height * 0.12,
      width: face.width * 0.22,
      height: face.height * 0.13,
    },
  ],
  [
    "binding",
    {
      x: face.x + face.width * 0.94,
      y: face.y + face.height * 0.3,
      width: face.width * 0.12,
      height: face.height * 0.45,
    },
  ],
  [
    "page-edges",
    {
      x: face.x,
      y: face.y + face.height * 0.97,
      width: face.width * 2,
      height: face.height * 0.06,
    },
  ],
]) {
  const crop = await cropRecord(opening, box);
  await sharp(crop)
    .resize({ width: name === "page-edges" ? 1400 : 600, kernel: "nearest" })
    .png()
    .toFile(`${output}/material-${name}-closeup.png`);
}
console.log(`Wrote reference comparisons and material close-ups to ${output}.`);
