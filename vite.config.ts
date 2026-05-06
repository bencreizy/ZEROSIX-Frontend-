import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'wss',   // Use Secure WebSockets for the tunnel
      clientPort: 443,   // Route through standard HTTPS port
    },
  },
  // Ensure assets are handled correctly in the cloud IDE
  base: './',
});
