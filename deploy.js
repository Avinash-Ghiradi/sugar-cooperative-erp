const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'client', 'dist');
const tempDir = path.join(os.tmpdir(), 'sugar_erp_dist_' + Date.now());

function run(cmd) {
  console.log('> ' + cmd);
  return execSync(cmd, { cwd: rootDir, stdio: 'inherit' });
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  console.log('Copying build assets to temporary folder...');
  copyRecursiveSync(distDir, tempDir);

  console.log('Switching to gh-pages branch...');
  run('git checkout gh-pages');

  console.log('Copying build assets into gh-pages root...');
  copyRecursiveSync(tempDir, rootDir);

  const nojekyllPath = path.join(rootDir, '.nojekyll');
  if (!fs.existsSync(nojekyllPath)) {
    fs.writeFileSync(nojekyllPath, '');
  }

  run('git add .');
  try {
    run('git commit -m "deploy: prioritize exact share number match first"');
  } catch (e) {
    console.log('Nothing to commit or commit returned:', e.message);
  }

  run('git push origin gh-pages');
  console.log('Successfully pushed to gh-pages!');
} finally {
  console.log('Switching back to main branch...');
  run('git checkout main');
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}
}
