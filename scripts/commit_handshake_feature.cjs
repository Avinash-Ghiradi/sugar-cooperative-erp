const { execSync } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..');
console.log('Running git commands in:', cwd);

execSync('git add -A', { cwd, stdio: 'inherit' });
execSync('git commit -m "feat(branding): add cooperative handshake logo upload with multi-browser cloud sync"', { cwd, stdio: 'inherit' });
execSync('git push origin main', { cwd, stdio: 'inherit' });

console.log('Now building client for deployment...');
execSync('npm run build', { cwd: path.join(cwd, 'client'), stdio: 'inherit' });

console.log('Deploying to gh-pages...');
execSync('node scripts/deploy_gh_pages.cjs', { cwd, stdio: 'inherit' });

console.log('ALL DONE! Successfully committed and deployed to main & gh-pages.');
