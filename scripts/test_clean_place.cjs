function cleanPlaceName(p) {
  if (!p || typeof p !== 'string') return '';
  let str = p.trim();
  // Strip parentheses content like (ಉಡಪಿ ತಾಲೂಕ, ದ.ಕ.) or (ಇಂಡಿ) or (ಸಿಂದಗಿ)
  str = str.replace(/\([^)]*\)/g, '').trim();
  // If comma separated like "186/3, ಲಕ್ಷ್ಮೀ ದೇವಾಲಯ ಹತ್ತಿರ, ಹಚ್ಚಾಳ"
  if (str.includes(',')) {
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);
    // Find last part that does not look like house number or landmark
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (!/^[\d\/\-\#\s]+$/.test(part) && !/ಹತ್ತಿರ|ಬಳಿ|ಎದುರು|ಹತ್ತರ|ಸಮೀಪ|near|opp/i.test(part)) {
        str = part;
        break;
      }
    }
  }
  // Strip leading house/plot numbers like "186/3 " or "No. 5 "
  str = str.replace(/^[\d\/\-\#\,\s]+/, '').trim();
  // Normalize Unicode
  str = str.normalize('NFC').trim();
  return str;
}

const testCases = [
  "186/3, ಲಕ್ಷ್ಮೀ ದೇವಾಲಯ ಹತ್ತಿರ, ಹಚ್ಚಾಳ",
  "186/3, ಲಕ್ಷ್ಮೀ ದೇವಾಲಯ ಹತ್ತಿರ, ಹಚ್ಚಾಳ (ಸಿಂದಗಿ)",
  "ಸಾಸ್ತಾನ (ಉಡಪಿ ತಾಲೂಕ, ದ.ಕ.)",
  "ಅಂಜುಟಗಿ (ಇಂಡಿ)",
  "ಅಂಜುಟಿಗಿ (ಇಂಡಿ) (163)",
  "ಅಗರಖೇಡ",
  "ಅರ್ಜುಣಗಿ ಕೆ ಡಿ",
  "ಅರ್ಜುಣಗಿ ಬಿ ಕೆ",
  "12-A, ಮುಖ್ಯ ರಸ್ತೆ, ಆಲಮೇಲ",
  "#45, ರಾಮ ಮಂದಿರ ಬಳಿ, ಬಬಲೇಶ್ವರ",
  " ಇಂಡಿ "
];

testCases.forEach(tc => {
  console.log(`"${tc}" -> "${cleanPlaceName(tc)}"`);
});
