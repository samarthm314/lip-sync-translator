# Real-Time Lip-Synced 3D Avatar Translator

A browser-based peer-to-peer translation system with 3D avatar lip-sync capabilities.

## 🎯 Project Overview

This system enables real-time voice translation between two users with animated 3D avatars that lip-sync to the translated audio. The entire pipeline runs on-device using WebAssembly models for privacy and low latency.

### Key Features
- **Real-time P2P Communication**: WebRTC-based peer-to-peer connection
- **On-Device AI Pipeline**: STT → MT → TTS running entirely in browser
- **3D Avatar Lip-Sync**: Three.js avatars with phoneme-driven lip animation
- **Multi-language Support**: English ↔ Spanish (French planned)
- **Live Transcripts**: Real-time text display of conversations

## 🏗️ System Architecture

```
┌─────────────────┐    WebRTC    ┌─────────────────┐
│   User Device 1 │ ◄──────────► │   User Device 2 │
└─────────────────┘              └─────────────────┘
         │                                │
         ▼                                ▼
┌─────────────────────────────────────────────────────────┐
│                    On-Device Pipeline                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │   STT   │─►│   MT    │─►│   TTS   │─►│  Lip-Sync   │ │
│  │ (WASM)  │  │ (WASM)  │  │ (WASM)  │  │ (Visemes)   │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────┘
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│  Three.js UI    │              │  Three.js UI    │
│  - Avatar       │              │  - Avatar       │
│  - Transcript   │              │  - Transcript   │
│  - Controls     │              │  - Controls     │
└─────────────────┘              └─────────────────┘
```

## 📁 Project Structure

```
lip-sync-translator/
├── public/
│   ├── models/           # 3D avatar models
│   ├── wasm/            # ONNX/WASM models
│   └── index.html       # Main HTML file
├── src/
│   ├── components/      # React components
│   │   ├── Avatar.jsx   # 3D avatar component
│   │   ├── Transcript.jsx # Live transcript display
│   │   ├── Controls.jsx # Language/avatar controls
│   │   └── CallUI.jsx   # Main call interface
│   ├── services/        # Core services
│   │   ├── audio.js     # Audio capture & processing
│   │   ├── stt.js       # Speech-to-Text service
│   │   ├── mt.js        # Machine Translation service
│   │   ├── tts.js       # Text-to-Speech service
│   │   ├── lipSync.js   # Lip-sync animation
│   │   └── webrtc.js    # P2P connection
│   ├── utils/           # Utilities
│   │   ├── phonemes.js  # Phoneme mapping
│   │   ├── visemes.js   # Viseme definitions
│   │   └── audioUtils.js # Audio processing utilities
│   ├── models/          # Data models
│   │   ├── Avatar.js    # Avatar model definitions
│   │   └── Language.js  # Language configurations
│   ├── App.jsx          # Main application
│   └── main.jsx         # Entry point
├── package.json
├── vite.config.js       # Build configuration
└── README.md
```

## 🚀 Implementation Plan

### Week 1: Foundation & STT/TTS Proof-of-Concept
- [x] Project setup with Vite + React
- [ ] Audio capture and processing pipeline
- [ ] Basic STT integration (Whisper.js or similar)
- [ ] Basic TTS integration (Web Speech API fallback)
- [ ] Simple audio streaming between peers

### Week 2: WebRTC Integration & Translation
- [ ] P2P connection setup with WebRTC
- [ ] Machine translation service (ONNX models)
- [ ] End-to-end audio pipeline testing
- [ ] Basic UI for connection management

### Week 3: 3D Avatar & Lip-Sync
- [ ] Three.js avatar loading and rendering
- [ ] Phoneme-to-viseme mapping
- [ ] Lip-sync animation system
- [ ] Avatar selection interface

### Week 4: Polish & Language Support
- [ ] UI/UX improvements
- [ ] Language toggle functionality
- [ ] Performance optimization
- [ ] Testing and bug fixes

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite
- **3D Graphics**: Three.js
- **Audio Processing**: Web Audio API
- **AI Models**: ONNX Runtime Web (STT/MT/TTS)
- **Networking**: WebRTC
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

## 🎮 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📋 Requirements Checklist

- [ ] Browser-based (Chrome/Firefox support)
- [ ] On-device STT/MT/TTS pipeline
- [ ] WebRTC P2P communication
- [ ] Three.js 3D avatar rendering
- [ ] Real-time lip-sync animation
- [ ] English ↔ Spanish translation
- [ ] Live transcript display
- [ ] Avatar selection interface
- [ ] ≤200ms audio latency
- [ ] 30 FPS avatar rendering

## 🔧 Development Notes

- Use WebAssembly models for on-device processing
- Implement audio buffering for smooth playback
- Optimize 3D rendering for consistent frame rates
- Handle network connectivity gracefully
- Provide fallback options for unsupported features 