<template>
  <div id="app">
    <!-- 顶部导航栏 -->
    <nav class="app-header">
      <div class="header-content">
        <h1 class="logo">在线协同排课系统</h1>
        <div class="user-info">
          <span class="user-name">{{ currentUser.name }}</span>
          <span
            class="user-color-indicator"
            :style="{ backgroundColor: currentUser.color }"
          ></span>
        </div>
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="app-main">
      <EditorView />
    </main>

    <!-- 全局提示 -->
    <div v-if="collaborators.length > 0" class="collaborators-hint">
      当前有 {{ collaborators.length }} 位协作者在线
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/schedule'
import EditorView from '@/views/EditorView.vue'

const store = useScheduleStore()
const { currentUser, collaborators } = storeToRefs(store)
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  max-width: 1300px;
  margin: 0 auto;
  width: 100%;
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
