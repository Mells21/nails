import { readdirSync, unlinkSync } from 'fs';
import { extname, join } from 'path';
import sharp from 'sharp';

const DIR = join(process.cwd(), 'public', 'images');

const files = readdirSync(DIR).filter((f) => ['.jpg', '.jpeg', '.png'].includes(extname(f).toLowerCase()));

for (const file of files) {
  const inputPath = join(DIR, file);
  const outputPath = join(DIR, file.replace(extname(file), '.webp'));
  await sharp(inputPath).webp({ quality: 82 }).toFile(outputPath);
  unlinkSync(inputPath);
  console.log(`${file} -> ${file.replace(extname(file), '.webp')}`);
}

console.log(`\nListo: ${files.length} imagenes convertidas a WebP.`);
