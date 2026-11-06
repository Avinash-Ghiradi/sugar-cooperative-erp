const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../client/src/components/Reports/ShareholderReports.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Check and add imports
if (!content.includes('useCompanyLogo')) {
  content = content.replace(
    "import ShareholderProfile from '../Shareholders/ShareholderProfile';",
    `import ShareholderProfile from '../Shareholders/ShareholderProfile';
import RegisterListPrintModal from '../Common/RegisterListPrintModal';
import { useCompanyLogo, useHandshakeLogo, DEFAULT_LOGO_PATH, DEFAULT_HANDSHAKE_PATH } from '../../services/organizationService';`
  );
}

if (!content.includes('CheckSquare')) {
  content = content.replace(
    'CheckCircle2,',
    'CheckCircle2, CheckSquare, Square,'
  );
}

// 2. Add CooperativeHandshakeIcon & AVAILABLE_REPORT_COLUMNS & formatReportDate
const helperBlock = `
// Classic Cooperative Handshake SVG Icon fallback
function CooperativeHandshakeIcon({ className = "w-20 h-12" }) {
  const handshakeLogo = useHandshakeLogo();
  const [imgError, setImgError] = React.useState(false);

  if (handshakeLogo && !imgError) {
    return (
      <img
        src={handshakeLogo}
        alt="Cooperative Handshake"
        className={\`\${className} object-contain filter drop-shadow-sm\`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg viewBox="0 0 140 70" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="4,12 30,20 30,54 4,46" fill="#111" stroke="#000" strokeWidth="1.5" />
      <polygon points="30,20 36,22 36,52 30,54" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <polygon points="136,12 110,20 110,54 136,46" fill="#111" stroke="#000" strokeWidth="1.5" />
      <polygon points="110,20 104,22 104,52 110,54" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <path d="M 36 26 C 46 21, 56 25, 64 31 C 68 34, 70 39, 68 43 C 65 47, 58 49, 50 49 C 42 49, 36 47, 36 47 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <path d="M 104 25 C 94 20, 84 23, 76 28 C 70 32, 67 38, 70 43 C 74 48, 84 49, 92 48 C 100 47, 104 47, 104 47 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
      <path d="M 74 33 C 79 35, 82 40, 81 44" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 68 36 C 73 38, 76 43, 75 46" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 62 39 C 67 41, 70 45, 69 48" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 56 42 C 61 44, 64 47, 63 49" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 40 28 C 50 24, 60 29, 66 34" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Available Report Statutory Columns (Matching exact 15-column register from statutory layout)
export const AVAILABLE_REPORT_COLUMNS = [
  { id: 'sl_no', labelKn: 'ಕ್ರ.ಸಂ.', labelEn: 'Sl. No.', defaultSelected: true, align: 'center', width: 'w-10' },
  { id: 'date', labelKn: 'ದಿನಾಂಕ', labelEn: 'Date', defaultSelected: true, align: 'center', width: 'w-24' },
  { id: 'shareholder_name', labelKn: 'ಶೇರುದಾರರ ಹೆಸರು (Shareholder Name)', labelEn: 'Shareholder Name', defaultSelected: true, align: 'left', width: 'min-w-[190px]' },
  { id: 'place', labelKn: 'ಸ್ಥಳ (Place)', labelEn: 'Place', defaultSelected: true, align: 'center', width: 'min-w-[110px]' },
  { id: 'taluk', labelKn: 'ತಾಲೂಕು', labelEn: 'Taluk', defaultSelected: true, align: 'center', width: 'w-20' },
  { id: 'share_amount', labelKn: 'ಶೇರು ಮೊತ್ತ', labelEn: 'Share Amount', defaultSelected: true, align: 'right', width: 'w-24' },
  { id: 'admission_fee', labelKn: 'ಪ್ರವೇಶ ಶುಲ್ಕ', labelEn: 'Admission Fee', defaultSelected: true, align: 'right', width: 'w-20' },
  { id: 'total_amount', labelKn: 'ಒಟ್ಟು ಮೊತ್ತ', labelEn: 'Total Amount', defaultSelected: true, align: 'right', width: 'w-24' },
  { id: 'receipt_no', labelKn: 'ರಶೀದಿ ನಂ', labelEn: 'Receipt No', defaultSelected: true, align: 'center', width: 'w-20' },
  { id: 'number_of_shares', labelKn: 'ಶೇರು ಪ್ರಮಾಣ', labelEn: 'Shares Qty', defaultSelected: true, align: 'center', width: 'w-16' },
  { id: 'category', labelKn: 'ವರ್ಗ', labelEn: 'Category', defaultSelected: true, align: 'center', width: 'w-20' },
  { id: 'tharava_date', labelKn: 'ಠರಾವು ದಿನಾಂಕ', labelEn: 'Tharava Date', defaultSelected: true, align: 'center', width: 'w-24' },
  { id: 'tharava_no', labelKn: 'ಠರಾವು ನಂ', labelEn: 'Tharava No', defaultSelected: true, align: 'center', width: 'w-20' },
  { id: 'share_no', labelKn: 'ಶೇರು ಸಂಖ್ಯೆ', labelEn: 'Share No', defaultSelected: true, align: 'center', width: 'w-24' },
  { id: 'status', labelKn: 'ಸ್ಥಿತಿ', labelEn: 'Status', defaultSelected: true, align: 'center', width: 'w-20' },

  // Extra optional columns user can toggle on
  { id: 'district', labelKn: 'ಜಿಲ್ಲೆ', labelEn: 'District', defaultSelected: false, align: 'center', width: 'w-20' },
  { id: 'circle', labelKn: 'ವಲಯ (Circle)', labelEn: 'Circle', defaultSelected: false, align: 'center', width: 'min-w-[120px]' },
  { id: 'book_no', labelKn: 'ಪುಸ್ತಕ ನಂ (Book No)', labelEn: 'Book No', defaultSelected: false, align: 'center', width: 'w-20' },
  { id: 'aadhaar_card_no', labelKn: 'ಆಧಾರ್ ಕಾರ್ಡ್ ನಂ', labelEn: 'Aadhaar Card No', defaultSelected: false, align: 'center', width: 'w-32' },
  { id: 'mobile_no', labelKn: 'ಮೊಬೈಲ್ ನಂ', labelEn: 'Mobile No', defaultSelected: false, align: 'center', width: 'w-28' },
  { id: 'ownership', labelKn: 'ಮಾಲೀಕತ್ವ / ಸಂಬಂಧ', labelEn: 'Ownership', defaultSelected: false, align: 'center', width: 'w-24' },
  { id: 'member_type', labelKn: 'ಸದಸ್ಯತ್ವದ ವಿಧ', labelEn: 'Member Type', defaultSelected: false, align: 'left', width: 'min-w-[140px]' },
  { id: 'nominee_name', labelKn: 'ನಾಮಿನಿ ಹೆಸರು', labelEn: 'Nominee Name', defaultSelected: false, align: 'left', width: 'min-w-[140px]' },
  { id: 'address', labelKn: 'ಸಂಪೂರ್ಣ ವಿಳಾಸ', labelEn: 'Address', defaultSelected: false, align: 'left', width: 'min-w-[160px]' },
  { id: 'pin_code', labelKn: 'ಪಿನ್ ಕೋಡ್', labelEn: 'Pin Code', defaultSelected: false, align: 'center', width: 'w-20' }
];

// Date formatter supporting Excel serial numbers & ISO dates
function formatReportDate(dateVal) {
  if (!dateVal || dateVal === '—' || dateVal === '-') return '—';
  const str = String(dateVal).trim();
  const num = Number(str);
  if (!isNaN(num) && num > 1000 && num < 70000) {
    const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      const d = String(jsDate.getDate()).padStart(2, '0');
      const m = String(jsDate.getMonth() + 1).padStart(2, '0');
      const y = jsDate.getFullYear();
      return \`\${d}/\${m}/\${y}\`;
    }
  }
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return \`\${parts[2].padStart(2, '0')}/\${parts[1].padStart(2, '0')}/\${parts[0]}\`;
    }
    return \`\${parts[0].padStart(2, '0')}/\${parts[1].padStart(2, '0')}/\${parts[2]}\`;
  }
  return str;
}
`;

if (!content.includes('CooperativeHandshakeIcon')) {
  content = content.replace(
    'export default function ShareholderReports() {',
    helperBlock + '\nexport default function ShareholderReports() {'
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Added helper block and icons to ShareholderReports.jsx!');
