const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..');
console.log('Running git commands in:', cwd);

execSync('git add -A', { cwd, stdio: 'inherit' });
execSync('git commit -m "feat(vargavane): add official statutory header box to all 14 print pages"', { cwd, stdio: 'inherit' });
execSync('git push origin main', { cwd, stdio: 'inherit' });

console.log('Now building and deploying to gh-pages...');
execSync('node scripts/deploy_gh_pages.cjs', { cwd, stdio: 'inherit' });

console.log('ALL DONE!');
