import sharp from "sharp";

// Resize and encode only; keep the generated pose and framing intact.
for (const width of [480, 640, 960]) {
  const result = await sharp("docs/artwork/editorial-portrait-alpha-source.png")
    .resize({ width })
    .webp({ quality: 74, effort: 6 })
    .toFile(`public/images/editorial-portrait-${width}.webp`);
  console.log(width, result.size);
  if (result.size > 200000) throw Error("Portrait exceeds 200KB");
}

// Rasterize the static stitched SVG once, avoiding live filter work on turns.
const texture = await sharp("public/images/book-fiber.svg")
  .webp({ quality: 85 })
  .toFile("public/images/book-fiber.webp");
console.log("Texture", texture.size);
if (texture.size > 30000) throw Error("Texture exceeds 30KB");
