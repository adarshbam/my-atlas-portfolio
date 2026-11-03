import sharp from "sharp";
import { mkdir, copyFile, readdir } from "node:fs/promises";
import { join } from "node:path";

await mkdir("public/images", { recursive: true });
await mkdir("public/fonts", { recursive: true });
for (const width of [480, 960]) {
  const result = await sharp(
    "C:/Users/Dell/Downloads/My Profressional Photo.png",
  )
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(`public/images/adarsh-${width}.webp`);
  if (result.size > 200_000) throw new Error("Portrait exceeds 200 KB");
  console.log(`Portrait ${width}: ${result.size} bytes`);
}
for (const [family, weights] of [
  ["cormorant-garamond", [300, 500]],
  ["eb-garamond", [400]],
]) {
  for (const weight of weights) {
    const file = `${family}-latin-${weight}-normal.woff2`;
    await copyFile(
      join("node_modules", "@fontsource", family, "files", file),
      join("public", "fonts", file),
    );
  }
}
const resume = (await readdir("C:/Users/Dell/Downloads")).find(
  (x) => x.startsWith("Adarsh Singh") && x.endsWith("Resume.pdf"),
);
if (resume)
  await copyFile(
    join("C:/Users/Dell/Downloads", resume),
    "public/adarsh-singh-resume.pdf",
  );
