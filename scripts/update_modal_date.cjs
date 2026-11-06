const fs = require('fs');

const path = 'client/src/components/Common/RegisterListPrintModal.jsx';
let content = fs.readFileSync(path, 'utf8');

const target = `// Date formatter
function formatDocDate(dateStr) {
  if (!dateStr) {
    const d = new Date();
    return \`\${String(d.getDate()).padStart(2, '0')}/\${String(d.getMonth() + 1).padStart(2, '0')}/\${d.getFullYear()}\`;
  }
  const clean = String(dateStr).trim();
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return \`\${parts[2].padStart(2, '0')}/\${parts[1].padStart(2, '0')}/\${parts[0]}\`;
    }
    return \`\${parts[0].padStart(2, '0')}/\${parts[1].padStart(2, '0')}/\${parts[2]}\`;
  }
  return clean;
}`;

const repl = `// Date formatter (supports standard dates and Excel serial numbers)
function formatDocDate(dateStr) {
  if (!dateStr || dateStr === '—' || dateStr === '-') return '—';
  const clean = String(dateStr).trim();
  const num = Number(clean);
  if (!isNaN(num) && num > 1000 && num < 70000) {
    const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      const d = String(jsDate.getDate()).padStart(2, '0');
      const m = String(jsDate.getMonth() + 1).padStart(2, '0');
      const y = jsDate.getFullYear();
      return \`\${d}/\${m}/\${y}\`;
    }
  }
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return \`\${parts[2].padStart(2, '0')}/\${parts[1].padStart(2, '0')}/\${parts[0]}\`;
    }
    return \`\${parts[0].padStart(2, '0')}/\${parts[1].padStart(2, '0')}/\${parts[2]}\`;
  }
  return clean;
}`;

const contentLf = content.replace(/\r\n/g, '\n');
const targetLf = target.replace(/\r\n/g, '\n');
const replLf = repl.replace(/\r\n/g, '\n');

if (contentLf.includes(targetLf)) {
  const updatedLf = contentLf.replace(targetLf, replLf);
  const finalContent = content.includes('\r\n') ? updatedLf.replace(/\n/g, '\r\n') : updatedLf;
  fs.writeFileSync(path, finalContent, 'utf8');
  console.log('Successfully updated formatDocDate in RegisterListPrintModal.jsx!');
} else {
  console.log('Target not found in RegisterListPrintModal.jsx');
}
