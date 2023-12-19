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
      devOptions: { enabled: true },
      manifest: {
        name: 'Girack(v)',
        short_name: 'Girack',
        lang: 'ja',
        description: 'Girack, where you communicate.',
        theme_color: '#381E72',
        background_color: '#121212',
        icons: [
          {
            src: './maskable_icon_x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: './pwa-icons/apple-touch-icon-120x120.png',
            sizes: '120x120',
            type: 'image/png'
          },
          {
            src: './pwa-icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: './pwa-icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: './icon.svg',
            sizes: '512x512',
            type: 'image/svg',
          }
        ]
      }
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
      },
      "/api": {
        target: "ws://localhost:22222/",
        ws: true,
      }
    }
  }
})
