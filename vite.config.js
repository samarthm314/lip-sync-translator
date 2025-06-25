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
    include: ['three', 'onnxruntime-web', 'simple-peer'],
    needsInterop: ['onnxruntime-web', 'simple-peer']
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.version': '"v16.0.0"',
    'process.platform': '"browser"',
    'process.stdout': 'null',
    'process.stderr': 'null',
    'process.stdin': 'null',
    'process.nextTick': '(cb) => setTimeout(cb, 0)',
    'process.browser': 'true',
    'process.node': 'false'
  },
  resolve: {
    alias: {
      'events': 'events',
      'util': 'util',
      'buffer': 'buffer',
      'process': 'process'
    }
  }
}) 