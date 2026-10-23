const fs = require('fs');
const path = require('path');

// 1. VarasaTransferModal.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Varasa/VarasaTransferModal.jsx');
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/villages\.slice\(0,\s*50\)/g, 'villages');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] VarasaTransferModal.jsx datalists now include all villages');
}

// 2. VargavaneTransferModal.jsx
{
  const filePath = path.resolve(__dirname, '../client/src/components/Vargavane/VargavaneTransferModal.jsx');
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/villages\.slice\(0,\s*50\)/g, 'villages');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[PASS] VargavaneTransferModal.jsx datalists now include all villages');
}
