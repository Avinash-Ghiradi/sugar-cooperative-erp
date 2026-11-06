const fs = require('fs');

const path = 'client/src/components/Common/RegisterListPrintModal.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace('{item.date || \'—\'}', '{formatDocDate(item.date)}');
content = content.replace('{item.tharava_date || \'—\'}', '{formatDocDate(item.tharava_date)}');

fs.writeFileSync(path, content, 'utf8');
console.log('Updated item.date and item.tharava_date with formatDocDate!');
