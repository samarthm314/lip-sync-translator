import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Avatar from './components/Avatar.jsx';
import Transcript from './components/Transcript.jsx';
import Controls from './components/Controls.jsx';
import CallUI from './components/CallUI.jsx';
import { AudioCapture, AudioPlayback } from './utils/audioUtils.js';
import { STTService, WebSpeechSTT } from './services/stt.js';
import { MTService, DictionaryMT } from './services/mt.js';
import { TTSService, WebSpeechTTS } from './services/tts.js';
import { WebRTCService } from './services/webrtc.js';
import { LipSyncService } from './services/lipSync.js';
import { LanguageManager } from './models/Language.js';
import { AvatarManager } from './models/Avatar.js';

function App() {
  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState('default');
  const [transcripts, setTranscripts] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  // Service instances
  const [audioCapture, setAudioCapture] = useState(null);
  const [audioPlayback, setAudioPlayback] = useState(null);
  const [sttService, setSttService] = useState(null);
  const [mtService, setMtService] = useState(null);
  const [ttsService, setTtsService] = useState(null);
  const [webrtcService, setWebrtcService] = useState(null);
  const [lipSyncService, setLipSyncService] = useState(null);
  const [languageManager, setLanguageManager] = useState(null);
  const [avatarManager, setAvatarManager] = useState(null);

  // Initialize services
  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      console.log('Initializing lip-sync translator services...');

      // Initialize language manager
      const langManager = new LanguageManager();
      setLanguageManager(langManager);

      // Initialize audio services
      const capture = new AudioCapture();
      const playback = new AudioPlayback();
      setAudioCapture(capture);
      setAudioPlayback(playback);

      // Initialize AI services (with fallbacks)
      let stt, mt, tts;

      try {
        stt = new STTService();
        await stt.initialize();
      } catch (error) {
        console.warn('ONNX STT failed, using Web Speech API fallback');
        stt = new WebSpeechSTT();
        await stt.initialize();
      }

      try {
        mt = new MTService();
        await mt.initialize();
      } catch (error) {
        console.warn('ONNX MT failed, using dictionary fallback');
        mt = new DictionaryMT();
      }

      try {
        tts = new TTSService();
        await tts.initialize();
      } catch (error) {
        console.warn('ONNX TTS failed, using Web Speech API fallback');
        tts = new WebSpeechTTS();
        await tts.initialize();
      }

      setSttService(stt);
      setMtService(mt);
      setTtsService(tts);

      // Initialize WebRTC service
      const webrtc = new WebRTCService();
      setWebrtcService(webrtc);

      // Initialize lip-sync service
      const lipSync = new LipSyncService();
      await lipSync.initialize();
      setLipSyncService(lipSync);

      setIsInitialized(true);
      console.log('All services initialized successfully');

    } catch (error) {
      console.error('Failed to initialize services:', error);
      setError('Failed to initialize application. Please refresh the page.');
    }
  };

  // Handle audio capture
  const handleAudioData = useCallback(async (audioBlob) => {
    if (!isCallActive || !isRecording) return;

    try {
      // Send audio to peer
      webrtcService?.sendAudio(audioBlob);

      // Process audio locally for transcript
      const audioData = await audioBlob.arrayBuffer();
      const transcript = await sttService?.transcribe(audioData, languageManager?.getSourceLanguage().code);
      
      if (transcript) {
        addTranscript(transcript, 'local', languageManager?.getSourceLanguage().code);
        
        // Translate
        const translated = await mtService?.translate(
          transcript,
          languageManager?.getSourceLanguage().code,
          languageManager?.getTargetLanguage().code
        );
        
        if (translated) {
          addTranslation(transcript, translated);
          
          // Generate speech
          const audio = await ttsService?.synthesize(translated, languageManager?.getTargetLanguage().code);
          if (audio) {
            // Play translated audio
            await audioPlayback?.playAudio(audio);
            
            // Generate lip-sync
            const visemeSequence = lipSyncService?.generateLipSyncFromText(
              translated,
              languageManager?.getTargetLanguage().code
            );
            lipSyncService?.startLipSync(visemeSequence);
          }
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  }, [isCallActive, isRecording, webrtcService, sttService, mtService, ttsService, audioPlayback, lipSyncService, languageManager]);

  // Handle incoming audio from peer
  const handlePeerAudio = useCallback(async (audioBase64) => {
    try {
      const audioBlob = webrtcService?.convertBase64ToAudio(audioBase64);
      if (audioBlob) {
        await audioPlayback?.playAudio(audioBlob);
      }
    } catch (error) {
      console.error('Error playing peer audio:', error);
    }
  }, [webrtcService, audioPlayback]);

  // Add transcript
  const addTranscript = (text, source, language) => {
    const transcript = {
      id: Date.now(),
      text,
      source,
      language,
      timestamp: new Date().toISOString()
    };
    setTranscripts(prev => [...prev, transcript]);
  };

  // Add translation
  const addTranslation = (original, translated) => {
    const translation = {
      id: Date.now(),
      original,
      translated,
      timestamp: new Date().toISOString()
    };
    setTranslations(prev => [...prev, translation]);
  };

  // Start call
  const startCall = async (isInitiator = false) => {
    try {
      // Initialize audio capture
      await audioCapture?.initialize(handleAudioData);
      
      // Initialize WebRTC
      await webrtcService?.initialize(isInitiator);
      webrtcService.onAudioData = handlePeerAudio;
      webrtcService.onConnectionStateChange = (state) => {
        setIsConnected(state === 'connected');
      };
      
      setIsCallActive(true);
    } catch (error) {
      console.error('Failed to start call:', error);
      setError('Failed to start call. Please check your microphone permissions.');
    }
  };

  // End call
  const endCall = () => {
    audioCapture?.stopRecording();
    audioCapture?.cleanup();
    webrtcService?.disconnect();
    lipSyncService?.stopLipSync();
    
    setIsCallActive(false);
    setIsConnected(false);
    setIsRecording(false);
    setIsPlaying(false);
  };

  // Start recording
  const startRecording = () => {
    audioCapture?.startRecording();
    setIsRecording(true);
  };

  // Stop recording
  const stopRecording = () => {
    audioCapture?.stopRecording();
    setIsRecording(false);
  };

  // Change avatar
  const changeAvatar = (avatarId) => {
    setCurrentAvatar(avatarId);
  };

  // Change language
  const changeLanguage = (sourceCode, targetCode) => {
    languageManager?.setSourceLanguage(sourceCode);
    languageManager?.setTargetLanguage(targetCode);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioCapture?.cleanup();
      audioPlayback?.cleanup();
      sttService?.cleanup();
      mtService?.cleanup();
      ttsService?.cleanup();
      webrtcService?.cleanup();
      lipSyncService?.cleanup();
      avatarManager?.cleanup();
    };
  }, [audioCapture, audioPlayback, sttService, mtService, ttsService, webrtcService, lipSyncService, avatarManager]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="card max-w-md text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="card max-w-md text-center">
          <div className="animate-pulse-slow text-blue-600 text-6xl mb-4">🎤</div>
          <h2 className="text-xl font-semibold mb-2">Initializing...</h2>
          <p className="text-gray-600">Loading AI models and services</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* 3D Avatar Scene */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 1.6, 3], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Environment preset="studio" />
          
          <Avatar 
            avatarId={currentAvatar}
            lipSyncService={lipSyncService}
            isConnected={isConnected}
          />
          
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={10}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </div>

      {/* UI Overlays */}
      <CallUI
        isCallActive={isCallActive}
        isConnected={isConnected}
        isRecording={isRecording}
        onStartCall={() => startCall(true)}
        onJoinCall={() => startCall(false)}
        onEndCall={endCall}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
      />

      <Transcript 
        transcripts={transcripts}
        translations={translations}
        isVisible={isCallActive}
      />

      <Controls
        currentAvatar={currentAvatar}
        languageManager={languageManager}
        onAvatarChange={changeAvatar}
        onLanguageChange={changeLanguage}
        isVisible={isCallActive}
      />
    </div>
  );
}

export default App; 