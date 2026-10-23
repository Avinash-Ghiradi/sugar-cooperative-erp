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

  // Recursively copy all files and folders
  const copyRecursive = (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  // Create temporary backup of entire dist directory outside repo
  const tempBackupDir = path.join(rootDir, '..', 'temp_dist_deploy_' + Date.now());
  copyRecursive(distDir, tempBackupDir);
  console.log(`Backed up entire dist directory to ${tempBackupDir}`);

  // Checkout gh-pages
  console.log('Checking out gh-pages...');
  execSync('git checkout gh-pages', { cwd: rootDir, stdio: 'inherit' });
  execSync('git pull origin gh-pages', { cwd: rootDir, stdio: 'inherit' });

  // Copy all files from tempBackupDir to rootDir
  copyRecursive(tempBackupDir, rootDir);
  // Also ensure 404.html is a copy of index.html for SPA routing
  fs.copyFileSync(path.join(tempBackupDir, 'index.html'), path.join(rootDir, '404.html'));

  // Clean up temp backup
  fs.rmSync(tempBackupDir, { recursive: true, force: true });

  // Commit and push
  const ts = Date.now();
  execSync('git add -A', { cwd: rootDir, stdio: 'inherit' });
  try {
    execSync(`git commit -m "Deploy full 17,076 shareholders cloud sync fix (${ts})"`, { cwd: rootDir, stdio: 'inherit' });
  } catch (e) {
    console.log('No new changes to commit to gh-pages');
  }
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
