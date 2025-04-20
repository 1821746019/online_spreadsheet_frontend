<template>
  <aside class="sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="logo-container">
      <div class="logo">SZTU</div>
      <div class="logo-subtitle">在线表格编辑</div>
      <button class="collapse-btn" @click="toggleSidebar">
        {{ isCollapsed ? '→' : '←' }}
      </button>
    </div>
    <nav class="sidebar-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="menu-item"
        active-class="active"
      >
        <span class="menu-icon">{{ item.icon }}</span>
        <span class="menu-title">{{ item.title }}</span>
        <span class="menu-highlight"></span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue';

const isCollapsed = ref(false);

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};
// 暴露状态和方法
defineExpose({
  isCollapsed,
  toggleSidebar
});

// 菜单配置项
const menuItems = [
  { icon: "🏠", title: "首页", path: "/home" },
  { icon: "🏠", title: "课表编辑", path: "/home/editor" },
  { icon: "📊", title: "一般表格", path: "/home/form" },
  { icon: "📂", title: "读取CSV表格", path: "/home/read" },
  { icon: "📊", title: "课程表格数据", path: "/home/course" },
];
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 220px;
  background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
  color: #2d3748;
  z-index: 1000;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  border-right: 1px solid #cbd5e0;
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar.collapsed .logo-container {
  padding: 0 10px 20px;
}

.sidebar.collapsed .logo,
.sidebar.collapsed .logo-subtitle,
.sidebar.collapsed .menu-title {
  display: none;
}

.sidebar.collapsed .menu-item {
  justify-content: center;
  padding: 15px 0;
}

.sidebar.collapsed .menu-icon {
  margin-right: 0;
  font-size: 20px;
}

.logo-container {
  position: relative;
  padding: 0 20px 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(90deg, #3a7bd5, #00d2ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 5px;
}

.logo-subtitle {
  font-size: 12px;
  color: #718096;
  letter-spacing: 1px;
}

.collapse-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.3);
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: translateY(-50%) scale(1.1);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0 10px;
  flex-grow: 1;
}

.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: #4a5568;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.menu-item:hover {
  background: rgba(58, 123, 213, 0.1);
  color: #2c5fb3;
  transform: translateX(5px);
}

.menu-item.active {
  background: rgba(58, 123, 213, 0.15);
  color: #3a7bd5;
}

.menu-item.active .menu-highlight {
  width: 4px;
}

.menu-highlight {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0;
  background: linear-gradient(180deg, #3a7bd5, #00d2ff);
  transition: width 0.3s ease;
}

.menu-icon {
  margin-right: 12px;
  font-size: 18px;
  transition: transform 0.3s ease;
}

.menu-item:hover .menu-icon {
  transform: scale(1.1);
}

.menu-title {
  font-size: 14px;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 70px;
    padding: 15px 0;
  }

  .logo-container, .menu-title {
    display: none;
  }

  .menu-item {
    justify-content: center;
    padding: 15px 0;
  }

  .menu-icon {
    margin-right: 0;
    font-size: 20px;
  }

  .collapse-btn {
    display: none;
  }
}
</style>
