/**
 * Audio processing utilities for the lip-sync translator
 */

// Audio configuration
export const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
  bufferSize: 4096,
  encoding: 'opus',
  bitrate: 32000
};

/**
 * Audio capture class for microphone input
 */
export class AudioCapture {
  constructor() {
    this.stream = null;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.isRecording = false;
    this.onAudioData = null;
  }

  /**
   * Initialize audio capture
   * @param {Function} onData - Callback for audio data
   * @returns {Promise} Initialization promise
   */
  async initialize(onData) {
    try {
      this.onAudioData = onData;
      
      // Get microphone stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_CONFIG.sampleRate,
          channelCount: AUDIO_CONFIG.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: AUDIO_CONFIG.sampleRate
      });

      // Create media recorder for Opus encoding
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: AUDIO_CONFIG.bitrate
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.onAudioData) {
          this.onAudioData(event.data);
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to initialize audio capture:', error);
      throw error;
    }
  }

  /**
   * Start recording audio
   */
  startRecording() {
    if (this.mediaRecorder && !this.isRecording) {
      this.mediaRecorder.start(100); // 100ms chunks
      this.isRecording = true;
    }
  }

  /**
   * Stop recording audio
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  /**
   * Get raw audio data from microphone
   * @returns {Promise<Float32Array>} Audio data
   */
  async getRawAudioData() {
    if (!this.stream || !this.audioContext) {
      throw new Error('Audio capture not initialized');
    }

    const source = this.audioContext.createMediaStreamSource(this.stream);
    const processor = this.audioContext.createScriptProcessor(AUDIO_CONFIG.bufferSize, 1, 1);

    return new Promise((resolve) => {
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        resolve(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);
    });
  }

  /**
   * Clean up audio resources
   */
  cleanup() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

/**
 * Audio playback class for translated audio
 */
export class AudioPlayback {
  constructor() {
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Initialize audio playback
   */
  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      return true;
    } catch (error) {
      console.error('Failed to initialize audio playback:', error);
      throw error;
    }
  }

  /**
   * Play audio data
   * @param {Blob|ArrayBuffer} audioData - Audio data to play
   * @param {number} startTime - When to start playing (optional)
   */
  async playAudio(audioData, startTime = null) {
    if (!this.audioContext) {
      throw new Error('Audio playback not initialized');
    }

    try {
      let arrayBuffer;
      
      if (audioData instanceof Blob) {
        arrayBuffer = await audioData.arrayBuffer();
      } else {
        arrayBuffer = audioData;
      }

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      if (startTime) {
        source.start(startTime);
      } else {
        source.start();
      }

      this.isPlaying = true;
      
      source.onended = () => {
        this.isPlaying = false;
      };

      return source;
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Play audio with lip-sync timing information
   * @param {Object} audioSegment - Audio segment with timing data
   * @param {Blob} audioSegment.audio - Audio data
   * @param {number} audioSegment.startTime - Start time in seconds
   * @param {number} audioSegment.duration - Duration in seconds
   * @param {Array} audioSegment.visemes - Viseme sequence
   */
  async playAudioWithLipSync(audioSegment) {
    const { audio, startTime, duration, visemes } = audioSegment;
    
    // Schedule audio playback
    const scheduledTime = this.audioContext.currentTime + (startTime || 0);
    await this.playAudio(audio, scheduledTime);
    
    // Return timing information for lip-sync
    return {
      startTime: scheduledTime,
      duration,
      visemes
    };
  }

  /**
   * Resume audio context (required after user interaction)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Clean up audio resources
   */
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

/**
 * Audio buffer utilities
 */
export class AudioBufferUtils {
  /**
   * Convert audio data to base64 for transmission
   * @param {Blob} audioBlob - Audio blob
   * @returns {Promise<string>} Base64 string
   */
  static async blobToBase64(audioBlob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * Convert base64 to blob
   * @param {string} base64 - Base64 string
   * @returns {Blob} Audio blob
   */
  static base64ToBlob(base64) {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'audio/webm' });
  }

  /**
   * Create audio buffer from float32 array
   * @param {Float32Array} data - Audio data
   * @param {number} sampleRate - Sample rate
   * @returns {AudioBuffer} Audio buffer
   */
  static createAudioBuffer(data, sampleRate = AUDIO_CONFIG.sampleRate) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = audioContext.createBuffer(1, data.length, sampleRate);
    buffer.getChannelData(0).set(data);
    return buffer;
  }
} 