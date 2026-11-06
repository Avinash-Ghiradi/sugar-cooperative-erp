const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'client', 'dist');
const tempBackupDir = path.join(rootDir, '..', `temp_dist_place_fix_${Date.now()}`);

function run(cmd) {
  console.log(`Running: ${cmd}`);
  return execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
}

try {
  // 1. Commit and push main branch
  run('git add -A');
  try {
    run('git commit -m "fix: place filter strictly displays place names only and orbital loading animation everywhere"');
  } catch (e) {
    console.log('Commit note:', e.message);
  }
  run('git push origin main');

  // 2. Backup dist
  console.log(`Backing up entire dist directory to ${tempBackupDir}`);
  fs.cpSync(distDir, tempBackupDir, { recursive: true });

  // 3. Switch to gh-pages
  console.log('Checking out gh-pages...');
  run('git checkout gh-pages');
  run('git pull origin gh-pages');

  // 4. Copy build assets over
  fs.cpSync(tempBackupDir, rootDir, { recursive: true });

  // Ensure .nojekyll exists
  fs.writeFileSync(path.join(rootDir, '.nojekyll'), '', 'utf8');

  // Copy index.html as 404.html for SPA routing
  fs.copyFileSync(path.join(rootDir, 'index.html'), path.join(rootDir, '404.html'));

  // 5. Commit and push to gh-pages
  run('git add -A');
  const timestamp = Date.now();
  run(`git commit -m "Deploy place filter place names only and orbital loading animation (${timestamp})"`);
  run('git push origin gh-pages');

  // 6. Return to main
  run('git checkout main');
  console.log('Successfully deployed to gh-pages and switched back to main branch!');

  // Cleanup temp backup
  if (fs.existsSync(tempBackupDir)) {
    fs.rmSync(tempBackupDir, { recursive: true, force: true });
  }
} catch (err) {
  console.error('Deployment error:', err.message);
  process.exit(1);
}
