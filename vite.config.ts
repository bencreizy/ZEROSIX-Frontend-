import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'wss',   // Fixes the WebSocket closed error
      clientPort: 443,   // Routes through the tunnel
    },
  },
});
