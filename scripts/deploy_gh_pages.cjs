const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'client', 'dist');

  if (!fs.existsSync(distDir)) {
    console.error('client/dist does not exist! Please run build first.');
    process.exit(1);
  }

  // Backup dist files in memory
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  const assetFiles = fs.readdirSync(path.join(distDir, 'assets'));
  const assetMap = new Map();
  assetFiles.forEach(f => {
    assetMap.set(f, fs.readFileSync(path.join(distDir, 'assets', f)));
  });

  console.log(`Backed up dist files: index.html and ${assetFiles.length} assets.`);

  // Checkout gh-pages
  console.log('Checking out gh-pages...');
  execSync('git checkout gh-pages', { cwd: rootDir, stdio: 'inherit' });
  execSync('git pull origin gh-pages', { cwd: rootDir, stdio: 'inherit' });

  // Write index.html and 404.html
  fs.writeFileSync(path.join(rootDir, 'index.html'), indexHtml, 'utf8');
  fs.writeFileSync(path.join(rootDir, '404.html'), indexHtml, 'utf8');

  // Copy assets
  const targetAssetDir = path.join(rootDir, 'assets');
  if (!fs.existsSync(targetAssetDir)) fs.mkdirSync(targetAssetDir);
  for (const [filename, buffer] of assetMap.entries()) {
    fs.writeFileSync(path.join(targetAssetDir, filename), buffer);
    console.log(`Updated asset: assets/${filename}`);
  }

  // Commit and push
  const ts = Date.now();
  execSync('git add index.html 404.html assets', { cwd: rootDir, stdio: 'inherit' });
  execSync(`git commit -m "Deploy statutory ledger fix and cache-busting (${ts})"`, { cwd: rootDir, stdio: 'inherit' });
  execSync('git push origin gh-pages', { cwd: rootDir, stdio: 'inherit' });

  // Switch back to main
  execSync('git checkout main', { cwd: rootDir, stdio: 'inherit' });
  console.log('Successfully deployed to gh-pages and switched back to main branch!');
} catch (err) {
  console.error('Deployment error:', err.message);
  // Ensure we switch back to main
  try { execSync('git checkout main', { stdio: 'ignore' }); } catch (e) {}
  process.exit(1);
}
