import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path';
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载env文件
  const env = loadEnv(mode, process.cwd());
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src') // 设置 '@' 指向 'src' 目录
      }
    },
    define: {
      // 为客户端代码提供环境变量
      'process.env.VUE_APP_BASEURL': JSON.stringify(env.VUE_APP_BASEURL || ''),
      'process.env.VUE_APP_API_PREFIX': JSON.stringify(env.VUE_APP_API_PREFIX || '')
    }
  }
})
