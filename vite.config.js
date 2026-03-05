import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      vue(),
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

    define: {
      'process.env.VUE_APP_BASEURL': JSON.stringify(env.VUE_APP_BASEURL || '')
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
            // ECharts (large library, isolate it)
            if (id.includes('node_modules/echarts/') ||
              id.includes('node_modules/zrender/')) {
              return 'echarts-vendor';
            }
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
