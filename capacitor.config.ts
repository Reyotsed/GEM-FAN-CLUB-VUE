import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gemfanclub.app',
  appName: 'GEM Fan Club',
  webDir: 'dist',
  // Android 配置
  android: {
    // 允许混合内容（HTTP + HTTPS）
    allowMixedContent: true,
  },
  server: {
    // 允许在 APP 内导航到外部链接
    allowNavigation: ['gemfanclub.com', '140.143.246.54:*', 'localhost:*'],
    // 允许 HTTP 明文传输（你的后端用的是 HTTP）
    cleartext: true,
  },
  plugins: {
    // 启动页配置
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a12',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    // 状态栏配置
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0a0a12',
    },
  },
};

export default config;
