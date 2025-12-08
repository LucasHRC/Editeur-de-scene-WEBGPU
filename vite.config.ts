import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  assetsInclude: ['**/*.wgsl'],
  server: {
    port: 5180,
    host: '127.0.0.1',
  },
})
