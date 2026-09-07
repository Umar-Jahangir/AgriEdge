import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Enables local network access for smartphones (e.g. http://192.168.x.x:5173)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
