/**
 * Machine Translation service using on-device models
 */

import * as ort from 'onnxruntime-web';

export class MTService {
  constructor() {
    this.session = null;
    this.isInitialized = false;
    this.tokenizer = null;
    this.modelPath = '/wasm/marian-encoder.onnx';
    this.vocabPath = '/wasm/marian-vocab.json';
    this.vocab = null;
  }

  /**
   * Initialize the MT service
   */
  async initialize() {
    try {
      console.log('Initializing MT service...');
      
      // Check if ONNX runtime is available
      if (typeof ort === 'undefined') {
        throw new Error('ONNX runtime not available');
      }
      
      // Load vocabulary
      const vocabResponse = await fetch(this.vocabPath);
      if (!vocabResponse.ok) {
        throw new Error('Failed to load vocabulary');
      }
      this.vocab = await vocabResponse.json();
      
      // Load ONNX model
      const modelResponse = await fetch(this.modelPath);
      if (!modelResponse.ok) {
        throw new Error('Failed to load model');
      }
      const modelBuffer = await modelResponse.arrayBuffer();
      
      // Create ONNX session with timeout
      const sessionPromise = ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
        enableCpuMemArena: false,
        enableMemPattern: false
      });
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('ONNX initialization timeout')), 10000);
      });
      
      this.session = await Promise.race([sessionPromise, timeoutPromise]);
      
      this.isInitialized = true;
      console.log('MT service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize MT service:', error);
      throw error;
    }
  }

  /**
   * Translate text from source to target language
   * @param {string} text - Source text
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @returns {Promise<string>} Translated text
   */
  async translate(text, sourceLang = 'en', targetLang = 'es') {
    if (!this.isInitialized) {
      throw new Error('MT service not initialized');
    }

    try {
      // Tokenize input text
      const tokens = this.tokenize(text, sourceLang);
      
      // Run inference
      const inputTensor = new ort.Tensor('int64', tokens, [1, tokens.length]);
      const feeds = { input: inputTensor };
      
      const results = await this.session.run(feeds);
      const output = results.output.data;
      
      // Decode output to text
      const translatedText = this.decodeOutput(output, targetLang);
      
      return translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      throw error;
    }
  }

  /**
   * Tokenize text for model input
   * @param {string} text - Input text
   * @param {string} language - Language code
   * @returns {Array<number>} Token indices
   */
  tokenize(text, language) {
    // Simplified tokenization - in production use proper tokenizer
    const words = text.toLowerCase().split(/\s+/);
    const tokens = [];
    
    // Add start token
    tokens.push(this.vocab['<sos>'] || 0);
    
    for (const word of words) {
      // Simple word-to-token mapping
      const token = this.vocab[word] || this.vocab['<unk>'] || 1;
      tokens.push(token);
    }
    
    // Add end token
    tokens.push(this.vocab['<eos>'] || 2);
    
    return tokens;
  }

  /**
   * Decode model output to text
   * @param {Float32Array} output - Model output
   * @param {string} language - Target language
   * @returns {string} Decoded text
   */
  decodeOutput(output, language) {
    // Simplified decoding - in production use proper beam search
    const tokens = [];
    const vocabSize = this.vocab.length;
    
    for (let i = 0; i < output.length; i += vocabSize) {
      const logits = output.slice(i, i + vocabSize);
      const token = this.argmax(logits);
      
      // Stop at end token
      if (token === this.vocab['<eos>']) {
        break;
      }
      
      tokens.push(token);
    }
    
    // Convert tokens to text
    return this.tokensToText(tokens, language);
  }

  /**
   * Find index of maximum value
   * @param {Float32Array} array - Input array
   * @returns {number} Index of maximum value
   */
  argmax(array) {
    let maxIndex = 0;
    let maxValue = array[0];
    
    for (let i = 1; i < array.length; i++) {
      if (array[i] > maxValue) {
        maxValue = array[i];
        maxIndex = i;
      }
    }
    
    return maxIndex;
  }

  /**
   * Convert tokens to text
   * @param {Array<number>} tokens - Token indices
   * @param {string} language - Language code
   * @returns {string} Decoded text
   */
  tokensToText(tokens, language) {
    if (!this.vocab) {
      throw new Error('Vocabulary not loaded');
    }
    
    // Create reverse vocabulary mapping
    const reverseVocab = {};
    for (const [word, index] of Object.entries(this.vocab)) {
      reverseVocab[index] = word;
    }
    
    const text = tokens
      .map(token => reverseVocab[token])
      .filter(word => word && word !== '<sos>' && word !== '<eos>' && word !== '<unk>')
      .join(' ');
    
    return text.trim();
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.session) {
      this.session.release();
    }
  }
}

// Fallback translation using simple dictionary
export class DictionaryMT {
  constructor() {
    this.dictionaries = {
      'en-es': {
        'hello': 'hola',
        'goodbye': 'adiós',
        'thank you': 'gracias',
        'please': 'por favor',
        'yes': 'sí',
        'no': 'no',
        'how are you': 'cómo estás',
        'good morning': 'buenos días',
        'good afternoon': 'buenas tardes',
        'good night': 'buenas noches',
        'what is your name': 'cómo te llamas',
        'my name is': 'me llamo',
        'nice to meet you': 'encantado de conocerte',
        'where are you from': 'de dónde eres',
        'i am from': 'soy de',
        'do you speak english': 'hablas inglés',
        'do you speak spanish': 'hablas español',
        'i understand': 'entiendo',
        'i do not understand': 'no entiendo',
        'can you help me': 'puedes ayudarme',
        'excuse me': 'disculpa',
        'sorry': 'lo siento',
        'good': 'bueno',
        'bad': 'malo',
        'big': 'grande',
        'small': 'pequeño',
        'hot': 'caliente',
        'cold': 'frío',
        'water': 'agua',
        'food': 'comida',
        'house': 'casa',
        'car': 'coche',
        'time': 'tiempo',
        'day': 'día',
        'night': 'noche',
        'today': 'hoy',
        'tomorrow': 'mañana',
        'yesterday': 'ayer'
      },
      'es-en': {
        'hola': 'hello',
        'adiós': 'goodbye',
        'gracias': 'thank you',
        'por favor': 'please',
        'sí': 'yes',
        'no': 'no',
        'cómo estás': 'how are you',
        'buenos días': 'good morning',
        'buenas tardes': 'good afternoon',
        'buenas noches': 'good night',
        'cómo te llamas': 'what is your name',
        'me llamo': 'my name is',
        'encantado de conocerte': 'nice to meet you',
        'de dónde eres': 'where are you from',
        'soy de': 'i am from',
        'hablas inglés': 'do you speak english',
        'hablas español': 'do you speak spanish',
        'entiendo': 'i understand',
        'no entiendo': 'i do not understand',
        'puedes ayudarme': 'can you help me',
        'disculpa': 'excuse me',
        'lo siento': 'sorry',
        'bueno': 'good',
        'malo': 'bad',
        'grande': 'big',
        'pequeño': 'small',
        'caliente': 'hot',
        'frío': 'cold',
        'agua': 'water',
        'comida': 'food',
        'casa': 'house',
        'coche': 'car',
        'tiempo': 'time',
        'día': 'day',
        'noche': 'night',
        'hoy': 'today',
        'mañana': 'tomorrow',
        'ayer': 'yesterday'
      }
    };
  }

  /**
   * Translate text using dictionary
   * @param {string} text - Source text
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {Promise<string>} Translated text
   */
  async translate(text, sourceLang = 'en', targetLang = 'es') {
    const dictKey = `${sourceLang}-${targetLang}`;
    const dictionary = this.dictionaries[dictKey];
    
    if (!dictionary) {
      throw new Error(`Translation not supported: ${sourceLang} to ${targetLang}`);
    }
    
    const words = text.toLowerCase().split(/\s+/);
    const translatedWords = words.map(word => dictionary[word] || word);
    
    return translatedWords.join(' ');
  }

  /**
   * Add custom translation to dictionary
   * @param {string} source - Source text
   * @param {string} target - Target text
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   */
  addTranslation(source, target, sourceLang = 'en', targetLang = 'es') {
    const dictKey = `${sourceLang}-${targetLang}`;
    if (!this.dictionaries[dictKey]) {
      this.dictionaries[dictKey] = {};
    }
    this.dictionaries[dictKey][source.toLowerCase()] = target.toLowerCase();
  }

  /**
   * Cleanup resources (no-op for dictionary fallback)
   */
  cleanup() {
    // No resources to clean up for dictionary fallback
  }
} 