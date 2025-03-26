// eslint-disable-next-line vue/multi-word-component-names
<template>
  <aside class="sidebar">
    <div class="logo">SZTU</div>
    <nav>
      <router-link v-for="item in menuItems" :key="item.path" :to="item.path" class="menu-item">
        <span class="icon">{{ item.icon }}</span>
        <span class="title">{{ item.title }}</span>
      </router-link>
      <button @click="handleLogout" >
        退出登录
    </button>
    </nav>
  </aside>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();
};
// 菜单配置项
const menuItems = [
  { icon: "🏠", title: "首页", path: "/" },
  { icon: "📂", title: "读取CSV表格", path: "/read" },
  { icon: "⚙️", title: "表格", path: "/form" },
  { icon: "⚙️", title: "登录", path: "/login" }
];
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 175px;
  background: #2c3e50;
  color: white;
  z-index: 1000;
}

.logo {
  font-size: 24px;
  margin-bottom: 30px;
  padding: 10px;
  border-bottom: 1px solid #34495e;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: 0.3s;
}

.menu-item:hover {
  background: #34495e;
}

.menu-item.router-link-exact-active {
  background: #3498db;
}

.icon {
  margin-right: 10px;
  font-size: 20px;
}

.title {
  font-size: 16px;
}
</style>
