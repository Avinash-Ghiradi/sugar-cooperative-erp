const fs = require('fs');

const orig = fs.readFileSync('client/src/components/Reports/ShareholderReports.jsx', 'utf8');
console.log('Original ShareholderReports.jsx lines:', orig.split('\n').length);
