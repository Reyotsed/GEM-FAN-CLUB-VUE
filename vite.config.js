import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'img/icon/apple-touch-icon.png',
          'default-avatar.svg',
          'vite.svg',
        ],
        manifest: {
          name: 'GEM Fan Club | 棋士的小窝',
          short_name: 'GEM Fan Club',
          description: '棋士搭的非官方小站，聊聊邓紫棋、晒晒演唱会、做做生日海报。',
          theme_color: '#0a0a12',
          background_color: '#0a0a12',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          lang: 'zh-CN',
          categories: ['entertainment', 'music', 'social'],
          icons: [
            { src: '/img/icon/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/img/icon/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/img/icon/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
          // Skip very large province GeoJSON / hero images to keep precache small
          globIgnores: ['**/data/province/**', '**/img/posterBg/**'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/data/'),
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'gem-data', expiration: { maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 } },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/img/'),
              handler: 'CacheFirst',
              options: { cacheName: 'gem-img', expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 } },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 } },
            },
            {
              urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'cdnjs', expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 } },
            },
            {
              // 每日猜歌：对局/榜单/音频都随玩家与时间变化，弱网时回退到旧缓存会显示过期状态（甚至让已完成的题重玩），
              // 因此一律走网络、不缓存。必须放在下面通用 /api/ 规则之前（Workbox 按声明顺序匹配）。
              urlPattern: ({ url }) => url.pathname.startsWith('/api/daily-guess/'),
              handler: 'NetworkOnly',
            },
            {
              // API requests: network-first, fallback to cache
              urlPattern: ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/rag/'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'gem-api',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
      ViteImageOptimizer({
        test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
        includePublic: true,
        logStats: true,
        jpeg: {
          quality: 80,
        },
        png: {
          quality: 80,
        },
        webp: {
          quality: 80,
        },
        avif: {
          quality: 80,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },

    // ========== Build Optimization ==========
    build: {
      // Enable CSS code splitting
      cssCodeSplit: true,

      // Warn when chunk size exceeds 500KB
      chunkSizeWarningLimit: 500,

      // Rollup options for code splitting
      rollupOptions: {
        output: {
          // Manual chunk splitting strategy
          manualChunks(id) {
            // Vue core: vue, vue-router, pinia
            if (id.includes('node_modules/vue/') ||
              id.includes('node_modules/@vue/') ||
              id.includes('node_modules/vue-router/') ||
              id.includes('node_modules/pinia/')) {
              return 'vue-vendor';
            }
            // ECharts is now lazily loaded via dynamic import() —
            // Vite will auto-split it into separate async chunks.
            // Other third-party libs
            if (id.includes('node_modules/axios/')) {
              return 'axios-vendor';
            }
            if (id.includes('node_modules/@yeger/') ||
              id.includes('node_modules/vue-waterfall-easy/')) {
              return 'layout-vendor';
            }
          },
          // Naming pattern for better caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },

      // Minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
        },
      },
    },
  }
})
