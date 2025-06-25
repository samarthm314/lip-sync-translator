import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    https: false
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          onnx: ['onnxruntime-web'],
          webrtc: ['simple-peer']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['three', 'onnxruntime-web', 'simple-peer']
  }
}) 