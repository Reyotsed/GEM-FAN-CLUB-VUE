import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia';
import store from './stores'
const app = createApp(App);

// 创建 Pinia 实例并安装到应用中
const pinia = createPinia();
app.use(pinia);
app.use(store);
app.use(router);

app.mount('#app');
