const fs = require('fs');
const path = require('path');

const filePath = path.resolve('client/src/components/Common/RegisterListPrintModal.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add getShareholderSharesCount import if missing
if (!code.includes('getShareholderSharesCount')) {
  code = code.replace(
    "import { downloadVargavaneDocx } from '../../services/vargavaneDocxService';",
    "import { downloadVargavaneDocx } from '../../services/vargavaneDocxService';\r\nimport { getShareholderSharesCount } from '../../services/api';"
  );
  console.log('Imported getShareholderSharesCount');
}

// 2. Add type === 'shareholder' in registerTitleKn
const oldTitleCheck = `  if (type === 'enrollment') {
    registerTitleKn = 'ಶೇರು ವಿಭಾಗ - ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ವಹಿ (15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್)';
    registerSubtitleEn = 'NEW SHAREHOLDER STATUTORY ENROLLMENT REGISTER';
  } else if (type === 'varasa') {`;

const newTitleCheck = `  if (type === 'enrollment') {
    registerTitleKn = 'ಶೇರು ವಿಭಾಗ - ಹೊಸ ಶೇರುದಾರರ ನೋಂದಣಿ ವಹಿ (15 ಕಾಲಂ ರಿಜಿಸ್ಟರ್)';
    registerSubtitleEn = 'NEW SHAREHOLDER STATUTORY ENROLLMENT REGISTER';
  } else if (type === 'shareholder') {
    registerTitleKn = 'ಶೇರು ವಿಭಾಗ - ಶೇರುದಾರರ ಶಾಸನಬದ್ಧ ನಮೂನೆ ವಹಿ (Shareholder Statutory Register)';
    registerSubtitleEn = 'SHAREHOLDER STATUTORY MASTER REGISTER';
  } else if (type === 'varasa') {`;

if (code.includes(oldTitleCheck)) {
  code = code.replace(oldTitleCheck, newTitleCheck);
  console.log('Added shareholder title (LF)');
} else if (code.includes(oldTitleCheck.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldTitleCheck.replace(/\n/g, '\r\n'), newTitleCheck.replace(/\n/g, '\r\n'));
  console.log('Added shareholder title (CRLF)');
}

// 3. Update totals calculation for type === 'shareholder'
const oldTotalsCalc = `    if (type === 'enrollment') {
      const shareAmt = parseFloat(r.share_amount) || (shares * 24000);
      const admFee = parseFloat(r.admission_fee) || (shares * 570);
      const totAmt = parseFloat(r.total_amount) || (shareAmt + admFee);
      totalShareCapital += shareAmt;
      totalAdmissionFees += admFee;
      totalCollection += totAmt;
    } else {`;

const newTotalsCalc = `    if (type === 'enrollment' || type === 'shareholder') {
      let shareAmt = parseFloat(r.share_amount);
      if (!shareAmt || isNaN(shareAmt)) {
        const isClassB = String(r.schedule_cast || r.category || '').toLowerCase().includes('ಬ');
        const tot = parseFloat(r.total_amount) || parseFloat(r.receipt_amount) || 0;
        if (tot >= 20000) {
          shareAmt = isClassB ? (shares * 25000) : (shares * 24000);
        } else {
          shareAmt = tot > 0 ? tot : (shares * 2000);
        }
      }
      const admFee = parseFloat(r.admission_fee) || (parseFloat(r.total_amount) > 20000 ? 570 : 0);
      const totAmt = parseFloat(r.total_amount) || parseFloat(r.receipt_amount) || (shareAmt + admFee);
      totalShareCapital += shareAmt;
      totalAdmissionFees += admFee;
      totalCollection += totAmt;
    } else {`;

if (code.includes(oldTotalsCalc)) {
  code = code.replace(oldTotalsCalc, newTotalsCalc);
  console.log('Updated totals calc (LF)');
} else if (code.includes(oldTotalsCalc.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldTotalsCalc.replace(/\n/g, '\r\n'), newTotalsCalc.replace(/\n/g, '\r\n'));
  console.log('Updated totals calc (CRLF)');
}

// 4. Update banner label for shareholder
code = code.replace("type === 'enrollment' ?", "(type === 'enrollment' || type === 'shareholder') ?");

// 5. Add renderShareholderTable function
const shareholderTableFunc = `
  // 4. Shareholder Statutory Table (16 Columns)
  const renderShareholderTable = () => (
    <table className="w-full border-collapse border border-black text-black text-[10.5px]">
      <thead>
        <tr className="bg-slate-200 border-b-2 border-black font-bold text-center">
          <th className="border border-black p-1 w-8">ಕ್ರ.ಸಂ.</th>
          <th className="border border-black p-1 w-14">ಪುಸ್ತಕ ನಂ.</th>
          <th className="border border-black p-1 w-16">ಶೇರು ನಂ.</th>
          <th className="border border-black p-1 text-left min-w-[130px]">ಶೇರುದಾರರ ಹೆಸರು (Shareholder Name)</th>
          <th className="border border-black p-1">ಸ್ಥಳ (Place)</th>
          <th className="border border-black p-1">ತಾಲೂಕು</th>
          <th className="border border-black p-1">ವಲಯ</th>
          <th className="border border-black p-1 w-12 text-center">ವರ್ಗ</th>
          <th className="border border-black p-1 w-12 text-center">ಶೇರು</th>
          <th className="border border-black p-1 w-16 text-right">ಶೇರು ಮೊತ್ತ</th>
          <th className="border border-black p-1 w-14 text-right">ಶುಲ್ಕ</th>
          <th className="border border-black p-1 w-16 text-right font-bold">ಒಟ್ಟು ಮೊತ್ತ</th>
          <th className="border border-black p-1 w-14 text-center">ರಶೀದಿ ನಂ</th>
          <th className="border border-black p-1 w-16 text-center">ನೋಂದಣಿ ದಿನಾಂಕ</th>
          <th className="border border-black p-1 w-14 text-center">ಠರಾವು ನಂ</th>
          <th className="border border-black p-1 w-16 text-center">ಮಾಲೀಕತ್ವ</th>
        </tr>
      </thead>
      <tbody>
        {recordsToPrint.length === 0 ? (
          <tr>
            <td colSpan="16" className="border border-black p-8 text-center text-slate-500 font-bold">
              ಯಾವುದೇ ಶೇರುದಾರರ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ
            </td>
          </tr>
        ) : (
          recordsToPrint.map((item, idx) => {
            const shares = getShareholderSharesCount(item) || (parseInt(item.number_of_shares, 10) || 1);
            let sAmt = parseFloat(item.share_amount);
            if (!sAmt || isNaN(sAmt)) {
              const isClassB = String(item.schedule_cast || item.category || '').toLowerCase().includes('ಬ');
              const tot = parseFloat(item.total_amount) || parseFloat(item.receipt_amount) || 0;
              if (tot >= 20000) {
                sAmt = isClassB ? (shares * 25000) : (shares * 24000);
              } else {
                sAmt = tot > 0 ? tot : (shares * 2000);
              }
            }
            const adm = parseFloat(item.admission_fee) || (parseFloat(item.total_amount) > 20000 ? 570 : 0);
            const totAmt = parseFloat(item.total_amount) || parseFloat(item.receipt_amount) || (sAmt + adm);
            const own = item.ownership || item.relationship || 'ಸ್ವಂತ (Self)';

            return (
              <tr key={item.id || idx} className="border-b border-black/80 hover:bg-slate-50">
                <td className="border border-black p-1 text-center font-mono">{item.sl_no || (idx + 1)}</td>
                <td className="border border-black p-1 text-center font-mono font-semibold">{item.book_no || '—'}</td>
                <td className="border border-black p-1 text-center font-mono font-bold text-black">{item.share_no || item.share_number || '—'}</td>
                <td className="border border-black p-1 px-1.5 font-bold text-left">{item.shareholder_name || item.name || '—'}</td>
                <td className="border border-black p-1 text-center">{item.place || item.village_name || '—'}</td>
                <td className="border border-black p-1 text-center">{item.taluk || '—'}</td>
                <td className="border border-black p-1 text-center">{item.circle || item.circle_name || '—'}</td>
                <td className="border border-black p-1 text-center font-semibold">{item.schedule_cast || item.category || 'ಅ - ವರ್ಗ'}</td>
                <td className="border border-black p-1 text-center font-mono font-bold">{shares}</td>
                <td className="border border-black p-1 text-right font-mono">{sAmt.toLocaleString()}</td>
                <td className="border border-black p-1 text-right font-mono">{adm > 0 ? adm.toLocaleString() : '—'}</td>
                <td className="border border-black p-1 text-right font-mono font-bold">{totAmt.toLocaleString()}</td>
                <td className="border border-black p-1 text-center font-mono">{item.receipt_no || '—'}</td>
                <td className="border border-black p-1 text-center font-mono">{formatDocDate(item.date || item.reg_date || item.registration_date)}</td>
                <td className="border border-black p-1 text-center font-mono">{item.tharava_no || '—'}</td>
                <td className="border border-black p-1 text-center text-[9.5px] font-semibold">{own}</td>
              </tr>
            );
          })
        )}
        {recordsToPrint.length > 0 && (
          <tr className="bg-slate-200 border-t-2 border-black font-bold text-black">
            <td colSpan="8" className="border border-black p-1.5 text-center font-bold">
              ಒಟ್ಟು ಮೊತ್ತ (GRAND TOTAL) - {recordsToPrint.length} ಶೇರುದಾರರು
            </td>
            <td className="border border-black p-1.5 text-center font-mono font-bold">{totalShares}</td>
            <td className="border border-black p-1.5 text-right font-mono font-bold">₹ {totalShareCapital.toLocaleString()}</td>
            <td className="border border-black p-1.5 text-right font-mono font-bold">₹ {totalAdmissionFees.toLocaleString()}</td>
            <td className="border border-black p-1.5 text-right font-mono font-bold">₹ {totalCollection.toLocaleString()}</td>
            <td colSpan="4" className="border border-black p-1.5"></td>
          </tr>
        )}
      </tbody>
    </table>
  );
`;

const signaturesTarget = '  // Signatures Footer Block';
if (code.includes(signaturesTarget)) {
  code = code.replace(signaturesTarget, shareholderTableFunc + '\r\n' + signaturesTarget);
  console.log('Added renderShareholderTable function');
}

// 6. Add renderShareholderTable to documentContent
const docContentTarget = '{type === \'vargavane\' && renderVargavaneTable()}';
if (code.includes(docContentTarget)) {
  code = code.replace(
    docContentTarget,
    docContentTarget + "\r\n      {type === 'shareholder' && renderShareholderTable()}"
  );
  console.log('Added shareholder table to documentContent');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated RegisterListPrintModal.jsx!');
