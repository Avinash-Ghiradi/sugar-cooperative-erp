const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..');
console.log('Running git commands in:', cwd);

execSync('git add -A', { cwd, stdio: 'inherit' });
try {
  execSync('git commit -m "feat: provide dedicated Staff ID card printing with CR80 & A4 modes, dual-sided background uploads with cloud DB sync, and resolve camera transition error"', { cwd, stdio: 'inherit' });
} catch (e) {
  console.log('Commit note:', e.message);
}
execSync('git push origin main', { cwd, stdio: 'inherit' });

console.log('Now building and deploying to gh-pages...');
execSync('node scripts/deploy_gh_pages.cjs', { cwd, stdio: 'inherit' });

console.log('ALL DONE!');
