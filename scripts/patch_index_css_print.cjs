const fs = require('fs');
const path = require('path');

const filePath = path.resolve('client/src/index.css');
let code = fs.readFileSync(filePath, 'utf8');

const target1 = "  @page {\r\n    margin: 8mm;\r\n  }";
const target2 = "  @page {\n    margin: 8mm;\n  }";

const replacement = `  .no-print,
  .no-print *,
  header.no-print,
  nav,
  aside,
  button:not(.allow-print),
  input:not(.allow-print),
  select:not(.allow-print) {
    display: none !important;
    visibility: hidden !important;
  }

  @page {
    margin: 8mm;
  }`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement.replace(/\n/g, '\r\n'));
  console.log('Patched index.css (CRLF)');
} else if (code.includes(target2)) {
  code = code.replace(target2, replacement);
  console.log('Patched index.css (LF)');
} else {
  console.error('Target not found in index.css');
  process.exit(1);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated client/src/index.css');
