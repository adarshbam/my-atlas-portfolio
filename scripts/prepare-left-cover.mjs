import sharp from "sharp";

// Mechanical resizing/encoding only: retain the generated alpha and full canvas.
for (const width of [480, 640, 960]) {
  const result = await sharp("docs/artwork/charcoal-left-source.png")
    .resize({ width })
    .webp({ quality: 68, alphaQuality: 60, effort: 6 })
    .toFile(`public/images/charcoal-left-${width}.webp`);
  console.log(width, result.size);
  if (result.size > 200000) throw Error("Cover art exceeds 200KB");
}
