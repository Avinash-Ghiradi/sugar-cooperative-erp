const fs = require('fs');
const path = require('path');

const cloudDbPath = path.join(__dirname, '../client/src/services/cloudDb.js');
let cloudContent = fs.readFileSync(cloudDbPath, 'utf8');

// Replace the parallel queries section to handle isNum vs isSymbolShareNo properly
const targetBlockRegex = /\/\/ 1\. Exact matches on share_no[\s\S]*?const \[exactRes, prefixRes, allRes\] = await Promise\.all\(\[/;

const newQueries = `// 1. Exact matches on share_no, sl_no, or receipt_no (Guarantees exact match is retrieved!)
        const exactMatchClause = isNum 
          ? \`or=(share_no.eq.\${q},sl_no.eq.\${q},receipt_no.eq.\${q})\` 
          : \`or=(share_no.eq.\${q},share_no.ilike.\${q}*)\`;
        const prefixClause = isNum 
          ? \`or=(share_no.ilike.\${q}*,receipt_no.ilike.\${q}*)\` 
          : \`or=(share_no.ilike.\${q}*)\`;
        const allClause = isNum 
          ? \`or=(share_no.eq.\${q},share_no.ilike.\${q}*,share_no.ilike.*\${q}*,receipt_no.eq.\${q},receipt_no.ilike.*\${q}*,shareholder_name.ilike.*\${q}*,mobile_no.ilike.*\${q}*)\` 
          : \`or=(share_no.eq.\${q},share_no.ilike.\${q}*,share_no.ilike.*\${q}*,shareholder_name.ilike.*\${q}*)\`;

        const exactUrl = \`\${cleanUrl}/rest/v1/shareholders?\${exactMatchClause}\${filterStr}&order=id.asc&limit=15\`;
        const prefixUrl = \`\${cleanUrl}/rest/v1/shareholders?\${prefixClause}\${filterStr}&order=id.asc&limit=60\`;
        const allUrl = \`\${cleanUrl}/rest/v1/shareholders?\${allClause}\${filterStr}&order=id.asc&limit=\${limit}\`;

        const [exactRes, prefixRes, allRes] = await Promise.all([`;

cloudContent = cloudContent.replace(targetBlockRegex, newQueries);
fs.writeFileSync(cloudDbPath, cloudContent, 'utf8');
console.log('cloudDb.js queries successfully patched!');
