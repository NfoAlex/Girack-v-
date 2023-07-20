import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      devOptions: { enabled: true }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: ["localhost"],
    proxy: {
      "/socket.io": {
        target: "ws://localhost:33333",
        ws: true,
      },
      "/img": {
        target: "http://localhost:33333/",
        changeOrigin: true,
      },
      "/file": {
        target: "http://localhost:33333/",
        changeOrigin: true,
      }
    }
  }
})
