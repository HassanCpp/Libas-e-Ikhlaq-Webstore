import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      // Proxy static images and invoices to the backend
      '^/.*\\.(png|jpg|jpeg|gif|webp|pdf)$': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  }
})
