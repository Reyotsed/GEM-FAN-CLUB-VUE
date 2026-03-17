import { isNative, isAndroid } from './platform';

/**
 * 初始化 Capacitor 原生功能
 * 仅在原生 APP 环境下执行，Web 端自动跳过
 */
export async function initCapacitor(router) {
  if (!isNative) return;

  // 动态导入原生插件（Web 端不需要加载这些模块）
  const [
    { StatusBar, Style },
    { SplashScreen },
    { App }
  ] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/app'),
  ]);

  // ======== 状态栏配置 ========
  try {
    // 设置状态栏为沉浸式透明 + 亮色文字（配合深色主题）
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0a0a12' });
    // 让内容延伸到状态栏下方（沉浸式体验）
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch (e) {
    console.warn('StatusBar init failed:', e);
  }

  // ======== 启动页 ========
  try {
    // 等 Vue 应用挂载后再隐藏启动页
    await SplashScreen.hide();
  } catch (e) {
    console.warn('SplashScreen hide failed:', e);
  }

  // ======== Android 返回键处理 ========
  if (isAndroid) {
    App.addListener('backButton', ({ canGoBack }) => {
      if (router && router.currentRoute.value.path !== '/' && canGoBack) {
        // 如果不在首页，执行路由后退
        router.back();
      } else {
        // 在首页，最小化 APP（而不是直接退出）
        App.minimizeApp();
      }
    });
  }

  // ======== App 状态监听（前台/后台切换） ========
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      // APP 回到前台，可以做刷新 token 等操作
      console.log('App 回到前台');
    } else {
      console.log('App 进入后台');
    }
  });
}
