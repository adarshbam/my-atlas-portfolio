import sharp from "sharp";

// Compare identical production-preview framing, without modifying source artwork.
for (const [surface, size, crop] of [
  ["opening", 1920, { left: 312, top: 189, width: 1300, height: 920 }],
  ["cover", 1280, { left: 388, top: 189, width: 500, height: 711 }],
]) {
  const width = surface === "opening" ? 900 : 450;
  const panels = [];
  let height;
  for (const [index, revision] of [
    "monograph-before",
    "monograph-final",
  ].entries()) {
    const panel = await sharp(`docs/review/${revision}-${size}-${surface}.png`)
      .extract(crop)
      .resize({ width })
      .toBuffer({ resolveWithObject: true });
    height = panel.info.height;
    panels.push({ input: panel.data, left: index * width, top: 40 });
  }
  const labels = Buffer.from(
    `<svg width="${width * 2}" height="40" xmlns="http://www.w3.org/2000/svg"><g fill="#161513" font-family="Georgia,serif" font-size="18"><text x="16" y="27">Before</text><text x="${width + 16}" y="27">After</text></g></svg>`,
  );
  await sharp({
    create: {
      width: width * 2,
      height: height + 40,
      channels: 3,
      background: "#c9b8a0",
    },
  })
    .composite([{ input: labels, left: 0, top: 0 }, ...panels])
    .png()
    .toFile(`docs/review/monograph-${surface}-comparison.png`);
}
