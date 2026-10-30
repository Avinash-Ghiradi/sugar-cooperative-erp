const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..');
console.log('Running git commands in:', cwd);

execSync('git add -A', { cwd, stdio: 'inherit' });
try {
  execSync('git commit -m "fix: remove (Cane Grower) text and front page QR, enlarge back QR to 96px for ultra-sensitive scanning"', { cwd, stdio: 'inherit' });
} catch (e) {
  console.log('Commit note:', e.message);
}
execSync('git push origin main', { cwd, stdio: 'inherit' });

console.log('Now building and deploying to gh-pages...');
execSync('node scripts/deploy_gh_pages.cjs', { cwd, stdio: 'inherit' });

console.log('ALL DONE!');
