const fs = require('fs');
const path = require('path');

const filePath = path.resolve('client/src/components/Reports/ShareholderReports.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Optimize masterOptions
const oldMaster = `  const masterOptions = useMemo(() => {
    const placesSet = new Set();
    const circlesSet = new Set();
    const categoriesSet = new Set();
    const tharavaSet = new Set();
    const cashAmountCounts = new Map();

    allShareholders.forEach(s => {
      const p = (s.place || s.village_name || '').trim();
      if (p) placesSet.add(p);

      const c = (s.circle || s.circle_name || '').trim();
      if (c && c !== 'ಇತರೆ (Other)') circlesSet.add(c);

      const cat = (s.schedule_cast || '').trim();
      if (cat) categoriesSet.add(cat);

      const tNo = (s.tharava_no || '').trim();
      if (tNo && tNo !== '—' && tNo !== '-') tharavaSet.add(tNo);

      const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (getShareholderSharesCount(s) * 2000);
      if (amt > 0) {
        cashAmountCounts.set(amt, (cashAmountCounts.get(amt) || 0) + 1);
      }
    });`;

const newMaster = `  const masterOptions = useMemo(() => {
    const placesSet = new Set();
    const circlesSet = new Set();
    const categoriesSet = new Set();
    const tharavaSet = new Set();
    const cashAmountCounts = new Map();

    for (let i = 0; i < allShareholders.length; i++) {
      const s = allShareholders[i];
      const p = (s.place || s.village_name || '').trim();
      if (p) placesSet.add(p);

      const c = (s.circle || s.circle_name || '').trim();
      if (c && c !== 'ಇತರೆ (Other)') circlesSet.add(c);

      const cat = (s.schedule_cast || '').trim();
      if (cat) categoriesSet.add(cat);

      const tNo = (s.tharava_no || '').trim();
      if (tNo && tNo !== '—' && tNo !== '-') tharavaSet.add(tNo);

      const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || ((parseInt(s.number_of_shares, 10) || 1) * 2000);
      if (amt > 0) {
        cashAmountCounts.set(amt, (cashAmountCounts.get(amt) || 0) + 1);
      }
    }`;

if (code.includes(oldMaster)) {
  code = code.replace(oldMaster, newMaster);
  console.log('masterOptions optimized (LF)!');
} else if (code.includes(oldMaster.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldMaster.replace(/\n/g, '\r\n'), newMaster.replace(/\n/g, '\r\n'));
  console.log('masterOptions optimized (CRLF)!');
} else {
  console.error('oldMaster not found!');
  process.exit(1);
}

// 2. detailedTotals
const oldDetailedTotals = `  const detailedTotals = useMemo(() => {
    let sharesCount = 0;`;

const newDetailedTotals = `  const detailedTotals = useMemo(() => {
    if (reportMode !== 'detailed' && !showPrintModal) {
      return { totalShares: kpis.totalShares, totalShareCapital: kpis.totalAmount, totalAdmissionFees: 0, totalCollection: kpis.totalAmount };
    }
    let sharesCount = 0;`;

if (code.includes(oldDetailedTotals)) {
  code = code.replace(oldDetailedTotals, newDetailedTotals);
  console.log('detailedTotals guard added (LF)!');
} else if (code.includes(oldDetailedTotals.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldDetailedTotals.replace(/\n/g, '\r\n'), newDetailedTotals.replace(/\n/g, '\r\n'));
  console.log('detailedTotals guard added (CRLF)!');
} else {
  console.error('oldDetailedTotals not found!');
  process.exit(1);
}

const oldDetailedTotalsDep = `  }, [filteredShareholders]);`;
const newDetailedTotalsDep = `  }, [reportMode, showPrintModal, filteredShareholders, kpis]);`;

if (code.includes(oldDetailedTotalsDep)) {
  code = code.replace(oldDetailedTotalsDep, newDetailedTotalsDep);
  console.log('detailedTotals deps updated (LF)!');
} else if (code.includes(oldDetailedTotalsDep.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldDetailedTotalsDep.replace(/\n/g, '\r\n'), newDetailedTotalsDep.replace(/\n/g, '\r\n'));
  console.log('detailedTotals deps updated (CRLF)!');
} else {
  console.error('oldDetailedTotalsDep not found!');
  process.exit(1);
}

// 3. placewiseData
const oldPlacewise = `  // 1. PLACEWISE AGGREGATION
  const placewiseData = useMemo(() => {
    const map = new Map();`;

const newPlacewise = `  // 1. PLACEWISE AGGREGATION
  const placewiseData = useMemo(() => {
    if (reportMode !== 'placewise') return [];
    const map = new Map();`;

if (code.includes(oldPlacewise)) {
  code = code.replace(oldPlacewise, newPlacewise);
  console.log('placewiseData guard added (LF)!');
} else if (code.includes(oldPlacewise.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldPlacewise.replace(/\n/g, '\r\n'), newPlacewise.replace(/\n/g, '\r\n'));
  console.log('placewiseData guard added (CRLF)!');
} else {
  console.error('oldPlacewise not found!');
  process.exit(1);
}

const oldPlacewiseDep = `  }, [filteredShareholders, kpis, sortField, sortOrder]);`;
const newPlacewiseDep = `  }, [reportMode, filteredShareholders, kpis, sortField, sortOrder]);`;

if (code.includes(oldPlacewiseDep)) {
  code = code.replace(oldPlacewiseDep, newPlacewiseDep);
  console.log('placewiseData deps updated (LF)!');
} else if (code.includes(oldPlacewiseDep.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldPlacewiseDep.replace(/\n/g, '\r\n'), newPlacewiseDep.replace(/\n/g, '\r\n'));
  console.log('placewiseData deps updated (CRLF)!');
} else {
  console.error('oldPlacewiseDep not found!');
  process.exit(1);
}

// 4. categorywiseData
const oldCategorywise = `  // 2. CATEGORYWISE AGGREGATION
  const categorywiseData = useMemo(() => {
    const map = new Map();`;

const newCategorywise = `  // 2. CATEGORYWISE AGGREGATION
  const categorywiseData = useMemo(() => {
    if (reportMode !== 'categorywise') return [];
    const map = new Map();`;

if (code.includes(oldCategorywise)) {
  code = code.replace(oldCategorywise, newCategorywise);
  console.log('categorywiseData guard added (LF)!');
} else if (code.includes(oldCategorywise.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldCategorywise.replace(/\n/g, '\r\n'), newCategorywise.replace(/\n/g, '\r\n'));
  console.log('categorywiseData guard added (CRLF)!');
} else {
  console.error('oldCategorywise not found!');
  process.exit(1);
}

const oldCategorywiseDep = `  }, [filteredShareholders, kpis]);`;
const newCategorywiseDep = `  }, [reportMode, filteredShareholders, kpis]);`;

if (code.includes(oldCategorywiseDep)) {
  code = code.replace(oldCategorywiseDep, newCategorywiseDep);
  console.log('categorywiseData deps updated (LF)!');
} else if (code.includes(oldCategorywiseDep.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldCategorywiseDep.replace(/\n/g, '\r\n'), newCategorywiseDep.replace(/\n/g, '\r\n'));
  console.log('categorywiseData deps updated (CRLF)!');
} else {
  console.error('oldCategorywiseDep not found!');
  process.exit(1);
}

// 5. circlewiseData
const oldCirclewise = `  // 3. CIRCLEWISE AGGREGATION
  const circlewiseData = useMemo(() => {
    const map = new Map();`;

const newCirclewise = `  // 3. CIRCLEWISE AGGREGATION
  const circlewiseData = useMemo(() => {
    if (reportMode !== 'circlewise') return [];
    const map = new Map();`;

if (code.includes(oldCirclewise)) {
  code = code.replace(oldCirclewise, newCirclewise);
  console.log('circlewiseData guard added (LF)!');
} else if (code.includes(oldCirclewise.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldCirclewise.replace(/\n/g, '\r\n'), newCirclewise.replace(/\n/g, '\r\n'));
  console.log('circlewiseData guard added (CRLF)!');
} else {
  console.error('oldCirclewise not found!');
  process.exit(1);
}

const oldCirclewiseDep = `  }, [filteredShareholders, kpis]);`;
const newCirclewiseDep = `  }, [reportMode, filteredShareholders, kpis]);`;

if (code.includes(oldCirclewiseDep)) {
  code = code.replace(oldCirclewiseDep, newCirclewiseDep);
  console.log('circlewiseData deps updated (LF)!');
} else if (code.includes(oldCirclewiseDep.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldCirclewiseDep.replace(/\n/g, '\r\n'), newCirclewiseDep.replace(/\n/g, '\r\n'));
  console.log('circlewiseData deps updated (CRLF)!');
}

// 6. shareswiseData: single-pass loop + guard
const oldShareswise = `  // 4. SHARESWISE AGGREGATION (1, 2, 3-5, 6-10, 11+)
  const shareswiseData = useMemo(() => {
    const tiers = [
      { key: '0', label: '0 ಶೇರುಗಳು (ಅಪೂರ್ಣ ಕಂತು)', desc: 'ಕಂತು ಅಪೂರ್ಣವಾಗಿರುವ ಸದಸ್ಯರು (0 ಷೇರು)', min: 0, max: 0 },
      { key: '1', label: '1 ಶೇರು (1 Share)', desc: '₹ 2,000 ಮುಖಬೆಲೆ - ಸಾಮಾನ್ಯ ಬೆಳೆಗಾರ ಸದಸ್ಯರು', min: 1, max: 1 },
      { key: '2', label: '2 ಶೇರುಗಳು (2 Shares)', desc: '₹ 4,000 ಮುಖಬೆಲೆ - ಮಧ್ಯಮ ಶೇರುದಾರರು', min: 2, max: 2 },
      { key: '3-5', label: '3 ರಿಂದ 5 ಶೇರುಗಳು (3-5 Shares)', desc: '₹ 6,000 - ₹ 10,000 ಮುಖಬೆಲೆ', min: 3, max: 5 },
      { key: '6-10', label: '6 ರಿಂದ 10 ಶೇರುಗಳು (6-10 Shares)', desc: '₹ 12,000 - ₹ 20,000 ಮುಖಬೆಲೆ', min: 6, max: 10 },
      { key: '11+', label: '11 ಮತ್ತು ಹೆಚ್ಚಿನ ಶೇರುಗಳು (11+ Shares)', desc: 'ಗರಿಷ್ಠ ಶೇರುದಾರರು & ಸಂಸ್ಥೆಗಳು', min: 11, max: 999999 },
    ];

    return tiers.map(tier => {
      const matched = filteredShareholders.filter(s => {
        const cnt = getShareholderSharesCount(s);
        return cnt >= tier.min && cnt <= tier.max;
      });

      const count = matched.length;
      const totalShares = matched.reduce((sum, s) => sum + getShareholderSharesCount(s), 0);
      const totalAmount = matched.reduce((sum, s) => {
        const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (getShareholderSharesCount(s) * 2000);
        return sum + amt;
      }, 0);

      return {
        ...tier,
        count,
        totalShares,
        totalAmount,
        sharePct: kpis.totalShares > 0 ? ((totalShares / kpis.totalShares) * 100).toFixed(1) : 0,
        memberPct: kpis.totalCount > 0 ? ((count / kpis.totalCount) * 100).toFixed(1) : 0,
      };
    });
  }, [filteredShareholders, kpis]);`;

const newShareswise = `  // 4. SHARESWISE AGGREGATION (1, 2, 3-5, 6-10, 11+)
  const shareswiseData = useMemo(() => {
    if (reportMode !== 'shareswise') return [];
    const tiers = [
      { key: '0', label: '0 ಶೇರುಗಳು (ಅಪೂರ್ಣ ಕಂತು)', desc: 'ಕಂತು ಅಪೂರ್ಣವಾಗಿರುವ ಸದಸ್ಯರು (0 ಷೇರು)', count: 0, totalShares: 0, totalAmount: 0 },
      { key: '1', label: '1 ಶೇರು (1 Share)', desc: '₹ 2,000 ಮುಖಬೆಲೆ - ಸಾಮಾನ್ಯ ಬೆಳೆಗಾರ ಸದಸ್ಯರು', count: 0, totalShares: 0, totalAmount: 0 },
      { key: '2', label: '2 ಶೇರುಗಳು (2 Shares)', desc: '₹ 4,000 ಮುಖಬೆಲೆ - ಮಧ್ಯಮ ಶೇರುದಾರರು', count: 0, totalShares: 0, totalAmount: 0 },
      { key: '3-5', label: '3 ರಿಂದ 5 ಶೇರುಗಳು (3-5 Shares)', desc: '₹ 6,000 - ₹ 10,000 ಮುಖಬೆಲೆ', count: 0, totalShares: 0, totalAmount: 0 },
      { key: '6-10', label: '6 ರಿಂದ 10 ಶೇರುಗಳು (6-10 Shares)', desc: '₹ 12,000 - ₹ 20,000 ಮುಖಬೆಲೆ', count: 0, totalShares: 0, totalAmount: 0 },
      { key: '11+', label: '11 ಮತ್ತು ಹೆಚ್ಚಿನ ಶೇರುಗಳು (11+ Shares)', desc: 'ಗರಿಷ್ಠ ಶೇರುದಾರರು & ಸಂಸ್ಥೆಗಳು', count: 0, totalShares: 0, totalAmount: 0 },
    ];

    for (let i = 0; i < filteredShareholders.length; i++) {
      const s = filteredShareholders[i];
      const cnt = getShareholderSharesCount(s);
      const amt = parseFloat(s.total_amount) || parseFloat(s.receipt_amount) || (cnt * 2000);
      let tierIdx = 0;
      if (cnt === 0) tierIdx = 0;
      else if (cnt === 1) tierIdx = 1;
      else if (cnt === 2) tierIdx = 2;
      else if (cnt <= 5) tierIdx = 3;
      else if (cnt <= 10) tierIdx = 4;
      else tierIdx = 5;

      tiers[tierIdx].count += 1;
      tiers[tierIdx].totalShares += cnt;
      tiers[tierIdx].totalAmount += amt;
    }

    return tiers.map(tier => ({
      ...tier,
      sharePct: kpis.totalShares > 0 ? ((tier.totalShares / kpis.totalShares) * 100).toFixed(1) : 0,
      memberPct: kpis.totalCount > 0 ? ((tier.count / kpis.totalCount) * 100).toFixed(1) : 0,
    }));
  }, [reportMode, filteredShareholders, kpis]);`;

if (code.includes(oldShareswise)) {
  code = code.replace(oldShareswise, newShareswise);
  console.log('shareswiseData single-pass updated (LF)!');
} else if (code.includes(oldShareswise.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldShareswise.replace(/\n/g, '\r\n'), newShareswise.replace(/\n/g, '\r\n'));
  console.log('shareswiseData single-pass updated (CRLF)!');
} else {
  console.error('oldShareswise not found!');
  process.exit(1);
}

// 7. amountwiseData
const oldAmountwise = `  // 5. CASH AMOUNTWISE AGGREGATION (ನಗದು ಮೊತ್ತವಾರು ವಿಂಗಡಣೆ)
  const amountwiseData = useMemo(() => {
    const map = new Map();`;

const newAmountwise = `  // 5. CASH AMOUNTWISE AGGREGATION (ನಗದು ಮೊತ್ತವಾರು ವಿಂಗಡಣೆ)
  const amountwiseData = useMemo(() => {
    if (reportMode !== 'amountwise') return [];
    const map = new Map();`;

if (code.includes(oldAmountwise)) {
  code = code.replace(oldAmountwise, newAmountwise);
  console.log('amountwiseData guard added (LF)!');
} else if (code.includes(oldAmountwise.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldAmountwise.replace(/\n/g, '\r\n'), newAmountwise.replace(/\n/g, '\r\n'));
  console.log('amountwiseData guard added (CRLF)!');
} else {
  console.error('oldAmountwise not found!');
  process.exit(1);
}

const oldAmountwiseDep = `  }, [filteredShareholders, kpis, sortField, sortOrder]);`;
const newAmountwiseDep = `  }, [reportMode, filteredShareholders, kpis, sortField, sortOrder]);`;

if (code.includes(oldAmountwiseDep)) {
  code = code.replace(oldAmountwiseDep, newAmountwiseDep);
  console.log('amountwiseData deps updated (LF)!');
} else if (code.includes(oldAmountwiseDep.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldAmountwiseDep.replace(/\n/g, '\r\n'), newAmountwiseDep.replace(/\n/g, '\r\n'));
  console.log('amountwiseData deps updated (CRLF)!');
} else {
  console.error('oldAmountwiseDep not found!');
  process.exit(1);
}

// 8. Excel export fallback for detailedTotals
const oldExcelTotals = `[\`ಒಟ್ಟು ದಾಖಲೆಗಳು: \${filteredShareholders.length} | ಒಟ್ಟು ಶೇರುಗಳು: \${detailedTotals.totalShares} | ಒಟ್ಟು ಜಮಾ ಮೊತ್ತ: ₹ \${detailedTotals.totalCollection.toLocaleString('en-IN')}\`],`;
const newExcelTotals = `[\`ಒಟ್ಟು ದಾಖಲೆಗಳು: \${filteredShareholders.length} | ಒಟ್ಟು ಶೇರುಗಳು: \${detailedTotals.totalShares || kpis.totalShares} | ಒಟ್ಟು ಜಮಾ ಮೊತ್ತ: ₹ \${(detailedTotals.totalCollection || kpis.totalAmount).toLocaleString('en-IN')}\`],`;

if (code.includes(oldExcelTotals)) {
  code = code.replace(oldExcelTotals, newExcelTotals);
  console.log('Excel export totals updated (LF)!');
} else if (code.includes(oldExcelTotals.replace(/\n/g, '\r\n'))) {
  code = code.replace(oldExcelTotals.replace(/\n/g, '\r\n'), newExcelTotals.replace(/\n/g, '\r\n'));
  console.log('Excel export totals updated (CRLF)!');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched ShareholderReports.jsx!');
