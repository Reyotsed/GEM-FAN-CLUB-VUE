import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia';
import { MotionPlugin } from 'motion-v';
import { trackEvent, EVENTS } from '@/utils/stats'
import { installFanMapMock } from '@/utils/fanMapMock'
import { registerSW } from 'virtual:pwa-register'

// 本地 mock：VITE_FAN_MAP_MOCK=1 或 localStorage.FAN_MAP_MOCK=1 时启用
installFanMapMock();

// PWA: register service worker; auto reload on new version
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // New content available: silently update on next idle navigation
    try { updateSW(true) } catch (_) {}
  },
  onOfflineReady() {
    try { trackEvent(EVENTS.PWA_OFFLINE_READY) } catch (_) {}
  },
});

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(MotionPlugin);

// 全局错误埋点：未捕获异常 / promise rejection / Vue 渲染错误
window.addEventListener('error', (event) => {
    try { trackEvent(EVENTS.ERROR_FRONTEND, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
    }) } catch (_) {}
})
window.addEventListener('unhandledrejection', (event) => {
    try { trackEvent(EVENTS.ERROR_FRONTEND, {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
    }) } catch (_) {}
})
app.config.errorHandler = (err, vm, info) => {
    try { trackEvent(EVENTS.ERROR_FRONTEND, {
        message: err?.message,
        stack: err?.stack,
        component: vm?.$options?.name,
        info: info
    }) } catch (_) {}
}

app.mount('#app');
