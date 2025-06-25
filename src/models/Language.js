/**
 * Language configuration models
 */

export const SUPPORTED_LANGUAGES = {
  'en': {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    sttModel: 'whisper-en',
    ttsVoice: 'en-US',
    sampleText: 'Hello, how are you today?'
  },
  'es': {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
    sttModel: 'whisper-es',
    ttsVoice: 'es-ES',
    sampleText: 'Hola, ¿cómo estás hoy?'
  },
  'fr': {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
    sttModel: 'whisper-fr',
    ttsVoice: 'fr-FR',
    sampleText: 'Bonjour, comment allez-vous aujourd\'hui?'
  }
};

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.en;

/**
 * Language pair configuration for translation
 */
export const LANGUAGE_PAIRS = {
  'en-es': {
    source: 'en',
    target: 'es',
    name: 'English → Spanish',
    mtModel: 'marian-en-es',
    reverse: 'es-en'
  },
  'es-en': {
    source: 'es',
    target: 'en',
    name: 'Spanish → English',
    mtModel: 'marian-es-en',
    reverse: 'en-es'
  },
  'en-fr': {
    source: 'en',
    target: 'fr',
    name: 'English → French',
    mtModel: 'marian-en-fr',
    reverse: 'fr-en'
  },
  'fr-en': {
    source: 'fr',
    target: 'en',
    name: 'French → English',
    mtModel: 'marian-fr-en',
    reverse: 'en-fr'
  },
  'es-fr': {
    source: 'es',
    target: 'fr',
    name: 'Spanish → French',
    mtModel: 'marian-es-fr',
    reverse: 'fr-es'
  },
  'fr-es': {
    source: 'fr',
    target: 'es',
    name: 'French → Spanish',
    mtModel: 'marian-fr-es',
    reverse: 'es-fr'
  }
};

/**
 * Language class for managing language settings
 */
export class Language {
  constructor(code) {
    this.code = code;
    this.config = SUPPORTED_LANGUAGES[code] || DEFAULT_LANGUAGE;
  }

  /**
   * Get language name
   * @returns {string} Language name
   */
  getName() {
    return this.config.name;
  }

  /**
   * Get native language name
   * @returns {string} Native language name
   */
  getNativeName() {
    return this.config.nativeName;
  }

  /**
   * Get language flag
   * @returns {string} Language flag emoji
   */
  getFlag() {
    return this.config.flag;
  }

  /**
   * Get text direction
   * @returns {string} Text direction
   */
  getDirection() {
    return this.config.direction;
  }

  /**
   * Get STT model name
   * @returns {string} STT model name
   */
  getSTTModel() {
    return this.config.sttModel;
  }

  /**
   * Get TTS voice
   * @returns {string} TTS voice
   */
  getTTSVoice() {
    return this.config.ttsVoice;
  }

  /**
   * Get sample text
   * @returns {string} Sample text
   */
  getSampleText() {
    return this.config.sampleText;
  }

  /**
   * Check if language is supported
   * @returns {boolean} Whether language is supported
   */
  isSupported() {
    return !!SUPPORTED_LANGUAGES[this.code];
  }
}

/**
 * Language pair class for translation
 */
export class LanguagePair {
  constructor(sourceCode, targetCode) {
    this.sourceCode = sourceCode;
    this.targetCode = targetCode;
    this.pairKey = `${sourceCode}-${targetCode}`;
    this.config = LANGUAGE_PAIRS[this.pairKey];
    
    if (!this.config) {
      throw new Error(`Unsupported language pair: ${this.pairKey}`);
    }
  }

  /**
   * Get source language
   * @returns {Language} Source language
   */
  getSourceLanguage() {
    return new Language(this.sourceCode);
  }

  /**
   * Get target language
   * @returns {Language} Target language
   */
  getTargetLanguage() {
    return new Language(this.targetCode);
  }

  /**
   * Get pair name
   * @returns {string} Pair name
   */
  getName() {
    return this.config.name;
  }

  /**
   * Get MT model name
   * @returns {string} MT model name
   */
  getMTModel() {
    return this.config.mtModel;
  }

  /**
   * Get reverse pair
   * @returns {LanguagePair} Reverse language pair
   */
  getReverse() {
    return new LanguagePair(this.targetCode, this.sourceCode);
  }

  /**
   * Check if pair is supported
   * @returns {boolean} Whether pair is supported
   */
  isSupported() {
    return !!this.config;
  }
}

/**
 * Language manager for handling language operations
 */
export class LanguageManager {
  constructor() {
    this.currentSourceLanguage = new Language('en');
    this.currentTargetLanguage = new Language('es');
    this.currentPair = new LanguagePair('en', 'es');
  }

  /**
   * Set source language
   * @param {string} code - Language code
   */
  setSourceLanguage(code) {
    this.currentSourceLanguage = new Language(code);
    this.updateLanguagePair();
  }

  /**
   * Set target language
   * @param {string} code - Language code
   */
  setTargetLanguage(code) {
    this.currentTargetLanguage = new Language(code);
    this.updateLanguagePair();
  }

  /**
   * Update language pair based on current source and target
   */
  updateLanguagePair() {
    try {
      this.currentPair = new LanguagePair(
        this.currentSourceLanguage.code,
        this.currentTargetLanguage.code
      );
    } catch (error) {
      console.warn('Invalid language pair, using default');
      this.currentPair = new LanguagePair('en', 'es');
    }
  }

  /**
   * Swap source and target languages
   */
  swapLanguages() {
    const temp = this.currentSourceLanguage;
    this.currentSourceLanguage = this.currentTargetLanguage;
    this.currentTargetLanguage = temp;
    this.updateLanguagePair();
  }

  /**
   * Get current source language
   * @returns {Language} Current source language
   */
  getSourceLanguage() {
    return this.currentSourceLanguage;
  }

  /**
   * Get current target language
   * @returns {Language} Current target language
   */
  getTargetLanguage() {
    return this.currentTargetLanguage;
  }

  /**
   * Get current language pair
   * @returns {LanguagePair} Current language pair
   */
  getLanguagePair() {
    return this.currentPair;
  }

  /**
   * Get all supported languages
   * @returns {Array} Supported languages
   */
  getSupportedLanguages() {
    return Object.values(SUPPORTED_LANGUAGES).map(lang => new Language(lang.code));
  }

  /**
   * Get all supported language pairs
   * @returns {Array} Supported language pairs
   */
  getSupportedPairs() {
    return Object.keys(LANGUAGE_PAIRS).map(pairKey => {
      const [source, target] = pairKey.split('-');
      return new LanguagePair(source, target);
    });
  }

  /**
   * Check if language code is supported
   * @param {string} code - Language code
   * @returns {boolean} Whether language is supported
   */
  isLanguageSupported(code) {
    return !!SUPPORTED_LANGUAGES[code];
  }

  /**
   * Check if language pair is supported
   * @param {string} sourceCode - Source language code
   * @param {string} targetCode - Target language code
   * @returns {boolean} Whether pair is supported
   */
  isPairSupported(sourceCode, targetCode) {
    const pairKey = `${sourceCode}-${targetCode}`;
    return !!LANGUAGE_PAIRS[pairKey];
  }
} 