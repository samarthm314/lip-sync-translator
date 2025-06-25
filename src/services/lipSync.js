/**
 * Lip-sync service for 3D avatar animation
 */

import { generateVisemeSequence } from '../utils/phonemes.js';

export class LipSyncService {
  constructor() {
    this.currentViseme = 'viseme_rest';
    this.visemeQueue = [];
    this.isPlaying = false;
    this.animationFrame = null;
    this.onVisemeChange = null;
    this.audioContext = null;
  }

  /**
   * Initialize lip-sync service
   */
  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      return true;
    } catch (error) {
      console.error('Failed to initialize lip-sync service:', error);
      throw error;
    }
  }

  /**
   * Generate lip-sync animation from text
   * @param {string} text - Input text
   * @param {string} language - Language code
   * @param {number} duration - Audio duration in seconds
   * @returns {Array} Viseme sequence with timing
   */
  generateLipSyncFromText(text, language = 'en', duration = 2.0) {
    const visemes = generateVisemeSequence(text, language);
    
    // Distribute visemes evenly across duration
    const visemeDuration = duration / visemes.length;
    const timedVisemes = visemes.map((viseme, index) => ({
      ...viseme,
      startTime: index * visemeDuration,
      endTime: (index + 1) * visemeDuration
    }));
    
    return timedVisemes;
  }

  /**
   * Generate lip-sync animation from audio
   * @param {Float32Array} audioData - Audio data
   * @param {string} text - Corresponding text
   * @param {string} language - Language code
   * @returns {Array} Viseme sequence with timing
   */
  generateLipSyncFromAudio(audioData, text, language = 'en') {
    const duration = audioData.length / 22050; // Assuming 22.05kHz sample rate
    return this.generateLipSyncFromText(text, language, duration);
  }

  /**
   * Start lip-sync animation
   * @param {Array} visemeSequence - Viseme sequence with timing
   * @param {number} startTime - When to start animation
   */
  startLipSync(visemeSequence, startTime = 0) {
    if (this.isPlaying) {
      this.stopLipSync();
    }

    this.visemeQueue = visemeSequence.map(viseme => ({
      ...viseme,
      startTime: viseme.startTime + startTime,
      endTime: viseme.endTime + startTime
    }));

    this.isPlaying = true;
    this.animate();
  }

  /**
   * Stop lip-sync animation
   */
  stopLipSync() {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Reset to rest viseme
    this.setViseme('viseme_rest');
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isPlaying) return;

    const currentTime = this.audioContext ? this.audioContext.currentTime : performance.now() / 1000;
    
    // Find current viseme
    const currentViseme = this.visemeQueue.find(viseme => 
      currentTime >= viseme.startTime && currentTime < viseme.endTime
    );

    if (currentViseme && currentViseme.viseme !== this.currentViseme) {
      this.setViseme(currentViseme.viseme);
    }

    // Remove past visemes
    this.visemeQueue = this.visemeQueue.filter(viseme => currentTime < viseme.endTime);

    // Stop if no more visemes
    if (this.visemeQueue.length === 0) {
      this.stopLipSync();
      return;
    }

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  /**
   * Set current viseme
   * @param {string} viseme - Viseme blend shape name
   */
  setViseme(viseme) {
    this.currentViseme = viseme;
    if (this.onVisemeChange) {
      this.onVisemeChange(viseme);
    }
  }

  /**
   * Get current viseme
   * @returns {string} Current viseme
   */
  getCurrentViseme() {
    return this.currentViseme;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stopLipSync();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

/**
 * Avatar lip-sync controller for Three.js
 */
export class AvatarLipSyncController {
  constructor(avatar, lipSyncService) {
    this.avatar = avatar;
    this.lipSyncService = lipSyncService;
    this.blendShapes = new Map();
    this.currentWeights = new Map();
    
    this.initializeBlendShapes();
    this.setupLipSyncCallback();
  }

  /**
   * Initialize blend shapes for the avatar
   */
  initializeBlendShapes() {
    if (!this.avatar || !this.avatar.morphTargetDictionary) {
      console.warn('Avatar does not have morph targets');
      return;
    }

    // Map viseme names to blend shape indices
    const visemeNames = [
      'viseme_aa', 'viseme_ih', 'viseme_eh', 'viseme_ah', 'viseme_aw',
      'viseme_ow', 'viseme_uw', 'viseme_uh', 'viseme_er', 'viseme_pp',
      'viseme_bb', 'viseme_dd', 'viseme_kk', 'viseme_gg', 'viseme_ff',
      'viseme_vv', 'viseme_th', 'viseme_ss', 'viseme_zz', 'viseme_sh',
      'viseme_zh', 'viseme_hh', 'viseme_mm', 'viseme_nn', 'viseme_ng',
      'viseme_ll', 'viseme_rr', 'viseme_ww', 'viseme_yy', 'viseme_rest'
    ];

    visemeNames.forEach(visemeName => {
      const index = this.avatar.morphTargetDictionary[visemeName];
      if (index !== undefined) {
        this.blendShapes.set(visemeName, index);
        this.currentWeights.set(visemeName, 0);
      }
    });
  }

  /**
   * Set up lip-sync callback
   */
  setupLipSyncCallback() {
    this.lipSyncService.onVisemeChange = (viseme) => {
      this.updateViseme(viseme);
    };
  }

  /**
   * Update viseme with smooth transition
   * @param {string} viseme - Target viseme
   * @param {number} transitionTime - Transition time in seconds
   */
  updateViseme(viseme, transitionTime = 0.1) {
    // Reset all viseme weights
    this.blendShapes.forEach((index, visemeName) => {
      this.currentWeights.set(visemeName, 0);
      this.avatar.morphTargetInfluences[index] = 0;
    });

    // Set target viseme weight
    const targetIndex = this.blendShapes.get(viseme);
    if (targetIndex !== undefined) {
      this.currentWeights.set(viseme, 1.0);
      this.avatar.morphTargetInfluences[targetIndex] = 1.0;
    }
  }

  /**
   * Smooth transition between visemes
   * @param {string} fromViseme - Starting viseme
   * @param {string} toViseme - Target viseme
   * @param {number} duration - Transition duration in seconds
   */
  transitionViseme(fromViseme, toViseme, duration = 0.1) {
    const fromIndex = this.blendShapes.get(fromViseme);
    const toIndex = this.blendShapes.get(toViseme);
    
    if (fromIndex === undefined || toIndex === undefined) {
      return;
    }

    const startTime = performance.now();
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1.0);
      
      // Smooth easing
      const easeProgress = this.easeInOutQuad(progress);
      
      // Update weights
      this.avatar.morphTargetInfluences[fromIndex] = 1.0 - easeProgress;
      this.avatar.morphTargetInfluences[toIndex] = easeProgress;
      
      if (progress < 1.0) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * Easing function for smooth transitions
   * @param {number} t - Time progress (0-1)
   * @returns {number} Eased progress
   */
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * Get current viseme weights
   * @returns {Map} Current viseme weights
   */
  getCurrentWeights() {
    return new Map(this.currentWeights);
  }

  /**
   * Reset avatar to neutral expression
   */
  resetToNeutral() {
    this.blendShapes.forEach((index, visemeName) => {
      this.avatar.morphTargetInfluences[index] = 0;
      this.currentWeights.set(visemeName, 0);
    });
  }
} 