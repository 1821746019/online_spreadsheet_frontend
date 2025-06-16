<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <nav class="app-header":style="{ marginLeft: sidebarMargin }">
      <div class="header-content">
        <div class="logo-container">
          <h1 class="logo">在线表格编辑系统</h1>
        </div>
        <div class="user-info">
          <template v-if="auth.$state.token">
            <span class="user-name">{{ auth.$state.user?.username }}</span>
            <span class="user-color-indicator"
              :style="{ backgroundColor: auth.$state.user?.color || '#667eea', boxShadow: `0 0 0 2px ${getContrastColor(auth.$state.user?.color || '#667eea')}` }"></span>
            <button @click="handleLogout" class="logout-button">
              <span>退出登录</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </template>
          <router-link v-else to="/login" class="login-button">登录</router-link>
        </div>
      </div>
      <div class="header-gradient"></div>
    </nav>

    <GlobalSidebar ref="sidebar"/>

    <!-- 主内容区 -->
    <main class="app-main" :style="{ marginLeft: sidebarMargin }">
      <router-view></router-view>
    </main>

  </div>
</template>

<script lang='ts' setup>
import GlobalSidebar from '../components/SideBar.vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';

const sidebar = ref<InstanceType<typeof GlobalSidebar> | null>(null);

// 计算侧边栏的margin
const sidebarMargin = computed(() => {
  return sidebar.value?.isCollapsed ? '70px' : '220px';
});
const auth = useAuthStore()
const router = useRouter();

const handleLogout = async () => {
  const loginPath = auth.logout();
   router.push(await loginPath);
};

// 获取对比色函数
const getContrastColor = (hexColor: string) => {
  // 这里可以添加更复杂的对比色计算逻辑
  return hexColor ? '#ffffff' : 'rgba(255,255,255,0.2)';
};
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8fafc;
}

.app-header {
  background: white;
  color: black;
  padding: 0.8rem 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 900;
  transition: margin-left 0.3s ease;
}

.header-gradient {
  height: 4px;
  width: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  position: absolute;
  bottom: 0;
  left: 0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-container {
  display: flex;
  flex-direction: column;
}

.logo {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(90deg, #2d3748 0%, #4a5568 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.logo-subtitle {
  font-size: 0.75rem;
  color: #718096;
  margin-top: 2px;
  letter-spacing: 0.5px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  font-weight: 500;
  color: #2d3748;
}

.user-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #e53e3e;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background: rgba(229, 62, 62, 0.1);
  transform: translateX(2px);
}

.logout-button svg {
  transition: transform 0.2s ease;
}

.logout-button:hover svg {
  transform: translateX(2px);
}

.login-button {
  color: #667eea;
  font-weight: 500;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.login-button:hover {
  background: rgba(102, 126, 234, 0.1);
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1800px;
  margin: 0 auto;
  transition: margin-left 0.3s ease;
}

.collaborators-hint {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  color: #2d3748;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  overflow: hidden;
}

.hint-content {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: rgba(72, 187, 120, 0.1);
  border-radius: 12px;
  gap: 8px;
}

.online-dots {
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: #48bb78;
  border-radius: 50%;
  animation: pulse 1.5s infinite ease-in-out;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes slideIn {
  from {
    transform: translateY(100%) translateX(20px);
    opacity: 0;
  }

  to {
    transform: translateY(0) translateX(0);
    opacity: 1;
  }
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }

  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-header {
    margin-left: 70px !important;
  }

  .app-main {
    margin-left: 70px !important;
    width: calc(100% - 70px);
    padding: 1rem;
  }

  .logo-subtitle {
    display: none;
  }

  .user-name {
    display: none;
  }
}
</style>
