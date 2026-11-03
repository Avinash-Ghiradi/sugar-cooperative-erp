const fs = require('fs');

const files = fs.readdirSync('scripts').filter(f => f.endsWith('.png'));
files.forEach(f => {
  const buf = fs.readFileSync('scripts/' + f);
  if (buf.length > 24) {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    console.log(f + ' : ' + w + 'x' + h + ' (' + buf.length + ' bytes)');
  }
});
