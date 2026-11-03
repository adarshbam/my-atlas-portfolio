import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const evidence = JSON.parse(
  await readFile("docs/evidence/legacy-portfolio/reviews.json", "utf8"),
);
const sources = JSON.parse(
  await readFile("docs/evidence/legacy-portfolio/assets.json", "utf8"),
);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const output = "public/images/references";
await mkdir(output, { recursive: true });
await mkdir("docs/review/task5-0", { recursive: true });
const records = [];
for (const review of evidence.records) {
  if (!review.raw_quote.includes(review.excerpt))
    throw new Error(`Unfaithful excerpt: ${review.id}`);
  const original = await readFile(review.portrait_source);
  const expected =
    review.id === "anurag-singh"
      ? sources.anurag
      : sources.archived_portraits.find(
          (asset) => asset.path === review.portrait_source,
        );
  if (sha(original) !== expected.sha256)
    throw new Error(`Source hash mismatch: ${review.id}`);
  for (const width of [96, 192]) {
    const path = `${output}/${review.id}-${width}.webp`;
    // Preserve original square composition and alpha; monochrome treatment is CSS.
    await sharp(original)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 84, effort: 6 })
      .toFile(path);
    const bytes = await readFile(path);
    const metadata = await sharp(bytes).metadata();
    records.push({
      id: review.id,
      source: review.portrait_source,
      sourceSha256: sha(original),
      path,
      bytes: bytes.length,
      sha256: sha(bytes),
      width: metadata.width,
      height: metadata.height,
      hasAlpha: metadata.hasAlpha,
    });
  }
}
await writeFile(
  "docs/review/task5-0/assets.json",
  JSON.stringify(
    {
      records,
      totalBytes: records.reduce((sum, asset) => sum + asset.bytes, 0),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    derivatives: records.length,
    totalBytes: records.reduce((sum, asset) => sum + asset.bytes, 0),
  }),
);
