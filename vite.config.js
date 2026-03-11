import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'mesenet.hu',
        short_name: 'Mesenet',
        description: 'Digitális meseolvasó gyerekeknek',
        start_url: '/',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cacheId: 'mesenet-pwa-v2-https', // Force service worker cache bust for HTTPS
        cleanupOutdatedCaches: true, // Auto-remove old HTTP caches
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Ensure index.html fallback for client-side routing while offline
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/]
      }
    })
  ],
  server: {
    allowedHosts: true,
  },
})
