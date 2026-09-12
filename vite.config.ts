import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

/**
 * `DEPLOY_TARGET` picks the base path:
 *   pages  → served from https://<user>.github.io/focusflow/
 *   tauri  → loaded from the local asset protocol, must be root-relative
 *   (unset) → dev server and `npm run preview`
 */
const target = process.env.DEPLOY_TARGET ?? 'local'
const base = target === 'pages' ? '/focusflow/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The desktop build is already offline by nature; a service worker inside
      // Tauri's custom protocol adds nothing and complicates updates. Disabled
      // still provides a no-op `virtual:pwa-register/react`, so App.tsx compiles.
      disable: target === 'tauri',
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.ico', 'icons/apple-touch-icon.png'],
      manifest: {
        id: 'focusflow',
        name: 'FocusFlow — ADHD planner & journal',
        short_name: 'FocusFlow',
        description:
          'A calm daily planner, introspection journal, and weekly/monthly/yearly progress tracker built for ADHD brains. Works fully offline; your data never leaves the device.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0b1211',
        theme_color: '#0b1211',
        categories: ['productivity', 'lifestyle', 'health'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Today', url: '#/today' },
          { name: 'Journal', url: '#/journal' },
          { name: 'New Me', url: '#/newme' },
        ],
      },
      workbox: {
        // The whole app shell is precached, so a cold start with no network works.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Google Fonts stylesheet — fall back to cache when offline.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            // The font files themselves never change; cache them for a year.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cover images and GIFs pasted in by URL.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'user-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
