import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const source = "public/favicon.svg";
const sizes = [16, 32];
const images = await Promise.all(
  sizes.map((size) =>
    sharp(source, { density: 288 }).resize(size, size).png().toBuffer(),
  ),
);
await writeFile("public/favicon-32.png", images[1]);
await sharp(source, { density: 288 })
  .resize(180, 180)
  .png()
  .toFile("public/apple-touch-icon.png");

const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const entry = 6 + i * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
});
await writeFile("public/favicon.ico", Buffer.concat([header, ...images]));
console.log(
  "Generated PNG, ICO and Apple touch icons from the existing SVG mark.",
);
