import sharp from 'sharp';

const input = 'tmp/cover_clean_background.png';
const base = sharp(input);

// 960: 899 x 1024 (full resolution)
await base
  .clone()
  .webp({ quality: 90 })
  .toFile('public/images/cover-hardcover-960.webp');

// 640: scaled proportionally
await base
  .clone()
  .resize(640, Math.round(640 * (1024 / 899)))
  .webp({ quality: 88 })
  .toFile('public/images/cover-hardcover-640.webp');

// 480: scaled proportionally
await base
  .clone()
  .resize(480, Math.round(480 * (1024 / 899)))
  .webp({ quality: 86 })
  .toFile('public/images/cover-hardcover-480.webp');

console.log('Cover hardcover webp assets generated successfully');
