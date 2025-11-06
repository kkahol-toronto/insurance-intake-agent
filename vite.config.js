import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3030,
    open: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './assets')
    },
    // Force d3-selection v3 for ReactFlow
    dedupe: ['d3-selection', 'd3-zoom']
  },
  optimizeDeps: {
    include: ['reactflow', 'd3-selection@3.0.0', 'd3-zoom@3.0.0'],
    force: true
  }
})
