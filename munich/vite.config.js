import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3031,
    open: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './assets')
    },
    dedupe: ['d3-selection', 'd3-zoom']
  },
  optimizeDeps: {
    include: ['reactflow', 'd3-selection@3.0.0', 'd3-zoom@3.0.0'],
    force: true
  }
})

