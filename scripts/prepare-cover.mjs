import sharp from "sharp";
import { mkdir } from "node:fs/promises";
const source = "docs/artwork/charcoal-portrait-source.png";
await mkdir("docs/artwork", { recursive: true });

for (const width of [480, 640, 960]) {
  const result = await sharp(source)
    .resize({ width })
    .webp({ quality: 72 })
    .toFile(`public/images/charcoal-portrait-${width}.webp`);
  console.log(width, result.size);
  if (result.size > 200000) throw Error("Cover art exceeds 200KB");
}
const tile = await sharp(source)
  .extract({ left: 32, top: 32, width: 128, height: 128 })
  .webp({ lossless: true })
  .toFile("public/images/charcoal-grain.webp");
console.log("Texture", tile.size);

if (tile.size > 30000) throw Error("Texture exceeds 30KB");
