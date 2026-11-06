const fs = require('fs');
const path = require('path');

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if ((line.includes('loading ?') || line.includes('loading &&') || line.includes('isLoading ?') || line.includes('animate-spin') || line.includes('Loading...')) && !line.includes('LoadingAnimation')) {
          console.log(`${path.relative(path.join(__dirname, '../client/src'), fullPath)}:${i + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

scanDir(path.join(__dirname, '../client/src/components'));
