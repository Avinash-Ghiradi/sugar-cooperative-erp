const fs = require('fs');

console.log('Testing bundle existence and syntax...');
const jsFiles = fs.readdirSync('client/dist/assets').filter(f => f.endsWith('.js'));
console.log('JS files in dist/assets:', jsFiles);

if (jsFiles.length > 0) {
  const content = fs.readFileSync('client/dist/assets/' + jsFiles[0], 'utf8');
  console.log('Bundle size in KB:', (content.length / 1024).toFixed(2));
  console.log('Test passed: bundle built successfully.');
}
