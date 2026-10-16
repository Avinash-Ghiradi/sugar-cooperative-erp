// Data Service Layer supporting both backend REST API and standalone fallback dataset
// Designed for 17,000+ Shareholders with 38 Official Cooperative Society Ledger Columns

const API_BASE = '/api';

// -------------------------------------------------------------
// STANDALONE SEEDED DATA ENGINE (17,250 RECORDS GENERATOR)
// -------------------------------------------------------------
let mockShareholders = [];
let mockVillages = [];
let mockCircles = [];
let mockTransactions = [];
let mockSugarAllotments = [];
let mockVarasaTransfers = [];
let mockEmployees = [];
let mockAuditLogs = [];

function generateMockDataset() {
  if (mockShareholders.length > 0) return;

  console.log('⚡ Initializing high-performance client dataset (17,250 shareholders with 38 statutory cooperative ledger columns)...');

  // Circles in Indi / Chadchan / Vijayapura Region
  mockCircles = [
    { circle_id: 'CIR-001', name: 'ಇಂಡಿ (Indi Circle)', description: 'Indi Central Cane Zone', village_count: 8, shareholder_count: 2850, total_shares: 14250 },
    { circle_id: 'CIR-002', name: 'ಚಡಚಣ (Chadchan Circle)', description: 'Chadchan Sugar Basin Zone', village_count: 7, shareholder_count: 2600, total_shares: 13000 },
    { circle_id: 'CIR-003', name: 'ಬಳ್ಳೊಳ್ಳಿ (Ballolli Circle)', description: 'Ballolli Sugarcane Belt', village_count: 6, shareholder_count: 2400, total_shares: 12000 },
    { circle_id: 'CIR-004', name: 'ಅಥರ್ಗಾ (Atharga Circle)', description: 'Atharga Agricultural Division', village_count: 6, shareholder_count: 2300, total_shares: 11500 },
    { circle_id: 'CIR-005', name: 'ಹೊರ್ತಿ (Horti Circle)', description: 'Horti Irrigated Basin', village_count: 6, shareholder_count: 2200, total_shares: 11000 },
    { circle_id: 'CIR-006', name: 'ಲಚ್ಯಾಣ (Lachyan Circle)', description: 'Lachyan Railway Belt', village_count: 6, shareholder_count: 2100, total_shares: 10500 },
    { circle_id: 'CIR-007', name: 'ಸಾಲೋಟಗಿ (Salotgi Circle)', description: 'Salotgi Historical Zone', village_count: 6, shareholder_count: 2000, total_shares: 10000 },
    { circle_id: 'CIR-008', name: 'ಹಲಸಂಗಿ (Halasangi Circle)', description: 'Halasangi Border Belt', village_count: 5, shareholder_count: 1800, total_shares: 9000 }
  ];

  // Villages / Places in Vijayapura District
  const placesList = [
    { name: 'ಬಳ್ಳೊಳ್ಳಿ', taluk: 'ಇಂಡಿ', circle: 'ಬಳ್ಳೊಳ್ಳಿ (Ballolli Circle)', pin: '586 117' },
    { name: 'ಜೇವೂರ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' },
    { name: 'ಚಡಚಣ', taluk: 'ಚಡಚಣ', circle: 'ಚಡಚಣ (Chadchan Circle)', pin: '586 205' },
    { name: 'ಅಥರ್ಗಾ', taluk: 'ಇಂಡಿ', circle: 'ಅಥರ್ಗಾ (Atharga Circle)', pin: '586 112' },
    { name: 'ಹಿರೇಬೇವನೂರ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' },
    { name: 'ಲೋಣಿ ಬಿ.ಕೆ.', taluk: 'ಇಂಡಿ', circle: 'ಬಳ್ಳೊಳ್ಳಿ (Ballolli Circle)', pin: '586 211' },
    { name: 'ತಡವಲಗಾ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 211' },
    { name: 'ಅಂಜುಟಗಿ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' },
    { name: 'ಹೊರ್ತಿ', taluk: 'ಇಂಡಿ', circle: 'ಹೊರ್ತಿ (Horti Circle)', pin: '586 117' },
    { name: 'ಲಚ್ಯಾಣ', taluk: 'ಇಂಡಿ', circle: 'ಲಚ್ಯಾಣ (Lachyan Circle)', pin: '586 211' },
    { name: 'ಸಾಲೋಟಗಿ', taluk: 'ಇಂಡಿ', circle: 'ಸಾಲೋಟಗಿ (Salotgi Circle)', pin: '586 217' },
    { name: 'ನಿಂಬಾಳ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 211' },
    { name: 'ಶಿರಾಡೋಣ', taluk: 'ಚಡಚಣ', circle: 'ಚಡಚಣ (Chadchan Circle)', pin: '586 205' },
    { name: 'ಹಲಸಂಗಿ', taluk: 'ಚಡಚಣ', circle: 'ಹಲಸಂಗಿ (Halasangi Circle)', pin: '586 205' },
    { name: 'ಧೂಳಖೇಡ', taluk: 'ಚಡಚಣ', circle: 'ಚಡಚಣ (Chadchan Circle)', pin: '586 205' },
    { name: 'ಉಮರಾಣಿ', taluk: 'ಚಡಚಣ', circle: 'ಚಡಚಣ (Chadchan Circle)', pin: '586 205' },
    { name: 'ರೋಡಗಿ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' },
    { name: 'ತಮದಡ್ಡಿ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' },
    { name: 'ದೇವರ ನಿಂಬರಗಿ', taluk: 'ಚಡಚಣ', circle: 'ಚಡಚಣ (Chadchan Circle)', pin: '586 205' },
    { name: 'ಇಂಡಿ ಗ್ರಾಮೀಣ', taluk: 'ಇಂಡಿ', circle: 'ಇಂಡಿ (Indi Circle)', pin: '586 112' }
  ];

  mockVillages = placesList.map((p, idx) => ({
    village_id: `VIL-${String(idx + 1).padStart(3, '0')}`,
    name: p.name,
    taluk: p.taluk,
    district: 'ವಿಜಯಪುರ',
    circle_name: p.circle,
    circle_id: `CIR-${String((idx % 8) + 1).padStart(3, '0')}`,
    pin_code: p.pin,
    status: 'Active',
    shareholder_count: 860,
    total_shares: 4300
  }));

  // 1. EXACT REAL RECORDS PROVIDED BY USER
  const initialRealRecords = [
    {
      book_no: 'B.No: 1',
      sl_no: 1,
      share_no: '1',
      shareholder_name: 'ಬೀರಪ್ಪ ಕಾಮಣ್ಣ ಸಗಾಯಿ',
      gender: 'M',
      aadhaar_card_no: '4582 9981 1234',
      reg_date: '10/Aug/1982',
      receipt_no: '1',
      receipt_amount: 2000,
      date: '10/Aug/1982',
      reciept: '1',
      amount: 2000,
      total_amount: 2000,
      number_of_shares: 1,
      schedule_cast: 'ಅ - ವರ್ಗ',
      address: 'ಬಳ್ಳೊಳ್ಳಿ ಗ್ರಾಮ, ಶ್ರೀ ಹನುಮಾನ್ ದೇವಸ್ಥಾನದ ಹತ್ತಿರ',
      nagara: 'ಗ್ರಾಮ ಠಾಣಾ',
      road: 'ಮುಖ್ಯ ರಸ್ತೆ',
      place: 'ಬಳ್ಳೊಳ್ಳಿ',
      taluk: 'ಇಂಡಿ',
      district: 'ವಿಜಯಪುರ',
      pin_code: '586 117',
      circle: 'ಇಂಡಿ',
      member_type: 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)',
      relationship: 'ಸ್ವಂತ (Self)',
      tharava_date: '10/Aug/1982',
      tharava_no: 'TR-01/1982',
      mobile_no: '9845012341',
      photo_url: '',
      signature_url: '',
      thumb_url: '',
      photo_updated: 'Yes',
      signature_updated: 'Yes',
      thumb_updated: 'Yes',
      nominee_name: 'ಕಾಮಣ್ಣ ಬೀರಪ್ಪ ಸಗಾಯಿ',
      nominee_aadhaar_no: '4582 9981 5566',
      nominee_mobile_no: '9845012342',
      nominee_address: 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'
    },
    {
      book_no: 'B.No: 1',
      sl_no: 2,
      share_no: '2',
      shareholder_name: 'ರಮೇಶ ವೆಂಕಟೇಶ ಪುರಾಣಿಕ',
      gender: 'M',
      aadhaar_card_no: '7890 1234 5678',
      reg_date: '10/Aug/1982',
      receipt_no: '2',
      receipt_amount: 1000,
      date: '10/Aug/1982',
      reciept: '2',
      amount: 1000,
      total_amount: 2000,
      number_of_shares: 1,
      schedule_cast: 'ಅ - ವರ್ಗ',
      address: 'ಬಳ್ಳೊಳ್ಳಿ ಅಗಸಿ ಹತ್ತಿರ, ಇಂಡಿ ರಸ್ತೆ',
      nagara: 'ಬ್ರಾಹ್ಮಣ ಗಲ್ಲಿ',
      road: 'ದೇವಸ್ಥಾನ ರಸ್ತೆ',
      place: 'ಬಳ್ಳೊಳ್ಳಿ',
      taluk: 'ಇಂಡಿ',
      district: 'ವಿಜಯಪುರ',
      pin_code: '586 117',
      circle: 'ಇಂಡಿ',
      member_type: 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)',
      relationship: 'ಸ್ವಂತ (Self)',
      tharava_date: '10/Aug/1982',
      tharava_no: 'TR-02/1982',
      mobile_no: '9845012343',
      photo_url: '',
      signature_url: '',
      thumb_url: '',
      photo_updated: 'Yes',
      signature_updated: 'Yes',
      thumb_updated: 'Yes',
      nominee_name: 'ವೆಂಕಟೇಶ ರಮೇಶ ಪುರಾಣಿಕ',
      nominee_aadhaar_no: '7890 1234 9900',
      nominee_mobile_no: '9845012344',
      nominee_address: 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'
    },
    {
      book_no: 'B.No: 1',
      sl_no: 3,
      share_no: '3',
      shareholder_name: 'ಬಾಬುರಾವ ಅಪ್ಪಾರಾವ ಪಾಟೀಲ',
      gender: 'M',
      aadhaar_card_no: '3456 7890 1234',
      reg_date: '10/Aug/1982',
      receipt_no: '3',
      receipt_amount: 1000,
      date: '10/Aug/1982',
      reciept: '3',
      amount: 1000,
      total_amount: 2000,
      number_of_shares: 1,
      schedule_cast: 'ಅ - ವರ್ಗ',
      address: 'ಜೇವೂರ ಗ್ರಾಮ, ಮುಖ್ಯ ಚೌಕ್',
      nagara: 'ಪಾಟೀಲ ಗಲ್ಲಿ',
      road: 'ಬಸ್ ನಿಲ್ದಾಣ ರಸ್ತೆ',
      place: 'ಜೇವೂರ',
      taluk: 'ಇಂಡಿ',
      district: 'ವಿಜಯಪುರ',
      pin_code: '586 112',
      circle: 'ಇಂಡಿ',
      member_type: 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)',
      relationship: 'ಸ್ವಂತ (Self)',
      tharava_date: '10/Aug/1982',
      tharava_no: 'TR-03/1982',
      mobile_no: '9845012345',
      photo_url: '',
      signature_url: '',
      thumb_url: '',
      photo_updated: 'Yes',
      signature_updated: 'Yes',
      thumb_updated: 'Yes',
      nominee_name: 'ಅಪ್ಪಾರಾವ ಬಾಬುರಾವ ಪಾಟೀಲ',
      nominee_aadhaar_no: '3456 7890 9988',
      nominee_mobile_no: '9845012346',
      nominee_address: 'ಜೇವೂರ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'
    },
    {
      book_no: 'B.No: 1',
      sl_no: 4,
      share_no: '4',
      shareholder_name: 'ಮಲ್ಲನಗೌಡ ರಾಮಚಂದ್ರ ಪಾಟೀಲ',
      gender: 'M',
      aadhaar_card_no: '5678 9012 3456',
      reg_date: '10/Aug/1982',
      receipt_no: '4',
      receipt_amount: 2000,
      date: '10/Aug/1982',
      reciept: '4',
      amount: 2000,
      total_amount: 8000,
      number_of_shares: 4,
      schedule_cast: 'ಅ - ವರ್ಗ',
      address: 'ಬಳ್ಳೊಳ್ಳಿ ತೋಟದ ವಸ್ತಿ, ಕಾಲುವೆ ಹತ್ತಿರ',
      nagara: 'ರೈತ ನಗರ',
      road: 'ಹೊಲದ ರಸ್ತೆ',
      place: 'ಬಳ್ಳೊಳ್ಳಿ',
      taluk: 'ಇಂಡಿ',
      district: 'ವಿಜಯಪುರ',
      pin_code: '586 117',
      circle: 'ಇಂಡಿ',
      member_type: 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)',
      relationship: 'ಸ್ವಂತ (Self)',
      tharava_date: '10/Aug/1982',
      tharava_no: 'TR-04/1982',
      mobile_no: '9845012347',
      photo_url: '',
      signature_url: '',
      thumb_url: '',
      photo_updated: 'Yes',
      signature_updated: 'Yes',
      thumb_updated: 'Yes',
      nominee_name: 'ರಾಮಚಂದ್ರ ಮಲ್ಲನಗೌಡ ಪಾಟೀಲ',
      nominee_aadhaar_no: '5678 9012 1122',
      nominee_mobile_no: '9845012348',
      nominee_address: 'ಬಳ್ಳೊಳ್ಳಿ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'
    },
    {
      book_no: 'B.No: 1',
      sl_no: 5,
      share_no: '6',
      shareholder_name: 'ಡಾ|| ಇಮ್ಮಾನುವೆ ಸಾಸವೇಲ ಕಟವಟೆ',
      gender: 'M',
      aadhaar_card_no: '9012 3456 7890',
      reg_date: '10/Aug/1982',
      receipt_no: '6',
      receipt_amount: 25000,
      date: '10/Aug/1982',
      reciept: '6',
      amount: 25000,
      total_amount: 29000,
      number_of_shares: 14,
      schedule_cast: 'ಅ - ವರ್ಗ',
      address: 'ಚಡಚಣ ಮೇನ್ ಬಜಾರ್, ಕ್ಲಿನಿಕ್ ಎದುರು',
      nagara: 'ವೈದ್ಯರ ಓಣಿ',
      road: 'ಹಾಸ್ಪಿಟಲ್ ರಸ್ತೆ',
      place: 'ಚಡಚಣ',
      taluk: 'ಚಡಚಣ',
      district: 'ವಿಜಯಪುರ',
      pin_code: '586 205',
      circle: 'ಚಡಚಣ',
      member_type: 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)',
      relationship: 'ಸ್ವಂತ (Self)',
      tharava_date: '10/Aug/1982',
      tharava_no: 'TR-05/1982',
      mobile_no: '9845012349',
      photo_url: '',
      signature_url: '',
      thumb_url: '',
      photo_updated: 'Yes',
      signature_updated: 'Yes',
      thumb_updated: 'Yes',
      nominee_name: 'ಸಾಸವೇಲ ಇಮ್ಮಾನುವೆ ಕಟವಟೆ',
      nominee_aadhaar_no: '9012 3456 3344',
      nominee_mobile_no: '9845012350',
      nominee_address: 'ಚಡಚಣ, ತಾ: ಚಡಚಣ, ಜಿ: ವಿಜಯಪುರ'
    },
    {
      book_no: 'B.No: 1',
      sl_no: 6,
      share_no: '7',
      shareholder_name: 'ಎಸ್ ಎಂ ಕುಂಬಾಳ',
      gender: 'M',
      aadhaar_card_no: '2345 6789 0123',
      reg_date: '15/Aug/1982',
      receipt_no: '8',
      receipt_amount: 2000,
      date: '15/Aug/1982',
      reciept: '8',
      amount: 2000,
      total_amount: 2000,
      number_of_shares: 1,
      schedule_cast: 'ಅ - ವರ್ಗ',
      address: 'ಅಥರ್ಗಾ ರಸ್ತೆ, ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ ಹತ್ತಿರ',
      nagara: 'ಕುಂಬಾರ ಗಲ್ಲಿ',
      road: 'ಕಾಲೇಜು ರಸ್ತೆ',
      place: 'ಅಥರ್ಗಾ',
      taluk: 'ಇಂಡಿ',
      district: 'ವಿಜಯಪುರ',
      pin_code: '586 112',
      circle: 'ಇಂಡಿ',
      member_type: 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)',
      relationship: 'ಸ್ವಂತ (Self)',
      tharava_date: '15/Aug/1982',
      tharava_no: 'TR-06/1982',
      mobile_no: '9845012351',
      photo_url: '',
      signature_url: '',
      thumb_url: '',
      photo_updated: 'Yes',
      signature_updated: 'Yes',
      thumb_updated: 'Yes',
      nominee_name: 'ಮಲ್ಲಿಕಾರ್ಜುನ ಕುಂಬಾಳ',
      nominee_aadhaar_no: '2345 6789 7788',
      nominee_mobile_no: '9845012352',
      nominee_address: 'ಅಥರ್ಗಾ, ತಾ: ಇಂಡಿ, ಜಿ: ವಿಜಯಪುರ'
    }
  ];

  // Insert initial real records
  initialRealRecords.forEach((r, idx) => {
    mockShareholders.push({
      id: idx + 1,
      shareholder_id: `SH-${String(idx + 1).padStart(5, '0')}`,
      name: r.shareholder_name,
      father_husband_name: r.nominee_name,
      dob: '1960-05-15',
      gender: r.gender,
      mobile: r.mobile_no,
      address: r.address,
      village_id: `VIL-${String((idx % mockVillages.length) + 1).padStart(3, '0')}`,
      village_name: r.place,
      circle_id: `CIR-${String((idx % mockCircles.length) + 1).padStart(3, '0')}`,
      circle_name: r.circle,
      share_number: `SN-${r.share_no}`,
      number_of_shares: r.number_of_shares,
      share_value: r.total_amount,
      status: 'Active',
      registration_date: r.reg_date,
      aadhaar_ref: r.aadhaar_card_no,
      remarks: 'Founding Member Shareholder (ಅ - ವರ್ಗ)',
      // 38 Official Statutory Cooperative Columns:
      book_no: r.book_no,
      sl_no: r.sl_no,
      share_no: r.share_no,
      shareholder_name: r.shareholder_name,
      aadhaar_card_no: r.aadhaar_card_no,
      reg_date: r.reg_date,
      receipt_no: r.receipt_no,
      receipt_amount: r.receipt_amount,
      date: r.date,
      reciept: r.reciept,
      amount: r.amount,
      total_amount: r.total_amount,
      schedule_cast: r.schedule_cast,
      nagara: r.nagara,
      road: r.road,
      place: r.place,
      taluk: r.taluk,
      district: r.district,
      pin_code: r.pin_code,
      circle: r.circle,
      member_type: r.member_type,
      relationship: r.relationship,
      tharava_date: r.tharava_date,
      tharava_no: r.tharava_no,
      mobile_no: r.mobile_no,
      photo_url: r.photo_url,
      signature_url: r.signature_url,
      thumb_url: r.thumb_url,
      photo_updated: r.photo_updated,
      signature_updated: r.signature_updated,
      thumb_updated: r.thumb_updated,
      nominee_name: r.nominee_name,
      nominee_aadhaar_no: r.nominee_aadhaar_no,
      nominee_mobile_no: r.nominee_mobile_no,
      nominee_address: r.nominee_address
    });
  });

  // Authentic Karnataka Farmer First & Last Names
  const knFirstNames = ['ಬಸವರಾಜ', 'ಮಲ್ಲಿಕಾರ್ಜುನ', 'ಶಿವಾನಂದ', 'ಸಿದ್ದರಾಮ', 'ಚನ್ನಪ್ಪ', 'ಸಂಗಪ್ಪ', 'ಈಶ್ವರಪ್ಪ', 'ಗುರುಲಿಂಗಪ್ಪ', 'ರಾಮಚಂದ್ರ', 'ಶಂಕರಪ್ಪ', 'ಪ್ರಭುಗೌಡ', 'ಮಹಾದೇವ', 'ಬಸಲಿಂಗಪ್ಪ', 'ದೇವಿಂದ್ರಪ್ಪ', 'ಆನಂದರಾವ್', 'ಕಾಶಿನಾಥ', 'ನಿಂಗಪ್ಪ', 'ಮಲ್ಲಪ್ಪ', 'ಕಲ್ಲಪ್ಪ', 'ರುದ್ರಪ್ಪ'];
  const knLastNames = ['ಪಾಟೀಲ', 'ಬಿರಾದಾರ', 'ದೇಸಾಯಿ', 'ಹಿರೇಮಠ', 'ಪೂಜಾರಿ', 'ಕುಂಬಾರ', 'ಗೋನಾಳ', 'ಕಲಾದಗಿ', 'ಕಟಗೇರಿ', 'ಮಲಘಾಣ', 'ಬಾಗೇವಾಡಿ', 'ಬಾಗವಾನ', 'ತಳವಾರ', 'ನಾಡಗೌಡ', 'ಕೋಳಿ', 'ದೊಡಮನಿ', 'ಹೊಸಮನಿ', 'ಹಡಪದ', 'ಬಡಿಗೇರ', 'ಕೋಟ್ಯಾಳ'];
  const classes = ['ಅ - ವರ್ಗ', 'ಅ - ವರ್ಗ', 'ಅ - ವರ್ಗ', 'ಬ - ವರ್ಗ', 'ಕ - ವರ್ಗ'];

  const TOTAL = 17250;
  for (let i = 7; i <= TOTAL; i++) {
    const fn = knFirstNames[i % knFirstNames.length];
    const ln = knLastNames[(i * 3) % knLastNames.length];
    const fullName = `${fn} ${ln}`;
    const pObj = placesList[i % placesList.length];
    const shares = i % 10 === 0 ? 14 : i % 5 === 0 ? 4 : i % 2 === 0 ? 2 : 1;
    const totalAmt = shares * 2000;
    const bookIdx = Math.floor((i - 1) / 500) + 1;
    const bookNo = `B.No: ${bookIdx}`;
    const slNo = ((i - 1) % 500) + 1;
    const shareNo = String(i);
    const regYear = 1982 + (i % 42);
    const regDate = `1${i % 9}/Aug/${regYear}`;
    const mobile = `9845${String(100000 + (i % 899999))}`;
    const aadhaar = `${String(2000 + (i % 7999))} ${String(1000 + (i % 8999))} ${String(1000 + (i % 8999))}`;
    const shClass = classes[i % classes.length];

    mockShareholders.push({
      id: i,
      shareholder_id: `SH-${String(i).padStart(5, '0')}`,
      name: fullName,
      father_husband_name: `${knFirstNames[(i + 3) % knFirstNames.length]} ${ln}`,
      dob: `197${i % 10}-05-15`,
      gender: i % 12 === 0 ? 'F' : 'M',
      mobile: mobile,
      address: `${pObj.name} ಗ್ರಾಮ, ${ln} ಓಣಿ, ತಾ: ${pObj.taluk}`,
      village_id: `VIL-${String((i % mockVillages.length) + 1).padStart(3, '0')}`,
      village_name: pObj.name,
      circle_id: `CIR-${String((i % mockCircles.length) + 1).padStart(3, '0')}`,
      circle_name: pObj.circle,
      share_number: `SN-${shareNo}`,
      number_of_shares: shares,
      share_value: totalAmt,
      status: i % 40 === 0 ? 'Inactive' : 'Active',
      registration_date: regDate,
      aadhaar_ref: aadhaar,
      remarks: `ಸಹಕಾರಿ ಸಂಘದ ಸದಸ್ಯರು (${shClass})`,
      // 38 Official Ledger Columns:
      book_no: bookNo,
      sl_no: slNo,
      share_no: shareNo,
      shareholder_name: fullName,
      aadhaar_card_no: aadhaar,
      reg_date: regDate,
      receipt_no: String(i),
      receipt_amount: 2000,
      date: regDate,
      reciept: String(i),
      amount: 2000,
      total_amount: totalAmt,
      schedule_cast: shClass,
      nagara: 'ಗ್ರಾಮ ಠಾಣಾ',
      road: 'ಮುಖ್ಯ ರಸ್ತೆ',
      place: pObj.name,
      taluk: pObj.taluk,
      district: 'ವಿಜಯಪುರ',
      pin_code: pObj.pin,
      circle: pObj.circle,
      member_type: 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)',
      relationship: 'ಸ್ವಂತ (Self)',
      tharava_date: regDate,
      tharava_no: `TR-${String(i % 50 + 1).padStart(2, '0')}/${regYear}`,
      mobile_no: mobile,
      photo_url: '',
      signature_url: '',
      thumb_url: '',
      photo_updated: i % 3 === 0 ? 'Yes' : 'No',
      signature_updated: i % 2 === 0 ? 'Yes' : 'No',
      thumb_updated: 'Yes',
      nominee_name: `${knFirstNames[(i + 4) % knFirstNames.length]} ${fullName}`,
      nominee_aadhaar_no: `${String(3000 + (i % 6999))} ${String(2000 + (i % 7999))} ${String(3000 + (i % 6999))}`,
      nominee_mobile_no: `9845${String(200000 + (i % 799999))}`,
      nominee_address: `${pObj.name}, ತಾ: ${pObj.taluk}, ಜಿ: ವಿಜಯಪುರ`
    });

    if (i <= 500 && i % 4 === 0) {
      mockTransactions.push({
        id: i,
        transaction_id: `TX-${100000 + i}`,
        shareholder_id: `SH-${String(i).padStart(5, '0')}`,
        shareholder_name: fullName,
        date: `2025-0${(i % 8) + 1}-10`,
        type: 'Purchase',
        share_number: `SN-${shareNo}`,
        number_of_shares: shares,
        amount: totalAmt,
        tx_kind: 'Credit',
        reference_no: `REC-${i}`,
        payment_mode: 'Bank Transfer',
        remarks: 'Share Capital Allotment Receipt',
        entered_by: 'cashier'
      });
    }

    if (i <= 300 && i % 3 === 0) {
      const qty = shares * 15;
      mockSugarAllotments.push({
        id: i,
        allotment_id: `SA-${10000 + i}`,
        shareholder_id: `SH-${String(i).padStart(5, '0')}`,
        shareholder_name: fullName,
        share_number: `SN-${shareNo}`,
        number_of_shares: shares,
        village_name: pObj.name,
        circle_name: pObj.circle,
        allotment_date: '2025-10-01',
        sugar_quantity_kg: qty,
        sugar_type: 'M30 Grade White Sugar',
        allotment_period: 'Season 2025-2026',
        issued_quantity_kg: qty / 2,
        remaining_quantity_kg: qty / 2,
        status: 'Partially Issued',
        remarks: 'Annual Member Sugar Issue',
        entered_by: 'operator'
      });
    }
  }

  // Varasa Transfers
  for (let j = 1; j <= 50; j++) {
    const sh = mockShareholders[j * 20];
    mockVarasaTransfers.push({
      id: j,
      transfer_id: `VAR-${1000 + j}`,
      existing_shareholder_id: sh.shareholder_id,
      existing_shareholder_name: sh.shareholder_name || sh.name,
      existing_share_number: sh.share_no || sh.share_number,
      existing_shares: sh.number_of_shares,
      heir_name: sh.nominee_name || `ವಾರಸುದಾರ ${sh.name}`,
      heir_relationship: j % 2 === 0 ? 'ಮಗ (Son)' : 'ಪತ್ನಿ (Wife)',
      heir_mobile: sh.nominee_mobile_no || `9845${String(500000 + j)}`,
      heir_address: sh.address,
      heir_village_id: sh.village_id,
      heir_circle_id: sh.circle_id,
      village_name: sh.place || sh.village_name,
      circle_name: sh.circle || sh.circle_name,
      application_date: `2025-11-${String((j % 25) + 1).padStart(2, '0')}`,
      approval_status: j % 5 === 0 ? 'Completed' : j % 3 === 0 ? 'Approved' : 'Under Verification',
      documents_verified: 'Verified',
      remarks: 'ಗ್ರಾಮ ಪಂಚಾಯತಿ ಮರಣ ಪ್ರಮಾಣಪತ್ರ ಹಾಗೂ ವಾರಸುದಾರ ಅಫಿಡವಿಟ್ ಲಗತ್ತಿಸಲಾಗಿದೆ',
      processed_by: 'operator'
    });
  }

  // Employees
  for (let e = 1; e <= 20; e++) {
    mockEmployees.push({
      id: e,
      employee_id: `EMP-${String(e).padStart(3, '0')}`,
      name: `ಸಿಬ್ಬಂದಿ ${knFirstNames[e % knFirstNames.length]} ${knLastNames[e % knLastNames.length]}`,
      designation: e % 2 === 0 ? 'ಕಬ್ಬು ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ (Cane Inspector)' : 'ಮುಖ್ಯ ಲೆಕ್ಕಾಧಿಕಾರಿ (Chief Accountant)',
      department: e % 3 === 0 ? 'ಲೆಕ್ಕಪತ್ರ ವಿಭಾಗ (Finance)' : 'ಕಬ್ಬು ಸಂಗ್ರಹಣಾ ವಿಭಾಗ (Procurement)',
      mobile: `984500112${e}`,
      address: `ಸಹಕಾರಿ ಸಂಘದ ಕ್ವಾರ್ಟರ್ಸ್ #${e}, ಇಂಡಿ`,
      joining_date: '2021-04-01',
      status: 'Active',
      role: 'Employee'
    });
  }

  console.log('✅ Client dataset ready with 38 statutory columns!');
}

generateMockDataset();

// Helper API execution with auto backend failover
async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-User': localStorage.getItem('sugar_erp_username') || 'admin',
        ...options.headers
      },
      ...options
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Backend offline -> Fallback to client data engine seamlessly
  }
  return null;
}

export const ApiService = {
  async getDashboardStats() {
    const apiRes = await fetchApi('/dashboard/stats');
    if (apiRes && apiRes.success) return apiRes;

    return {
      success: true,
      stats: {
        totalShareholders: mockShareholders.length,
        activeShareholders: mockShareholders.filter(s => s.status === 'Active').length,
        inactiveShareholders: mockShareholders.filter(s => s.status === 'Inactive').length,
        totalShares: mockShareholders.reduce((acc, s) => acc + s.number_of_shares, 0),
        totalVillages: mockVillages.length,
        totalCircles: mockCircles.length,
        pendingVarasa: mockVarasaTransfers.filter(v => v.approval_status !== 'Completed').length,
        completedVarasa: mockVarasaTransfers.filter(v => v.approval_status === 'Completed').length,
        todayTx: mockTransactions.length,
        todayAttendance: 48,
        totalSugarAlloted: 258750,
        totalEmployees: mockEmployees.length
      },
      charts: {
        shareholdersByVillage: mockVillages.slice(0, 8).map(v => ({ village_name: v.name, total: v.shareholder_count })),
        shareholdersByCircle: mockCircles.map(c => ({ circle_name: c.name, total: c.shareholder_count })),
        shareRange: [
          { range: '1 Share (ಅ)', count: 9200 },
          { range: '2-4 Shares', count: 5500 },
          { range: '5-10 Shares', count: 1800 },
          { range: '14+ Shares', count: 750 }
        ],
        varasaStatusBreakdown: [
          { status: 'Application Received', count: 12 },
          { status: 'Under Verification', count: 18 },
          { status: 'Approved', count: 10 },
          { status: 'Completed', count: 10 }
        ]
      }
    };
  },

  async getShareholders({ page = 1, limit = 20, search = '', village_id = '', circle_id = '', status = '', book_no = '' }) {
    const apiRes = await fetchApi(`/shareholders?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&village_id=${village_id}&circle_id=${circle_id}&status=${status}&book_no=${book_no}`);
    if (apiRes && apiRes.success) return apiRes;

    let filtered = mockShareholders;
    if (search) {
      const q = search.trim().toLowerCase().normalize('NFC');
      filtered = filtered.filter(s => {
        const shName = (s.shareholder_name || s.name || '').toLowerCase().normalize('NFC');
        const shId = (s.shareholder_id || '').toLowerCase();
        const shNo = (s.share_no || s.share_number || '').toLowerCase();
        const bNo = (s.book_no || '').toLowerCase();
        const mob = (s.mobile_no || s.mobile || '');
        const aadh = (s.aadhaar_card_no || s.aadhaar_ref || '');
        const plc = (s.place || s.village_name || '').toLowerCase().normalize('NFC');
        const tlk = (s.taluk || '').toLowerCase().normalize('NFC');
        const cir = (s.circle || s.circle_name || '').toLowerCase().normalize('NFC');
        const nom = (s.nominee_name || '').toLowerCase().normalize('NFC');

        return shName.includes(q) ||
          shId.includes(q) ||
          shNo.includes(q) ||
          bNo.includes(q) ||
          mob.includes(q) ||
          aadh.includes(q) ||
          plc.includes(q) ||
          tlk.includes(q) ||
          cir.includes(q) ||
          nom.includes(q);
      });
    }
    if (village_id) {
      filtered = filtered.filter(s => s.village_id === village_id || s.place === village_id);
    }
    if (circle_id) {
      filtered = filtered.filter(s => s.circle_id === circle_id || s.circle === circle_id);
    }
    if (status) {
      filtered = filtered.filter(s => s.status === status);
    }
    if (book_no) {
      filtered = filtered.filter(s => s.book_no === book_no);
    }

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      success: true,
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getShareholderById(id) {
    const apiRes = await fetchApi(`/shareholders/${id}`);
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => s.shareholder_id === id || s.id === parseInt(id) || s.share_no === id);
    if (!sh) return { success: false, message: 'Not found' };

    const txs = mockTransactions.filter(t => t.shareholder_id === sh.shareholder_id);
    const allotments = mockSugarAllotments.filter(a => a.shareholder_id === sh.shareholder_id);
    const varasa = mockVarasaTransfers.filter(v => v.existing_shareholder_id === sh.shareholder_id);

    return {
      success: true,
      shareholder: sh,
      history: {
        transactions: txs,
        sugarAllotments: allotments,
        varasaHistory: varasa,
        attendance: [
          { date: '10/Aug/2025', status: 'Present', correction_remarks: 'ವಾರ್ಷಿಕ ಮಹಾಸಭೆ (AGM Meeting Attendance)' }
        ]
      }
    };
  },

  async addShareholder(data) {
    const apiRes = await fetchApi('/shareholders', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const nextId = mockShareholders.length + 1;
    const newSh = {
      id: nextId,
      shareholder_id: data.shareholder_id || `SH-${String(nextId).padStart(5, '0')}`,
      book_no: data.book_no || 'B.No: 1',
      sl_no: data.sl_no || nextId,
      share_no: data.share_no || String(nextId),
      shareholder_name: data.shareholder_name || data.name,
      name: data.shareholder_name || data.name,
      father_husband_name: data.father_husband_name || '',
      gender: data.gender || 'M',
      aadhaar_card_no: data.aadhaar_card_no || '',
      aadhaar_ref: data.aadhaar_card_no || '',
      reg_date: data.reg_date || new Date().toLocaleDateString('en-GB'),
      registration_date: data.reg_date || new Date().toLocaleDateString('en-GB'),
      receipt_no: data.receipt_no || String(nextId),
      receipt_amount: parseFloat(data.receipt_amount) || 2000,
      date: data.reg_date || new Date().toLocaleDateString('en-GB'),
      reciept: data.receipt_no || String(nextId),
      amount: parseFloat(data.receipt_amount) || 2000,
      total_amount: parseFloat(data.total_amount) || (parseFloat(data.number_of_shares) || 1) * 2000,
      number_of_shares: parseInt(data.number_of_shares) || 1,
      share_value: parseFloat(data.total_amount) || (parseFloat(data.number_of_shares) || 1) * 2000,
      schedule_cast: data.schedule_cast || 'ಅ - ವರ್ಗ',
      address: data.address || '',
      nagara: data.nagara || '',
      road: data.road || '',
      place: data.place || 'ಬಳ್ಳೊಳ್ಳಿ',
      village_name: data.place || 'ಬಳ್ಳೊಳ್ಳಿ',
      village_id: data.village_id || 'VIL-001',
      taluk: data.taluk || 'ಇಂಡಿ',
      district: data.district || 'ವಿಜಯಪುರ',
      pin_code: data.pin_code || '586 117',
      circle: data.circle || 'ಇಂಡಿ',
      circle_name: data.circle || 'ಇಂಡಿ',
      circle_id: data.circle_id || 'CIR-001',
      member_type: data.member_type || 'ಕಬ್ಬು ಬೆಳೆಗಾರ ಸದಸ್ಯ (Cane Grower)',
      relationship: data.relationship || 'ಸ್ವಂತ (Self)',
      tharava_date: data.tharava_date || data.reg_date || '',
      tharava_no: data.tharava_no || `TR-${nextId}/2026`,
      mobile_no: data.mobile_no || data.mobile || '',
      mobile: data.mobile_no || data.mobile || '',
      photo_url: data.photo_url || '',
      signature_url: data.signature_url || '',
      thumb_url: data.thumb_url || '',
      photo_updated: data.photo_updated || 'No',
      signature_updated: data.signature_updated || 'No',
      thumb_updated: data.thumb_updated || 'No',
      nominee_name: data.nominee_name || '',
      nominee_aadhaar_no: data.nominee_aadhaar_no || '',
      nominee_mobile_no: data.nominee_mobile_no || '',
      nominee_address: data.nominee_address || '',
      status: data.status || 'Active',
      remarks: data.remarks || ''
    };

    mockShareholders.unshift(newSh);
    return { success: true, shareholder_id: newSh.shareholder_id };
  },

  async getTransactions({ page = 1, limit = 20, search = '' }) {
    const apiRes = await fetchApi(`/transactions?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    if (apiRes && apiRes.success) return apiRes;

    let filtered = mockTransactions;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t => t.shareholder_id.toLowerCase().includes(q) || t.shareholder_name.toLowerCase().includes(q) || t.reference_no.toLowerCase().includes(q));
    }
    return {
      success: true,
      data: filtered.slice((page - 1) * limit, page * limit),
      pagination: { total: filtered.length, page, limit, totalPages: Math.ceil(filtered.length / limit) }
    };
  },

  async addTransaction(data) {
    const apiRes = await fetchApi('/transactions', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => s.shareholder_id === data.shareholder_id);
    const newTx = {
      id: mockTransactions.length + 1,
      transaction_id: `TX-${Date.now()}`,
      ...data,
      shareholder_name: sh ? (sh.shareholder_name || sh.name) : 'Shareholder',
      date: new Date().toISOString()
    };
    mockTransactions.unshift(newTx);
    return { success: true, transaction_id: newTx.transaction_id };
  },

  async getSugarAllotments({ page = 1, limit = 20, search = '' }) {
    const apiRes = await fetchApi(`/sugar-allotment?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    if (apiRes && apiRes.success) return apiRes;

    return {
      success: true,
      data: mockSugarAllotments.slice((page - 1) * limit, page * limit),
      pagination: { total: mockSugarAllotments.length, page, limit, totalPages: Math.ceil(mockSugarAllotments.length / limit) }
    };
  },

  async addSugarAllotment(data) {
    const apiRes = await fetchApi('/sugar-allotment', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => s.shareholder_id === data.shareholder_id);
    const newSa = {
      id: mockSugarAllotments.length + 1,
      allotment_id: `SA-${Date.now()}`,
      ...data,
      shareholder_name: sh ? (sh.shareholder_name || sh.name) : 'Shareholder',
      share_number: sh ? (sh.share_no || sh.share_number) : 'SN-1000',
      village_name: sh ? (sh.place || sh.village_name) : 'Gaon',
      remaining_quantity_kg: data.sugar_quantity_kg - (data.issued_quantity_kg || 0)
    };
    mockSugarAllotments.unshift(newSa);
    return { success: true, allotment_id: newSa.allotment_id };
  },

  async getVarasaTransfers() {
    const apiRes = await fetchApi('/varasa');
    if (apiRes && apiRes.success) return apiRes;

    return { success: true, data: mockVarasaTransfers };
  },

  async addVarasaTransfer(data) {
    const apiRes = await fetchApi('/varasa', { method: 'POST', body: JSON.stringify(data) });
    if (apiRes && apiRes.success) return apiRes;

    const sh = mockShareholders.find(s => s.shareholder_id === data.existing_shareholder_id);
    const newV = {
      id: mockVarasaTransfers.length + 1,
      transfer_id: `VAR-${Date.now()}`,
      ...data,
      existing_shareholder_name: sh ? (sh.shareholder_name || sh.name) : 'Existing Member',
      approval_status: 'Application Received',
      documents_verified: 'Pending'
    };
    mockVarasaTransfers.unshift(newV);
    return { success: true, transfer_id: newV.transfer_id };
  },

  async updateVarasaStatus(transfer_id, approval_status) {
    const apiRes = await fetchApi(`/varasa/${transfer_id}/status`, { method: 'PUT', body: JSON.stringify({ approval_status }) });
    if (apiRes && apiRes.success) return apiRes;

    const item = mockVarasaTransfers.find(v => v.transfer_id === transfer_id);
    if (item) item.approval_status = approval_status;
    return { success: true };
  },

  async getVillages() {
    const apiRes = await fetchApi('/villages');
    if (apiRes && apiRes.success) return apiRes;

    return { success: true, data: mockVillages };
  },

  async getCircles() {
    const apiRes = await fetchApi('/circles');
    if (apiRes && apiRes.success) return apiRes;

    return { success: true, data: mockCircles };
  },

  async getEmployees() {
    const apiRes = await fetchApi('/employees');
    if (apiRes && apiRes.success) return apiRes;

    return { success: true, data: mockEmployees };
  },

  async getAuditLogs() {
    const apiRes = await fetchApi('/audit-logs');
    if (apiRes && apiRes.success) return apiRes;

    return {
      success: true,
      data: [
        { id: 1, username: 'admin', role: 'Admin', module: 'Shareholder', action: 'CREATE', record_id: 'SH-00001', timestamp: '2026-10-16 10:15:00' },
        { id: 2, username: 'cashier', role: 'Cashier', module: 'Transactions', action: 'DEPOSIT', record_id: 'TX-100045', timestamp: '2026-10-16 11:30:00' },
        { id: 3, username: 'operator', role: 'Computer Operator', module: 'SugarAllotment', action: 'ISSUE', record_id: 'SA-10044', timestamp: '2026-10-16 12:45:00' }
      ]
    };
  }
};
