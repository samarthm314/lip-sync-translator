/**
 * Phoneme mapping for lip-sync animation
 * Maps phonemes to viseme blend shapes
 */

// International Phonetic Alphabet (IPA) phonemes
export const PHONEMES = {
  // Vowels
  'i': 'EE',    // beet
  'ɪ': 'IH',    // bit
  'e': 'EH',    // bet
  'æ': 'AA',    // bat
  'ɑ': 'AA',    // father
  'ɔ': 'AW',    // bought
  'oʊ': 'OW',   // boat
  'ʊ': 'UH',    // book
  'u': 'UW',    // boot
  'ʌ': 'AH',    // but
  'ɜr': 'ER',   // bird
  'ər': 'ER',   // better
  
  // Consonants
  'p': 'PP',    // pen
  'b': 'BB',    // bad
  't': 'DD',    // tea
  'd': 'DD',    // dog
  'k': 'KK',    // key
  'g': 'GG',    // go
  'f': 'FF',    // fat
  'v': 'VV',    // van
  'θ': 'TH',    // thin
  'ð': 'TH',    // this
  's': 'SS',    // see
  'z': 'ZZ',    // zoo
  'ʃ': 'SH',    // ship
  'ʒ': 'ZH',    // vision
  'h': 'HH',    // hat
  'm': 'MM',    // man
  'n': 'NN',    // no
  'ŋ': 'NG',    // sing
  'l': 'LL',    // leg
  'r': 'RR',    // red
  'w': 'WW',    // wet
  'j': 'YY',    // yes
  
  // Spanish phonemes
  'x': 'HH',    // j in jalapeño
  'ɲ': 'NN',    // ñ in niño
  'ʎ': 'LL',    // ll in llave
  'ɾ': 'DD',    // r in pero
  'r': 'RR',    // rr in perro
};

// Viseme blend shape names (standard for most 3D models)
export const VISEMES = {
  'AA': 'viseme_aa', // Open mouth
  'IH': 'viseme_ih', // Slight open
  'EH': 'viseme_eh', // Open
  'AH': 'viseme_ah', // Open
  'AW': 'viseme_aw', // Open
  'OW': 'viseme_ow', // Open
  'UW': 'viseme_uw', // Closed
  'UH': 'viseme_uh', // Closed
  'ER': 'viseme_er', // Open
  'PP': 'viseme_pp', // Closed (p, b)
  'BB': 'viseme_bb', // Closed (p, b)
  'DD': 'viseme_dd', // Closed (t, d)
  'KK': 'viseme_kk', // Closed (k, g)
  'GG': 'viseme_gg', // Closed (k, g)
  'FF': 'viseme_ff', // Closed (f, v)
  'VV': 'viseme_vv', // Closed (f, v)
  'TH': 'viseme_th', // Closed (th)
  'SS': 'viseme_ss', // Closed (s, z)
  'ZZ': 'viseme_zz', // Closed (s, z)
  'SH': 'viseme_sh', // Closed (sh, zh)
  'ZH': 'viseme_zh', // Closed (sh, zh)
  'HH': 'viseme_hh', // Open (h)
  'MM': 'viseme_mm', // Closed (m)
  'NN': 'viseme_nn', // Closed (n, ng)
  'NG': 'viseme_ng', // Closed (n, ng)
  'LL': 'viseme_ll', // Closed (l)
  'RR': 'viseme_rr', // Closed (r)
  'WW': 'viseme_ww', // Closed (w)
  'YY': 'viseme_yy', // Closed (y)
  'REST': 'viseme_rest' // Neutral/closed
};

/**
 * Convert phoneme to viseme
 * @param {string} phoneme - IPA phoneme
 * @returns {string} Viseme blend shape name
 */
export function phonemeToViseme(phoneme) {
  const normalized = phoneme.toLowerCase();
  const viseme = PHONEMES[normalized];
  return viseme ? VISEMES[viseme] : VISEMES.REST;
}

/**
 * Convert text to phonemes using basic rules
 * This is a simplified version - in production, use a proper phonemizer
 * @param {string} text - Input text
 * @param {string} language - Language code ('en' or 'es')
 * @returns {Array} Array of phonemes
 */
export function textToPhonemes(text, language = 'en') {
  // Simplified English phoneme mapping
  const englishPhonemes = {
    'a': 'æ', 'e': 'e', 'i': 'ɪ', 'o': 'oʊ', 'u': 'u',
    'th': 'θ', 'sh': 'ʃ', 'ch': 'tʃ', 'ng': 'ŋ',
    'ar': 'ɑr', 'er': 'ər', 'or': 'ɔr'
  };
  
  // Simplified Spanish phoneme mapping
  const spanishPhonemes = {
    'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u',
    'ñ': 'ɲ', 'll': 'ʎ', 'rr': 'r', 'j': 'x'
  };
  
  const phonemeMap = language === 'es' ? spanishPhonemes : englishPhonemes;
  const words = text.toLowerCase().split(/\s+/);
  const phonemes = [];
  
  for (const word of words) {
    // Simple character-by-character mapping
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const nextChar = word[i + 1];
      const twoChar = char + nextChar;
      
      if (phonemeMap[twoChar]) {
        phonemes.push(phonemeMap[twoChar]);
        i++; // Skip next character
      } else if (phonemeMap[char]) {
        phonemes.push(phonemeMap[char]);
      } else {
        // Default to character itself
        phonemes.push(char);
      }
    }
    phonemes.push(' '); // Word boundary
  }
  
  return phonemes.filter(p => p !== ' ');
}

/**
 * Generate viseme sequence from text
 * @param {string} text - Input text
 * @param {string} language - Language code
 * @returns {Array} Array of viseme objects with timing
 */
export function generateVisemeSequence(text, language = 'en') {
  const phonemes = textToPhonemes(text, language);
  const visemes = [];
  
  for (const phoneme of phonemes) {
    const viseme = phonemeToViseme(phoneme);
    visemes.push({
      phoneme,
      viseme,
      duration: 0.1 // Default duration in seconds
    });
  }
  
  return visemes;
} 