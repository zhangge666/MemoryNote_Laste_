import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './index.css';
import { pluginService } from './services/plugins/pluginService';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// 初始化插件服务
async function initializeApp() {
  try {
    await pluginService.initialize();
    console.log('Plugin service initialized');
  } catch (error) {
    console.error('Failed to initialize plugin service:', error);
  }
  
  app.mount('#app');
}

initializeApp();
