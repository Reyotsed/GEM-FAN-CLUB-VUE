import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia';
import store from './stores'
import { initCapacitor } from './utils/capacitor-init';

const app = createApp(App);

// 创建 Pinia 实例并安装到应用中
const pinia = createPinia();
app.use(pinia);
app.use(router);

app.mount('#app');

// 初始化 Capacitor 原生功能（仅在 APP 环境下生效，Web 端自动跳过）
initCapacitor(router);
