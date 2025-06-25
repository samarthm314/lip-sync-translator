/**
 * Speech-to-Text service using on-device models
 */

import * as ort from 'onnxruntime-web';

export class STTService {
  constructor() {
    this.session = null;
    this.isInitialized = false;
    this.modelPath = '/wasm/whisper-tiny.onnx';
    this.vocabPath = '/wasm/whisper-vocab.json';
    this.vocab = null;
  }

  /**
   * Initialize the STT service
   */
  async initialize() {
    try {
      console.log('Initializing STT service...');
      
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
      console.log('STT service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize STT service:', error);
      throw error;
    }
  }

  /**
   * Convert audio data to text
   * @param {Float32Array} audioData - Raw audio data
   * @param {string} language - Source language code
   * @returns {Promise<string>} Transcribed text
   */
  async transcribe(audioData, language = 'en') {
    if (!this.isInitialized) {
      throw new Error('STT service not initialized');
    }

    try {
      // Preprocess audio data
      const processedAudio = this.preprocessAudio(audioData);
      
      // Run inference
      const inputTensor = new ort.Tensor('float32', processedAudio, [1, 1, processedAudio.length]);
      const feeds = { input: inputTensor };
      
      const results = await this.session.run(feeds);
      const output = results.output.data;
      
      // Decode output to text
      const text = this.decodeOutput(output, language);
      
      return text;
    } catch (error) {
      console.error('Transcription failed:', error);
      throw error;
    }
  }

  /**
   * Preprocess audio data for Whisper model
   * @param {Float32Array} audioData - Raw audio data
   * @returns {Float32Array} Preprocessed audio
   */
  preprocessAudio(audioData) {
    // Resample to 16kHz if needed
    let resampled = audioData;
    if (audioData.length !== 16000) {
      resampled = this.resample(audioData, 16000);
    }
    
    // Apply mel spectrogram
    const melSpectrogram = this.computeMelSpectrogram(resampled);
    
    // Normalize
    const normalized = this.normalize(melSpectrogram);
    
    return normalized;
  }

  /**
   * Resample audio to target sample rate
   * @param {Float32Array} audio - Input audio
   * @param {number} targetSampleRate - Target sample rate
   * @returns {Float32Array} Resampled audio
   */
  resample(audio, targetSampleRate) {
    // Simple linear interpolation resampling
    const originalSampleRate = 44100; // Assuming original sample rate
    const ratio = targetSampleRate / originalSampleRate;
    const newLength = Math.floor(audio.length * ratio);
    const resampled = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const originalIndex = i / ratio;
      const index1 = Math.floor(originalIndex);
      const index2 = Math.min(index1 + 1, audio.length - 1);
      const fraction = originalIndex - index1;
      
      resampled[i] = audio[index1] * (1 - fraction) + audio[index2] * fraction;
    }
    
    return resampled;
  }

  /**
   * Compute mel spectrogram from audio
   * @param {Float32Array} audio - Audio data
   * @returns {Float32Array} Mel spectrogram
   */
  computeMelSpectrogram(audio) {
    // Simplified mel spectrogram computation
    // In production, use a proper FFT library
    const frameSize = 400;
    const hopSize = 160;
    const numFrames = Math.floor((audio.length - frameSize) / hopSize) + 1;
    const numMels = 80;
    
    const spectrogram = new Float32Array(numFrames * numMels);
    
    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      const end = start + frameSize;
      const frameData = audio.slice(start, end);
      
      // Apply window function (Hamming)
      const windowed = this.applyWindow(frameData);
      
      // Compute power spectrum (simplified)
      const powerSpectrum = this.computePowerSpectrum(windowed);
      
      // Apply mel filterbank (simplified)
      const melFeatures = this.applyMelFilterbank(powerSpectrum, numMels);
      
      // Copy to output
      for (let mel = 0; mel < numMels; mel++) {
        spectrogram[frame * numMels + mel] = melFeatures[mel];
      }
    }
    
    return spectrogram;
  }

  /**
   * Apply Hamming window
   * @param {Float32Array} data - Input data
   * @returns {Float32Array} Windowed data
   */
  applyWindow(data) {
    const windowed = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const windowValue = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (data.length - 1));
      windowed[i] = data[i] * windowValue;
    }
    return windowed;
  }

  /**
   * Compute power spectrum (simplified)
   * @param {Float32Array} data - Windowed data
   * @returns {Float32Array} Power spectrum
   */
  computePowerSpectrum(data) {
    // Simplified FFT - in production use a proper FFT library
    const fftSize = 512;
    const spectrum = new Float32Array(fftSize / 2);
    
    for (let k = 0; k < fftSize / 2; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < data.length; n++) {
        const angle = -2 * Math.PI * k * n / fftSize;
        real += data[n] * Math.cos(angle);
        imag += data[n] * Math.sin(angle);
      }
      
      spectrum[k] = real * real + imag * imag;
    }
    
    return spectrum;
  }

  /**
   * Apply mel filterbank
   * @param {Float32Array} spectrum - Power spectrum
   * @param {number} numMels - Number of mel bands
   * @returns {Float32Array} Mel features
   */
  applyMelFilterbank(spectrum, numMels) {
    // Simplified mel filterbank
    const melFeatures = new Float32Array(numMels);
    
    for (let mel = 0; mel < numMels; mel++) {
      let sum = 0;
      for (let bin = 0; bin < spectrum.length; bin++) {
        // Simplified filter weights
        const weight = Math.exp(-Math.abs(bin - mel * spectrum.length / numMels));
        sum += spectrum[bin] * weight;
      }
      melFeatures[mel] = Math.log(Math.max(sum, 1e-10));
    }
    
    return melFeatures;
  }

  /**
   * Normalize mel spectrogram
   * @param {Float32Array} spectrogram - Mel spectrogram
   * @returns {Float32Array} Normalized spectrogram
   */
  normalize(spectrogram) {
    const normalized = new Float32Array(spectrogram.length);
    const mean = spectrogram.reduce((sum, val) => sum + val, 0) / spectrogram.length;
    const variance = spectrogram.reduce((sum, val) => sum + (val - mean) ** 2, 0) / spectrogram.length;
    const std = Math.sqrt(variance);
    
    for (let i = 0; i < spectrogram.length; i++) {
      normalized[i] = (spectrogram[i] - mean) / std;
    }
    
    return normalized;
  }

  /**
   * Decode model output to text
   * @param {Float32Array} output - Model output
   * @param {string} language - Language code
   * @returns {string} Decoded text
   */
  decodeOutput(output, language) {
    // Simplified decoding - in production use proper beam search
    const tokens = [];
    const vocabSize = this.vocab.length;
    
    for (let i = 0; i < output.length; i += vocabSize) {
      const logits = output.slice(i, i + vocabSize);
      const token = this.argmax(logits);
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
    
    const text = tokens
      .map(token => this.vocab[token])
      .filter(token => token && token !== '<sos>' && token !== '<eos>')
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

// Fallback STT using Web Speech API
export class WebSpeechSTT {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;
  }

  /**
   * Initialize Web Speech API recognition
   * @param {Function} onResult - Callback for transcription results
   */
  initialize(onResult) {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      
      if (result.isFinal && this.onResult) {
        this.onResult(transcript);
      }
    };
    
    this.onResult = onResult;
  }

  /**
   * Start listening
   */
  start() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Set language
   * @param {string} language - Language code
   */
  setLanguage(language) {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }
} 