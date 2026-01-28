import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api-proxy': {
        target: 'https://n8n-test.admazes.com/webhook',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, '')
      },
      '/api-test-proxy': {
        target: 'https://n8n-test.admazes.com/webhook-test',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-test-proxy/, '')
      }
    }
  }
})
