# Lip-Sync Translator Implementation Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open in Browser
Navigate to `http://localhost:3000`

## 📋 Current Implementation Status

### ✅ Completed Features
- **Project Structure**: Complete React + Vite setup with Tailwind CSS
- **Audio Processing**: Microphone capture and audio playback utilities
- **WebRTC Integration**: Peer-to-peer connection framework
- **UI Components**: Complete React component library
- **Language Management**: Multi-language support system
- **Avatar System**: 3D avatar loading and management
- **Lip-Sync Framework**: Phoneme-to-viseme mapping system
- **Fallback Services**: Web Speech API and dictionary translation

### 🔄 In Progress
- **ONNX Model Integration**: Real on-device AI models
- **3D Avatar Models**: Actual GLB files with lip-sync morph targets
- **WebRTC Signaling**: Complete peer-to-peer connection

### 📝 TODO
- **Performance Optimization**: Audio buffering and latency reduction
- **Error Handling**: Comprehensive error recovery
- **Testing**: Unit and integration tests
- **Documentation**: API documentation and user guides

## 🏗️ Architecture Overview

### Core Services
1. **AudioCapture**: Microphone input and processing
2. **AudioPlayback**: Translated audio output
3. **STTService**: Speech-to-Text conversion
4. **MTService**: Machine Translation
5. **TTSService**: Text-to-Speech synthesis
6. **WebRTCService**: Peer-to-peer communication
7. **LipSyncService**: Avatar animation control

### Data Flow
```
Microphone → AudioCapture → STT → MT → TTS → AudioPlayback
                                    ↓
                              LipSync → Avatar Animation
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file:
```env
VITE_APP_TITLE=Lip-Sync Translator
VITE_APP_VERSION=1.0.0
VITE_APP_DEBUG=true
```

### Audio Settings
Modify `src/utils/audioUtils.js`:
```javascript
export const AUDIO_CONFIG = {
  sampleRate: 16000,    // Whisper model requirement
  channels: 1,          // Mono audio
  bufferSize: 4096,     // Processing buffer
  encoding: 'opus',     // Audio codec
  bitrate: 32000        // Bitrate for transmission
};
```

### Language Support
Add new languages in `src/models/Language.js`:
```javascript
export const SUPPORTED_LANGUAGES = {
  'de': {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    // ... other properties
  }
};
```

## 🎨 Customization

### Styling
The app uses Tailwind CSS. Customize in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#your-color',
        // ... other shades
      }
    }
  }
}
```

### Avatar Models
1. Create GLB files with morph targets
2. Add to `src/models/Avatar.js`:
```javascript
export const AVATAR_MODELS = {
  'your-avatar': {
    id: 'your-avatar',
    name: 'Your Avatar',
    path: '/models/your-avatar.glb',
    // ... other properties
  }
};
```

### Lip-Sync Mapping
Customize phoneme mapping in `src/utils/phonemes.js`:
```javascript
export const VISEMES = {
  'YOUR_VISEME': 'your_blend_shape_name',
  // ... other mappings
};
```

## 🔌 API Integration

### ONNX Models
To use real ONNX models:

1. **Download Models**:
   - Whisper STT: https://huggingface.co/openai/whisper-tiny
   - Marian MT: https://huggingface.co/Helsinki-NLP/opus-mt-en-es
   - Tacotron2 TTS: https://huggingface.co/facebook/fastspeech2-en-ljspeech

2. **Convert to ONNX**:
   ```python
   import torch
   from transformers import WhisperProcessor, WhisperForConditionalGeneration
   
   # Load model
   model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-tiny")
   processor = WhisperProcessor.from_pretrained("openai/whisper-tiny")
   
   # Convert to ONNX
   torch.onnx.export(model, dummy_input, "whisper-tiny.onnx")
   ```

3. **Place in `/public/wasm/`**:
   - whisper-tiny.onnx
   - whisper-vocab.json
   - marian-mt-en-es.onnx
   - marian-vocab.json
   - tacotron2-tts.onnx
   - tacotron2-vocab.json

### WebRTC Signaling
For production, implement a signaling server:

```javascript
// Example signaling server (Node.js + Socket.IO)
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected');
  });
  
  socket.on('signal', (data) => {
    socket.to(data.roomId).emit('signal', data.signal);
  });
});
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Manual Testing
1. **Audio Capture**: Test microphone permissions
2. **Translation**: Verify language switching
3. **Avatar**: Check 3D rendering and animations
4. **WebRTC**: Test peer-to-peer connection

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

## 🔍 Debugging

### Enable Debug Mode
Set `VITE_APP_DEBUG=true` in `.env`

### Browser Console
Key debug messages:
- `Initializing lip-sync translator services...`
- `STT service initialized successfully`
- `WebRTC connection established`
- `Lip-sync animation started`

### Performance Monitoring
```javascript
// Monitor audio latency
console.log('Audio latency:', audioLatency);

// Monitor translation time
console.log('Translation time:', translationTime);

// Monitor avatar FPS
console.log('Avatar FPS:', avatarFPS);
```

## 📚 Additional Resources

### Documentation
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

### Libraries
- [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/web/)
- [Simple Peer](https://github.com/feross/simple-peer)
- [Lucide React](https://lucide.dev/guide/packages/lucide-react)

### Model Sources
- [Hugging Face](https://huggingface.co/) - Pre-trained models
- [ONNX Model Zoo](https://github.com/onnx/models) - ONNX models
- [Three.js Examples](https://threejs.org/examples/) - 3D models

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes
4. Add tests
5. Submit a pull request

### Code Style
- Use ESLint and Prettier
- Follow React best practices
- Write meaningful commit messages
- Add JSDoc comments for functions

### Testing Checklist
- [ ] Audio capture works
- [ ] Translation is accurate
- [ ] Avatar animations are smooth
- [ ] WebRTC connection is stable
- [ ] UI is responsive
- [ ] Error handling works
- [ ] Performance is acceptable

## 📞 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details
4. Include browser console logs
5. Provide reproduction steps

## 🎯 Roadmap

### Phase 1: Core Features ✅
- Basic audio capture and playback
- Simple translation pipeline
- 3D avatar rendering
- WebRTC connection

### Phase 2: Advanced Features 🚧
- Real ONNX models
- Advanced lip-sync
- Multiple avatars
- Language expansion

### Phase 3: Production Ready 📋
- Performance optimization
- Comprehensive testing
- Production deployment
- User documentation

### Phase 4: Enterprise Features 🔮
- Multi-user support
- Advanced analytics
- Custom model training
- API integration 