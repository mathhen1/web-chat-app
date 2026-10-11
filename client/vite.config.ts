import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({ compiler: true }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:1414',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/socket.io': {
        target: 'http://localhost:1414',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
