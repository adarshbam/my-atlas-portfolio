import { writeFile } from "node:fs/promises";
import sharp from "sharp";

// Static, deterministic stock grain: no live SVG filter during page turns.
const texture = await sharp("public/images/book-fiber.svg")
  .webp({ quality: 80 })
  .toFile("public/images/book-fiber.webp");
if (texture.size > 30000) throw Error("Material texture exceeds 30KB");

const layers = Array.from({ length: 32 }, (_, i) => {
  const y = i + 0.25 + ((i * 7) % 5) / 10;
  return `<path d="M0 ${y.toFixed(2)}Q40 ${(y + 0.3).toFixed(2)} 83 ${y.toFixed(2)}T128 ${(y + 0.15).toFixed(2)}"/>`;
}).join("");
const stock = `<path fill="#e0d7cc" d="M0 0h128v32H0z"/><g fill="none" stroke="#6e685f" stroke-width=".35" opacity=".32">${layers}</g>`;
await writeFile(
  "public/images/page-edges.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="32" viewBox="0 0 128 32">${stock}</svg>\n`,
);
await writeFile(
  "public/images/page-edges-vertical.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="128" viewBox="0 0 32 128"><g transform="translate(32) rotate(90)">${stock}</g></svg>\n`,
);
console.log(`Static grain: ${texture.size} bytes; fine sheet layers prepared.`);
