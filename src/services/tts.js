/**
 * Text-to-Speech service using on-device models
 */

import * as ort from 'onnxruntime-web';

export class TTSService {
  constructor() {
    this.session = null;
    this.isInitialized = false;
    this.modelPath = '/wasm/tacotron2-tts.onnx';
    this.vocabPath = '/wasm/tacotron2-vocab.json';
    this.vocab = null;
  }

  /**
   * Initialize the TTS service
   */
  async initialize() {
    try {
      console.log('Initializing TTS service...');
      
      // Load vocabulary
      const vocabResponse = await fetch(this.vocabPath);
      this.vocab = await vocabResponse.json();
      
      // Load ONNX model
      const modelResponse = await fetch(this.modelPath);
      const modelBuffer = await modelResponse.arrayBuffer();
      
      // Create ONNX session
      this.session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
      
      this.isInitialized = true;
      console.log('TTS service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize TTS service:', error);
      throw error;
    }
  }

  /**
   * Generate speech from text
   * @param {string} text - Input text
   * @param {string} language - Language code
   * @param {Object} options - TTS options
   * @returns {Promise<Float32Array>} Audio data
   */
  async synthesize(text, language = 'en', options = {}) {
    if (!this.isInitialized) {
      throw new Error('TTS service not initialized');
    }

    try {
      // Tokenize input text
      const tokens = this.tokenize(text, language);
      
      // Run inference
      const inputTensor = new ort.Tensor('int64', tokens, [1, tokens.length]);
      const feeds = { input: inputTensor };
      
      const results = await this.session.run(feeds);
      const output = results.output.data;
      
      // Post-process audio
      const audio = this.postprocessAudio(output, options);
      
      return audio;
    } catch (error) {
      console.error('TTS synthesis failed:', error);
      throw error;
    }
  }

  /**
   * Tokenize text for TTS model
   * @param {string} text - Input text
   * @param {string} language - Language code
   * @returns {Array<number>} Token indices
   */
  tokenize(text, language) {
    // Simplified tokenization for TTS
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
   * Post-process generated audio
   * @param {Float32Array} output - Model output
   * @param {Object} options - Audio options
   * @returns {Float32Array} Processed audio
   */
  postprocessAudio(output, options = {}) {
    const {
      sampleRate = 22050,
      normalize = true,
      applyFade = true
    } = options;
    
    let audio = new Float32Array(output);
    
    // Normalize audio
    if (normalize) {
      audio = this.normalizeAudio(audio);
    }
    
    // Apply fade in/out
    if (applyFade) {
      audio = this.applyFade(audio);
    }
    
    return audio;
  }

  /**
   * Normalize audio to [-1, 1] range
   * @param {Float32Array} audio - Input audio
   * @returns {Float32Array} Normalized audio
   */
  normalizeAudio(audio) {
    const maxAmplitude = Math.max(...audio.map(Math.abs));
    if (maxAmplitude === 0) return audio;
    
    const normalized = new Float32Array(audio.length);
    const scale = 0.95 / maxAmplitude; // Leave some headroom
    
    for (let i = 0; i < audio.length; i++) {
      normalized[i] = audio[i] * scale;
    }
    
    return normalized;
  }

  /**
   * Apply fade in/out to audio
   * @param {Float32Array} audio - Input audio
   * @param {number} fadeLength - Fade length in samples
   * @returns {Float32Array} Audio with fade
   */
  applyFade(audio, fadeLength = 1000) {
    const faded = new Float32Array(audio);
    
    // Fade in
    for (let i = 0; i < Math.min(fadeLength, audio.length); i++) {
      const fade = i / fadeLength;
      faded[i] *= fade;
    }
    
    // Fade out
    for (let i = 0; i < Math.min(fadeLength, audio.length); i++) {
      const fade = i / fadeLength;
      const index = audio.length - 1 - i;
      faded[index] *= fade;
    }
    
    return faded;
  }

  /**
   * Convert audio to WAV format
   * @param {Float32Array} audio - Audio data
   * @param {number} sampleRate - Sample rate
   * @returns {Blob} WAV blob
   */
  audioToWav(audio, sampleRate = 22050) {
    const buffer = new ArrayBuffer(44 + audio.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + audio.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, audio.length * 2, true);
    
    // Audio data
    for (let i = 0; i < audio.length; i++) {
      const sample = Math.max(-1, Math.min(1, audio[i]));
      view.setInt16(44 + i * 2, sample * 0x7FFF, true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
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

// Fallback TTS using Web Speech API
export class WebSpeechTTS {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
  }

  /**
   * Initialize Web Speech TTS
   */
  async initialize() {
    try {
      // Wait for voices to load
      if (this.synthesis.getVoices().length === 0) {
        await new Promise(resolve => {
          this.synthesis.onvoiceschanged = resolve;
        });
      }
      
      this.voices = this.synthesis.getVoices();
      this.selectedVoice = this.voices.find(voice => voice.lang.startsWith('en')) || this.voices[0];
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Web Speech TTS:', error);
      throw error;
    }
  }

  /**
   * Synthesize speech from text
   * @param {string} text - Input text
   * @param {string} language - Language code
   * @param {Object} options - TTS options
   * @returns {Promise<Blob>} Audio blob
   */
  async synthesize(text, language = 'en', options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice based on language
        const voice = this.voices.find(v => v.lang.startsWith(language)) || this.selectedVoice;
        if (voice) {
          utterance.voice = voice;
        }
        
        // Set options
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;
        
        // Create audio blob (simplified - in production use MediaRecorder)
        utterance.onend = () => {
          // For demo purposes, create a simple audio blob
          // In production, you'd capture the audio using MediaRecorder
          const dummyAudio = new Float32Array(22050); // 1 second of silence
          const blob = this.audioToWav(dummyAudio);
          resolve(blob);
        };
        
        utterance.onerror = (error) => {
          reject(error);
        };
        
        this.synthesis.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Convert audio to WAV format (simplified)
   * @param {Float32Array} audio - Audio data
   * @returns {Blob} WAV blob
   */
  audioToWav(audio) {
    const buffer = new ArrayBuffer(44 + audio.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + audio.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 22050, true);
    view.setUint32(28, 22050 * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, audio.length * 2, true);
    
    // Audio data
    for (let i = 0; i < audio.length; i++) {
      const sample = Math.max(-1, Math.min(1, audio[i]));
      view.setInt16(44 + i * 2, sample * 0x7FFF, true);
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Get available voices
   * @returns {Array} Available voices
   */
  getVoices() {
    return this.voices;
  }

  /**
   * Set voice
   * @param {SpeechSynthesisVoice} voice - Voice to use
   */
  setVoice(voice) {
    this.selectedVoice = voice;
  }
} 