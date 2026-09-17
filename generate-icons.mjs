import fs from 'fs';
import path from 'path';

// Utilise sharp s'il est présent ou génère un PNG valide avec un canvas ou un SVG converti
async function run() {
  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Vérifie si sharp est installé
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (e) {
    console.log("Installation de sharp pour générer les icônes PNG haute qualité...");
    const { execSync } = await import('child_process');
    execSync('npm install sharp --save-dev', { stdio: 'inherit' });
    sharp = (await import('sharp')).default;
  }

  const svgPath = path.join(iconsDir, 'icon.svg');
  if (!fs.existsSync(svgPath)) {
    console.error("icon.svg introuvable dans public/icons !");
    return;
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // 1. icon-192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log("✅ public/icons/icon-192.png généré !");

  // 2. icon-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log("✅ public/icons/icon-512.png généré !");

  // 3. maskable-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'maskable-512.png'));
  console.log("✅ public/icons/maskable-512.png généré !");
}

run().catch(console.error);