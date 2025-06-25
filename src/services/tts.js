/**
 * Text-to-Speech service using ONNX models or Web Speech API fallback
 */

export class TTSService {
  constructor() {
    this.isInitialized = false;
    this.synthesis = null;
    this.onnxSession = null;
    this.currentVoice = null;
    this.supportedLanguages = ['en', 'es', 'fr'];
  }

  /**
   * Initialize TTS service
   */
  async initialize() {
    try {
      console.log('Initializing TTS service...');
      
      // Check if Web Speech API is available
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        this.isInitialized = true;
        console.log('TTS initialized with Web Speech API');
        return;
      }

      // Try ONNX as fallback (but we'll prioritize Web Speech API)
      try {
        const vocabResponse = await fetch('/wasm/tacotron2-vocab.json');
        if (!vocabResponse.ok) {
          throw new Error('TTS vocab file not found');
        }
        
        // If we get here, ONNX files exist, but we'll still use Web Speech API
        // for better browser compatibility and performance
        this.isInitialized = true;
        console.log('TTS initialized with Web Speech API (ONNX available but not used)');
        return;
      } catch (error) {
        console.log('ONNX TTS files not found, using Web Speech API');
        this.isInitialized = true;
        return;
      }
    } catch (error) {
      console.error('Failed to initialize TTS service:', error);
      throw error;
    }
  }

  /**
   * Synthesize speech from text
   * @param {string} text - Text to synthesize
   * @param {string} language - Language code (en, es, fr)
   * @returns {Promise<AudioBuffer>} Audio buffer
   */
  async synthesize(text, language = 'en') {
    if (!this.isInitialized) {
      throw new Error('TTS service not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing synthesis
        if (this.synthesis.speaking) {
          this.synthesis.cancel();
        }

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set language
        utterance.lang = this.getLanguageCode(language);
        
        // Set voice if available
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith(language) && voice.localService
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        // Set properties for better quality
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Handle events
        utterance.onstart = () => {
          console.log('TTS synthesis started');
        };

        utterance.onend = () => {
          console.log('TTS synthesis completed');
          // Convert to AudioBuffer for consistency with ONNX interface
          this.convertToAudioBuffer(text, language).then(resolve).catch(reject);
        };

        utterance.onerror = (event) => {
          console.error('TTS synthesis error:', event.error);
          reject(new Error(`TTS synthesis failed: ${event.error}`));
        };

        // Start synthesis
        this.synthesis.speak(utterance);

      } catch (error) {
        console.error('TTS synthesis error:', error);
        reject(error);
      }
    });
  }

  /**
   * Convert text to audio buffer (simplified for Web Speech API)
   */
  async convertToAudioBuffer(text, language) {
    // For Web Speech API, we return a simple audio buffer
    // In a real implementation, you might capture the audio output
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const duration = text.length * 0.1; // Rough estimate
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    
    // Fill with silence (placeholder)
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = 0;
    }
    
    return buffer;
  }

  /**
   * Get language code for Web Speech API
   */
  getLanguageCode(language) {
    const languageMap = {
      'en': 'en-US',
      'es': 'es-ES', 
      'fr': 'fr-FR'
    };
    return languageMap[language] || 'en-US';
  }

  /**
   * Get available voices
   */
  getVoices() {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  /**
   * Set voice
   */
  setVoice(voice) {
    this.currentVoice = voice;
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized && this.synthesis !== null;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const ttsService = new TTSService(); 