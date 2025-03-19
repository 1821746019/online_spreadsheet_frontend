<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <nav class="app-header">
      <div class="header-content">
        <h1 class="logo">多人在线表格编辑系统</h1>
        <div class="user-info">
          <span class="user-name">{{ currentUser.name }}</span>
          <span
            class="user-color-indicator"
            :style="{ backgroundColor: currentUser.color }"
          ></span>
        </div>
      </div>
    </nav>
    <GlobalSidebar />
    <!-- 主内容区 -->
    <main class="app-main">
      <router-view ></router-view>
    </main>

    <!-- 全局提示 -->
    <div v-if="collaborators.length > 0" class="collaborators-hint">
      当前有 {{ collaborators.length }} 位协作者在线
    </div>


  </div>
</template>

<script lang='ts' setup>
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/schedule'
import  GlobalSidebar from './components/SideBar.vue'

const store = useScheduleStore()
const { currentUser, collaborators } = storeToRefs(store)
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #fff;
  color: black;
  padding: 1rem 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-left: 200px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1800px;
  margin: 0 auto;
  width: 100%;
  margin-left: 200px;
}

.collaborators-hint {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #4CAF50;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
