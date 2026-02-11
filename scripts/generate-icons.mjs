import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [192, 512];
const outputDir = join(__dirname, '../packages/shell/public/icons');

// SVG icon content — MyCircle logo (circle + center dot + radiating lines)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#1e40af"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="108" fill="url(#bgGradient)"/>
  <!-- Outer circle -->
  <circle cx="256" cy="256" r="138" fill="none" stroke="white" stroke-width="14"/>
  <!-- Inner dot -->
  <circle cx="256" cy="256" r="44" fill="white"/>
  <!-- Radiating lines -->
  <g stroke="white" stroke-width="12" stroke-linecap="round">
    <line x1="256" y1="64" x2="256" y2="106"/>
    <line x1="256" y1="406" x2="256" y2="448"/>
    <line x1="64" y1="256" x2="106" y2="256"/>
    <line x1="406" y1="256" x2="448" y2="256"/>
    <line x1="120" y1="120" x2="151" y2="151"/>
    <line x1="361" y1="361" x2="392" y2="392"/>
    <line x1="120" y1="392" x2="151" y2="361"/>
    <line x1="361" y1="151" x2="392" y2="120"/>
  </g>
</svg>`;

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  for (const size of sizes) {
    const outputPath = join(outputDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(outputPath);

    console.log(`Generated: ${outputPath}`);
  }

  // Also create a favicon.ico (32x32)
  const faviconPath = join(__dirname, '../packages/shell/public/favicon.ico');
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(faviconPath.replace('.ico', '.png'));

  console.log('PWA icons generated successfully!');
}

generateIcons().catch(console.error);
