const fs = require('fs');
const path = require('path');

// Update VarasaTransferModule.jsx
const varasaModPath = path.resolve(__dirname, '../client/src/components/Varasa/VarasaTransferModule.jsx');
let varasaModContent = fs.readFileSync(varasaModPath, 'utf8');

varasaModContent = varasaModContent.replace(
  'title="View / Print Varasa Acknowledgement Slip"',
  'title="ಶೇರು ವಾರಸಾ ದಾಖಲಾತಿ ಕಡತ ಮುದ್ರಣ (Varasa 12-Page Complete Bundle Print)"'
);
fs.writeFileSync(varasaModPath, varasaModContent, 'utf8');
console.log('Updated VarasaTransferModule.jsx');

// Update VargavaneTransferModule.jsx
const vargavaneModPath = path.resolve(__dirname, '../client/src/components/Vargavane/VargavaneTransferModule.jsx');
let vargavaneModContent = fs.readFileSync(vargavaneModPath, 'utf8');

vargavaneModContent = vargavaneModContent.replace(
  'title="ಅಧಿಕೃತ 5 ಪುಟಗಳ ಶೇರು ವರ್ಗಾವಣೆ ಮುದ್ರಣ (Print 5-Page Vargavane Transfer Application Dossier)"',
  'title="ಶೇರು ವರ್ಗಾವಣೆ ದಾಖಲಾತಿ ಕಡತ ಮುದ್ರಣ (Vargavane 5-Page Complete Bundle Print)"'
);
fs.writeFileSync(vargavaneModPath, vargavaneModContent, 'utf8');
console.log('Updated VargavaneTransferModule.jsx');
