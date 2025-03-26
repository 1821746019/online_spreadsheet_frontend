<template>
  <aside class="sidebar">
    <div class="logo-container">
      <div class="logo">SZTU</div>
      <div class="logo-subtitle">在线表格编辑</div>
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
// 菜单配置项
const menuItems = [
  { icon: "🏠", title: "首页", path: "/" },
  { icon: "📂", title: "读取CSV表格", path: "/read" },
  { icon: "📊", title: "表格", path: "/form" },
  { icon: "🔑", title: "登录", path: "/login" }
];
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 220px;
  background: linear-gradient(180deg, #2c3e50 0%, #1a2530 100%);
  color: white;
  z-index: 1000;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}

.logo-container {
  padding: 0 20px 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 5px;
}

.logo-subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
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
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  transform: translateX(5px);
}

.menu-item.active {
  background: rgba(102, 126, 234, 0.2);
  color: white;
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
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
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
}
</style>
