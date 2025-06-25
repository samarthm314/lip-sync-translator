/**
 * WebRTC service for peer-to-peer communication
 */

import SimplePeer from 'simple-peer';

export class WebRTCService {
  constructor() {
    this.peer = null;
    this.isConnected = false;
    this.isInitiator = false;
    this.onAudioData = null;
    this.onConnectionStateChange = null;
    this.onError = null;
  }

  /**
   * Initialize WebRTC connection
   * @param {boolean} isInitiator - Whether this peer initiates the connection
   * @param {Object} options - Connection options
   */
  async initialize(isInitiator = false, options = {}) {
    try {
      this.isInitiator = isInitiator;
      
      // Create SimplePeer instance
      this.peer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        },
        ...options
      });

      // Set up event handlers
      this.peer.on('signal', (data) => {
        this.onSignal(data);
      });

      this.peer.on('connect', () => {
        console.log('WebRTC connection established');
        this.isConnected = true;
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange('connected');
        }
      });

      this.peer.on('data', (data) => {
        this.handleData(data);
      });

      this.peer.on('error', (error) => {
        console.error('WebRTC error:', error);
        if (this.onError) {
          this.onError(error);
        }
      });

      this.peer.on('close', () => {
        console.log('WebRTC connection closed');
        this.isConnected = false;
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange('disconnected');
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  /**
   * Handle signaling data
   * @param {Object} data - Signaling data
   */
  onSignal(data) {
    // This should be sent to the other peer via signaling server
    // For demo purposes, we'll use a simple event system
    const event = new CustomEvent('webrtc-signal', { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Handle incoming signaling data
   * @param {Object} data - Signaling data from other peer
   */
  handleSignal(data) {
    if (this.peer) {
      this.peer.signal(data);
    }
  }

  /**
   * Handle incoming data
   * @param {Uint8Array} data - Received data
   */
  handleData(data) {
    try {
      const message = JSON.parse(new TextDecoder().decode(data));
      
      switch (message.type) {
        case 'audio':
          if (this.onAudioData) {
            this.onAudioData(message.audio);
          }
          break;
        case 'transcript':
          // Handle transcript updates
          break;
        case 'translation':
          // Handle translation updates
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  /**
   * Send audio data to peer
   * @param {Blob|ArrayBuffer} audioData - Audio data to send
   */
  sendAudio(audioData) {
    if (!this.isConnected || !this.peer) {
      return;
    }

    try {
      // Convert audio data to base64 for transmission
      this.convertAudioToBase64(audioData).then(base64 => {
        const message = {
          type: 'audio',
          audio: base64,
          timestamp: Date.now()
        };
        
        this.sendMessage(message);
      });
    } catch (error) {
      console.error('Failed to send audio:', error);
    }
  }

  /**
   * Send transcript to peer
   * @param {string} transcript - Transcript text
   * @param {string} language - Language code
   */
  sendTranscript(transcript, language = 'en') {
    if (!this.isConnected || !this.peer) {
      return;
    }

    const message = {
      type: 'transcript',
      text: transcript,
      language,
      timestamp: Date.now()
    };
    
    this.sendMessage(message);
  }

  /**
   * Send translation to peer
   * @param {string} originalText - Original text
   * @param {string} translatedText - Translated text
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   */
  sendTranslation(originalText, translatedText, sourceLang, targetLang) {
    if (!this.isConnected || !this.peer) {
      return;
    }

    const message = {
      type: 'translation',
      original: originalText,
      translated: translatedText,
      sourceLang,
      targetLang,
      timestamp: Date.now()
    };
    
    this.sendMessage(message);
  }

  /**
   * Send message to peer
   * @param {Object} message - Message to send
   */
  sendMessage(message) {
    if (!this.isConnected || !this.peer) {
      return;
    }

    try {
      const data = new TextEncoder().encode(JSON.stringify(message));
      this.peer.send(data);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  /**
   * Convert audio data to base64
   * @param {Blob|ArrayBuffer} audioData - Audio data
   * @returns {Promise<string>} Base64 string
   */
  async convertAudioToBase64(audioData) {
    if (audioData instanceof Blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(audioData);
      });
    } else if (audioData instanceof ArrayBuffer) {
      const blob = new Blob([audioData], { type: 'audio/wav' });
      return this.convertAudioToBase64(blob);
    } else {
      throw new Error('Unsupported audio data type');
    }
  }

  /**
   * Convert base64 to audio data
   * @param {string} base64 - Base64 string
   * @returns {Blob} Audio blob
   */
  convertBase64ToAudio(base64) {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'audio/wav' });
  }

  /**
   * Get connection state
   * @returns {string} Connection state
   */
  getConnectionState() {
    if (!this.peer) return 'disconnected';
    return this.peer.connected ? 'connected' : 'connecting';
  }

  /**
   * Disconnect from peer
   */
  disconnect() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.isConnected = false;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.disconnect();
  }
}

// Signaling server simulation for demo
export class SignalingServer {
  constructor() {
    this.peers = new Map();
    this.onPeerJoined = null;
    this.onPeerLeft = null;
  }

  /**
   * Join signaling server
   * @param {string} peerId - Peer ID
   * @param {Function} onSignal - Signal handler
   */
  join(peerId, onSignal) {
    this.peers.set(peerId, onSignal);
    
    // Notify other peers
    this.peers.forEach((signalHandler, id) => {
      if (id !== peerId) {
        signalHandler({ type: 'peer-joined', peerId });
      }
    });
    
    if (this.onPeerJoined) {
      this.onPeerJoined(peerId);
    }
  }

  /**
   * Leave signaling server
   * @param {string} peerId - Peer ID
   */
  leave(peerId) {
    this.peers.delete(peerId);
    
    // Notify other peers
    this.peers.forEach((signalHandler) => {
      signalHandler({ type: 'peer-left', peerId });
    });
    
    if (this.onPeerLeft) {
      this.onPeerLeft(peerId);
    }
  }

  /**
   * Send signal to peer
   * @param {string} fromPeerId - Sender peer ID
   * @param {string} toPeerId - Receiver peer ID
   * @param {Object} signal - Signal data
   */
  sendSignal(fromPeerId, toPeerId, signal) {
    const signalHandler = this.peers.get(toPeerId);
    if (signalHandler) {
      signalHandler({ type: 'signal', fromPeerId, signal });
    }
  }
} 