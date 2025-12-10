import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/Editeur-de-scene-WEBGPU/' : './',
  assetsInclude: ['**/*.wgsl'],
  server: {
    port: 5180,
    host: '127.0.0.1',
  },
})
