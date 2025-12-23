import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = process.cwd();
const source = path.join(root, 'src', 'assets', 'GreenB_logo-removebg-preview.png');
const outDir = path.join(root, 'public', 'icons');

async function main() {
  if (!fs.existsSync(source)) {
    throw new Error(`Source image not found: ${source}`);
  }
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const targets = [
    { size: 192, file: 'GreenB_logo_192_192.png' },
    { size: 512, file: 'GreenB_logo_512_512.png' },
  ];

  for (const t of targets) {
    const outPath = path.join(outDir, t.file);
    await sharp(source)
      .resize(t.size, t.size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(outPath);
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

