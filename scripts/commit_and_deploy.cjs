const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..');
console.log('Running git commands in:', cwd);

execSync('git add -A', { cwd, stdio: 'inherit' });
try {
  execSync('git commit -m "feat: complete Employee entry with photo upload, webcam snapshot, official Staff ID Card with Attendance QR, and live attendance integration"', { cwd, stdio: 'inherit' });
} catch (e) {
  console.log('Commit note:', e.message);
}
execSync('git push origin main', { cwd, stdio: 'inherit' });

console.log('Now building and deploying to gh-pages...');
execSync('node scripts/deploy_gh_pages.cjs', { cwd, stdio: 'inherit' });

console.log('ALL DONE!');
