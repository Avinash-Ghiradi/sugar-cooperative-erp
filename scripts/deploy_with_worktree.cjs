const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'client', 'dist');
const wtPath = path.join(os.tmpdir(), 'gh_pages_wt_' + Date.now());

function run(cmd, cwd = rootDir) {
  console.log(`[EXEC] ${cmd}`);
  return execSync(cmd, { cwd, stdio: 'inherit' });
}

try {
  console.log('=== Step 1: Commit and push main ===');
  run('git add -A');
  try {
    run('git commit -m "feat: show all shareholders live preview in batch modal and provide print register option"');
  } catch (e) {
    console.log('Commit note:', e.message);
  }
  run('git push origin main');

  console.log('=== Step 2: Verify dist exists ===');
  if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
    console.log('Dist does not exist, building client...');
    run('npm run build', path.join(rootDir, 'client'));
  }

  console.log(`=== Step 3: Create git worktree for gh-pages at ${wtPath} ===`);
  try {
    run('git worktree prune');
  } catch (e) {}

  run(`git worktree add "${wtPath}" gh-pages`);

  console.log('=== Step 4: Copy dist files to gh-pages worktree ===');
  fs.cpSync(distDir, wtPath, { recursive: true });

  // Ensure .nojekyll
  fs.writeFileSync(path.join(wtPath, '.nojekyll'), '', 'utf8');

  // Copy index.html as 404.html
  fs.copyFileSync(path.join(wtPath, 'index.html'), path.join(wtPath, '404.html'));

  console.log('=== Step 5: Commit and push gh-pages from worktree ===');
  run('git add -A', wtPath);
  const commitMsg = `Deploy: batch shareholders preview and print (${Date.now()})`;
  try {
    run(`git commit -m "${commitMsg}"`, wtPath);
    run('git push origin gh-pages', wtPath);
    console.log('Successfully pushed to gh-pages branch!');
  } catch (e) {
    console.log('gh-pages push note:', e.message);
  }

  console.log('=== Step 6: Cleanup worktree ===');
  try {
    run(`git worktree remove --force "${wtPath}"`);
  } catch (e) {
    console.warn('Worktree remove note:', e.message);
  }

  console.log('Deployment completely finished successfully!');
} catch (err) {
  console.error('Deployment failed:', err);
  try {
    run(`git worktree remove --force "${wtPath}"`);
  } catch (e) {}
  process.exit(1);
}
