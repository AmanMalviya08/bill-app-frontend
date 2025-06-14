import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://bill-app-backend-1.onrender.com', // your local backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
