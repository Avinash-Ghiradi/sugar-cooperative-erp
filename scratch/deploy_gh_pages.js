const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoDir = path.resolve(__dirname, '..');
const distDir = path.join(repoDir, 'client', 'dist');
const tempDir = path.join(repoDir, 'temp_gh_pages_deploy');

function run(cmd, cwd = repoDir) {
  console.log(`Running: ${cmd}`);
  return execSync(cmd, { cwd, stdio: 'inherit' });
}

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

try {
  console.log('1. Copying client/dist to temporary directory...');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  copyFolderSync(distDir, tempDir);
  fs.writeFileSync(path.join(tempDir, '.nojekyll'), '');
  fs.copyFileSync(path.join(tempDir, 'index.html'), path.join(tempDir, '404.html'));

  console.log('2. Switching to gh-pages branch...');
  run('git checkout gh-pages');
  run('git pull origin gh-pages --rebase');

  console.log('3. Copying dist files to repository root on gh-pages...');
  copyFolderSync(tempDir, repoDir);

  console.log('4. Staging and committing to gh-pages...');
  run('git add -A');
  try {
    run('git commit -m "Deploy Multi-Holding Shareholder Merge & Multiple Amounts Consolidation"');
  } catch (e) {
    console.log('No new changes to commit to gh-pages.');
  }

  console.log('5. Pushing gh-pages to origin...');
  run('git push origin gh-pages');

  console.log('6. Switching back to main...');
  run('git checkout main');

  console.log('7. Cleaning up temp directory...');
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log('Deployment to gh-pages completed successfully!');
} catch (err) {
  console.error('Error during deployment:', err);
  try {
    run('git checkout main');
  } catch (e) {}
  process.exit(1);
}
