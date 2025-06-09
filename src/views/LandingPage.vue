<template>
  <div class="landing-page">
    <div class="hero">
      <h1>多人在线表格编辑排课系统</h1>
      <p class="subtitle">现代化、高效的课程安排解决方案</p>
      <div class="cta-buttons">
        <button @click="handleLogin" class="btn primary">登录</button>
        <button @click="handleRegister" class="btn secondary">注册</button>
      </div>
    </div>

    <div class="features">
      <div class="feature-card" v-for="(feature, index) in features" :key="index">
        <div class="icon">
          <component :is="feature.icon" />
        </div>
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import IconTooling from '@/components/icons/IconTooling.vue'
import IconDocumentation from '@/components/icons/IconDocumentation.vue'
import IconEcosystem from '@/components/icons/IconEcosystem.vue'
import { useAuthStore } from '../stores/auth'
const router = useRouter()
const authStore = useAuthStore()

const handleLogin = () => {
  if (authStore.isLoggedIn) {
    ElMessage.info('您已登录，正在跳转到首页')
    router.push('/home')
  } else {
    router.push('/login')
  }
}
const handleRegister = () => {
  if (authStore.isLoggedIn) {
    ElMessage.info('您已登录，无需注册')
    router.push('/home')
  } else {
    router.push('/register')
  }
}
const features = ref([
  {
    icon: IconTooling,
    title: '智能排课',
    description: '课程安排，解决时间冲突'
  },
  {
    icon: IconDocumentation,
    title: '表格编辑',
    description: '直观的表格界面'
  },
  {
    icon: IconEcosystem,
    title: '团队协作',
    description: '多人实时协同编辑'
  }
])
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.hero {
  text-align: center;
  padding: 4rem 0;
  max-width: 900px;
  margin: 0 auto;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #3a7bd5, #00d2ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradient 8s ease infinite;
}

.subtitle {
  font-size: 1.5rem;
  color: #4a5568;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.primary {
  background-color: #3a7bd5;
  color: white;
}

.primary:hover {
  background-color: #2c5fb3;
  transform: translateY(-2px);
}

.secondary {
  border: 2px solid #3a7bd5;
  color: #3a7bd5;
}

.secondary:hover {
  background-color: #f0f4f8;
  transform: translateY(-2px);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 4rem auto;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  margin: 1rem 0;
  color: #2d3748;
}

.feature-card p {
  color: #718096;
}

.icon {
  width: 60px;
  height: 60px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3a7bd5, #00d2ff);
  border-radius: 50%;
  color: white;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
