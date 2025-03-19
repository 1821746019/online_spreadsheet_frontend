// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { initSocket } from './utils/socket' // 新增导入
import router from './router'
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

app.use(router)
// 在 Pinia 初始化之后初始化 socket
initSocket()

app.mount('#app')
