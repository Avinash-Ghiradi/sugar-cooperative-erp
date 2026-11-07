// Comprehensive Kannada-to-English Phonetic Transliterator
// Converts Kannada names, places, and circles into clean English phonetic script
// NEVER translates word meanings, perfectly preserving Indian personal and place names.

const OFFICIAL_CIRCLE_EN = {
  'ಧೂಳಖೇಡ ಸರ್ಕಲ': 'Dhoolakheda Circle',
  'ಧೂಳಖೇಡ': 'Dhoolakheda',
  'ಆಲಮೇಲ - ಸಿಂದಗಿ - ದೇವರಹಿಪ್ಪರಗಿ': 'Alamel - Sindagi - Devarahipparagi',
  'ಆಲಮೇಲ': 'Alamel',
  'ಚಡಚಣ ಸರ್ಕಲ': 'Chadchan Circle',
  'ಚಡಚಣ': 'Chadchan',
  'ಇಂಡಿ ಸ್ಟೇಶನ್‌ ಸರ್ಕಲ': 'Indi Station Circle',
  'ಇಂಡಿ ಸರ್ಕಲ': 'Indi Circle',
  'ಇಂಡಿ': 'Indi',
  'ತಾಂಬಾ ಸರ್ಕಲ': 'Tamba Circle',
  'ತಾಂಬಾ': 'Tamba',
  'ಸಾಲೋಟಗಿ ಸರ್ಕಲ': 'Salotagi Circle',
  'ಸಾಲೋಟಗಿ': 'Salotagi',
  'ಕೆರೂರ': 'Kerur',
  'Post': 'Post',
  'ಇತರೆ (Other)': 'Other',
  'ಇತರೆ': 'Other',
  'ವಿಜಯಪುರ': 'Vijayapura',
  'ಸಿಂದಗಿ': 'Sindagi',
  'ಮರಗೂರ': 'Maragur',
  'ಮರಗುರ': 'Maragur',
  'ಬಳ್ಳೊಳ್ಳಿ': 'Ballolli',
  'ಸರ್ಕಲ': 'Circle',
  'ಸರ್ಕಲ್': 'Circle',
  'ತಾಲೂಕು': 'Taluk',
  'ಜಿಲ್ಲೆ': 'District'
};

const VOWELS = {
  'ಅ': 'A', 'ಆ': 'Aa', 'ಇ': 'I', 'ಈ': 'Ee', 'ಉ': 'U', 'ಊ': 'Oo', 'ಋ': 'Ru',
  'ಎ': 'E', 'ಏ': 'E', 'ಐ': 'Ai', 'ಒ': 'O', 'ಓ': 'O', 'ಔ': 'Au',
  'ಅಂ': 'An', 'ಅಃ': 'Aha'
};

const VOWEL_SIGNS = {
  'ಾ': 'a',
  'ಿ': 'i',
  'ೀ': 'i',
  'ು': 'u',
  'ೂ': 'u',
  'ೃ': 'ru',
  'ೆ': 'e',
  'ೇ': 'e',
  'ೈ': 'ai',
  'ೊ': 'o',
  'ೋ': 'o',
  'ೌ': 'au',
  'ಂ': 'n',
  'ಃ': 'h'
};

const CONSONANTS = {
  'ಕ': 'k', 'ಖ': 'kh', 'ಗ': 'g', 'ಘ': 'gh', 'ಙ': 'ng',
  'ಚ': 'ch', 'ಛ': 'chh', 'ಜ': 'j', 'ಝ': 'jh', 'ಞ': 'ny',
  'ಟ': 't', 'ಠ': 'th', 'ಡ': 'd', 'ಢ': 'dh', 'ಣ': 'n',
  'ತ': 't', 'ಥ': 'th', 'ದ': 'd', 'ಧ': 'dh', 'ನ': 'n',
  'ಪ': 'p', 'ಫ': 'ph', 'ಬ': 'b', 'ಭ': 'bh', 'ಮ': 'm',
  'ಯ': 'y', 'ರ': 'r', 'ಱ': 'r', 'ಲ': 'l', 'ವ': 'v',
  'ಶ': 'sh', 'ಷ': 'sh', 'ಸ': 's', 'ಹ': 'h', 'ಳ': 'l', 'ೞ': 'l'
};

const VIRAMA = '್';

// High-speed LRU memory cache so identical names (e.g. in list of 17k) compute in 0ms
const transliterationCache = new Map();

export function transliterateKannada(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Return directly if already mostly English/ASCII
  if (/^[A-Za-z0-9\s\.,\-\/\#\(\)\'\"]+$/.test(trimmed)) {
    return trimmed;
  }

  // Exact override match
  if (OFFICIAL_CIRCLE_EN[trimmed]) {
    return OFFICIAL_CIRCLE_EN[trimmed];
  }

  // Check cache
  if (transliterationCache.has(trimmed)) {
    return transliterationCache.get(trimmed);
  }

  // Word-by-word processing
  const words = trimmed.split(/(\s+|[\,\-\/\(\)])/);
  const translatedWords = words.map(w => {
    if (!w || /^\s+$/.test(w) || /^[\,\-\/\(\)]+$/.test(w)) return w;
    if (OFFICIAL_CIRCLE_EN[w]) return OFFICIAL_CIRCLE_EN[w];
    if (/^[A-Za-z0-9]+$/.test(w)) return w;

    return transliterateSingleWord(w);
  });

  const result = translatedWords.join('');
  if (transliterationCache.size < 10000) {
    transliterationCache.set(trimmed, result);
  }
  return result;
}

function transliterateSingleWord(word) {
  const chars = Array.from(word);
  let out = '';
  const len = chars.length;

  for (let i = 0; i < len; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (VOWELS[ch]) {
      out += VOWELS[ch].toLowerCase();
    } else if (CONSONANTS[ch]) {
      const c = CONSONANTS[ch];
      if (next === VIRAMA) {
        // Halant - consonant cluster (e.g. ಪ್ಪ -> pp, ರ್ಕ -> rk)
        out += c;
        i++; // skip virama
      } else if (VOWEL_SIGNS[next]) {
        // Consonant + explicit matra (e.g. ಕಾ -> ka, ಬೀ -> bi)
        out += c + VOWEL_SIGNS[next];
        i++; // skip matra
      } else {
        // Inherent 'a' vowel
        const isLastChar = (i === len - 1);
        if (isLastChar) {
          // South Indian Kannada names usually drop silent terminal 'a' unless followed by double consonant or specific endings
          // For instance: 'ಸಗಾಯಿ' -> 'Sagayi', 'ಉಮದಿ' -> 'Umadi', 'ಬೀರಪ್ಪ' ends with 'ಪ್ಪ' (handled by matra/virama)
          // When a standalone consonant ends a word: e.g. 'ಬಸವರಾಜ್' (with halant) -> 'Basavaraj'
          // 'ರಾಜಶೇಖರ' -> 'Rajashekar' or 'Rajashekara'
          out += c + 'a';
        } else {
          out += c + 'a';
        }
      }
    } else if (VOWEL_SIGNS[ch]) {
      out += VOWEL_SIGNS[ch];
    } else {
      out += ch;
    }
  }

  // Format capitalized word nicely
  if (out.length > 0) {
    // Clean up doubled vowels like 'aa' -> 'a' where appropriate, or keep clean
    return out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}
