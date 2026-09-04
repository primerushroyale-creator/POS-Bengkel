const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const rootDir = path.resolve(__dirname, '..');
  const svgPath = path.join(rootDir, 'logo-gawe-digital-icon.svg');
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(svgPath);

  const icons = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'icon-maskable.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];

  for (const icon of icons) {
    const dest = path.join(publicDir, icon.name);
    await sharp(svgBuffer)
      .resize(icon.size, icon.size)
      .png()
      .toFile(dest);
    console.log(`Generated: ${icon.name} (${icon.size}x${icon.size}) -> ${dest}`);
  }

  // Also copy svg to public if needed
  fs.copyFileSync(svgPath, path.join(publicDir, 'logo-icon.svg'));
  console.log('All icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
