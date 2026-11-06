const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../client/src/components/Reports/ShareholderReports.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const tdzBlock = `  // Detailed calculation of statutory totals across filteredShareholders
  const detailedTotals = useMemo(() => {
    let sharesCount = 0;
    let capital = 0;
    let admission = 0;
    let grandTotal = 0;

    for (let i = 0; i < filteredShareholders.length; i++) {
      const s = filteredShareholders[i];
      const shares = getShareholderSharesCount(s) || 1;
      sharesCount += shares;

      let sAmt = parseFloat(s.share_amount);
      if (!sAmt || isNaN(sAmt)) {
        const isClassB = String(s.schedule_cast || s.category || '').toLowerCase().includes('ಬ');
        const tot = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || 0;
        if (tot >= 20000) {
          sAmt = isClassB ? (shares * 25000) : (shares * 24000);
        } else {
          sAmt = tot > 0 ? tot : (shares * 2000);
        }
      }
      const adm = parseFloat(s.admission_fee) || 570;
      const totAmt = parseFloat(s.total_amount) || (sAmt + adm);

      capital += sAmt;
      admission += adm;
      grandTotal += totAmt;
    }

    return {
      totalShares: sharesCount,
      totalShareCapital: capital,
      totalAdmissionFees: admission,
      totalCollection: grandTotal
    };
  }, [filteredShareholders]);

  // Value extractor for any column
  const getColValue = (s, colId, rowIdx) => {
    const shares = getShareholderSharesCount(s) || 1;
    let sAmt = parseFloat(s.share_amount);
    if (!sAmt || isNaN(sAmt)) {
      const isClassB = String(s.schedule_cast || s.category || '').toLowerCase().includes('ಬ');
      const tot = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || 0;
      if (tot >= 20000) {
        sAmt = isClassB ? (shares * 25000) : (shares * 24000);
      } else {
        sAmt = tot > 0 ? tot : (shares * 2000);
      }
    }
    const adm = parseFloat(s.admission_fee) || 570;
    const totAmt = parseFloat(s.total_amount) || (sAmt + adm);

    switch (colId) {
      case 'sl_no': return rowIdx;
      case 'date': return formatReportDate(s.date || s.reg_date || s.registration_date || s.tharava_date);
      case 'shareholder_name': return s.shareholder_name || s.name || s.full_name || '—';
      case 'place': return s.place || s.village_name || '—';
      case 'taluk': return s.taluk || (s.circle ? 'ಇಂಡಿ' : 'ಚಡಚಣ') || '—';
      case 'share_amount': return sAmt.toLocaleString('en-IN');
      case 'admission_fee': return adm.toLocaleString('en-IN');
      case 'total_amount': return totAmt.toLocaleString('en-IN');
      case 'receipt_no': return s.receipt_no || s.reciept || '—';
      case 'number_of_shares': return shares;
      case 'category': return s.schedule_cast || s.category || 'ಅ ವರ್ಗ';
      case 'tharava_date': return formatReportDate(s.tharava_date);
      case 'tharava_no': return s.tharava_no || '—';
      case 'share_no': return s.share_no || s.share_number || '—';
      case 'status': {
        const st = String(s.status || 'Active');
        return st.toLowerCase() === 'active' || st === 'ಸಕ್ರಿಯ' ? 'ಸಕ್ರಿಯ' : 'ಅರ್ಜಿ';
      }
      case 'district': return s.district || 'ವಿಜಯಪುರ';
      case 'circle': return s.circle || s.circle_name || '—';
      case 'book_no': return s.book_no || '—';
      case 'aadhaar_card_no': return s.aadhaar_card_no || s.aadhaar_ref || '—';
      case 'mobile_no': return s.mobile_no || s.mobile || '—';
      case 'ownership': return s.ownership || s.relationship || 'ಸ್ವಂತ (Self)';
      case 'member_type': return s.member_type || 'ವೈಯಕ್ತಿಕ (Individual)';
      case 'nominee_name': return s.nominee_name || '—';
      case 'address': return s.address || s.nagara || '—';
      case 'pin_code': return s.pin_code || '—';
      default: return s[colId] || '—';
    }
  };`;

// Remove tdzBlock from top
const contentLf = content.replace(/\r\n/g, '\n');
const tdzBlockLf = tdzBlock.replace(/\r\n/g, '\n');

if (contentLf.includes(tdzBlockLf)) {
  const withoutTdz = contentLf.replace(tdzBlockLf, '');

  // Insert after kpis definition
  const kpisTarget = `      pctOfOverall: allShareholders.length > 0 ? ((totalCount / allShareholders.length) * 100).toFixed(1) : 0,
    };
  }, [filteredShareholders, allShareholders]);`;

  if (withoutTdz.includes(kpisTarget)) {
    const withTdzAfterKpis = withoutTdz.replace(kpisTarget, kpisTarget + '\n\n' + tdzBlockLf);
    const finalContent = content.includes('\r\n') ? withTdzAfterKpis.replace(/\n/g, '\r\n') : withTdzAfterKpis;
    fs.writeFileSync(filePath, finalContent, 'utf8');
    console.log('Successfully relocated detailedTotals & getColValue after filteredShareholders & kpis!');
  } else {
    console.error('Could not find kpisTarget');
  }
} else {
  console.error('Could not find tdzBlockLf');
}
