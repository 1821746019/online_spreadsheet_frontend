<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>欢迎回来</h1>
        <p>请登录您的账户</p>
        <p><router-link to="/">回到首页</router-link></p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <input
            v-model="username"
            type="text"
            id="username"
            required
            placeholder=" "
            class="form-input"
          />
          <label for="username" class="form-label">用户名</label>
          <div class="form-underline"></div>
        </div>

        <div class="form-group">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            id="password"
            required
            placeholder=" "
            class="form-input"
          />
          <label for="password" class="form-label">密码</label>
          <div class="form-underline"></div>
          <span
    class="password-toggle"
    @click="showPassword = !showPassword"
  >
    <i :class="showPassword ?  'fas fa-eye': 'fas fa-eye-slash'"></i>
  </span>
        </div>

        <button type="submit" :disabled="loading" class="login-button">
          <span v-if="!loading">登 录</span>
          <span v-else class="loading-dots">
            <span class="dot">.</span>
            <span class="dot">.</span>
            <span class="dot">.</span>
          </span>
        </button>

        <div class="login-footer">
          <p v-if="error" class="error-message">{{ error }}</p>
          <p class="register-link">
            还没有账号? <router-link to="/register" class="register-text">立即注册</router-link>
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = '';
    await authStore.login(username.value, password.value);
    router.push('/home');
  } catch (err: any) {
    error.value = err.message || '登录失败，请检查用户名和密码';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

.login-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  padding: 2rem;
  transition: transform 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  color: #2d3748;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.login-header p {
  color: #718096;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  position: relative;
  margin-bottom: 8px;
}
.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.password-toggle i {
  color: #666;
  font-size: 18px;
}
.form-input {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  border: none;
  border-bottom: 1px solid #e2e8f0;
  background-color: transparent;
  outline: none;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-bottom-color: transparent;
}

.form-input:focus + .form-label,
.form-input:not(:placeholder-shown) + .form-label {
  transform: translateY(-24px) scale(0.85);
  color: #667eea;
}

.form-label {
  position: absolute;
  left: 0;
  top: 12px;
  color: #718096;
  font-size: 16px;
  pointer-events: none;
  transition: all 0.3s ease;
  transform-origin: left top;
}

.form-underline {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.form-input:focus ~ .form-underline {
  width: 100%;
}

.login-button {
  background: linear-gradient(90deg, #3a7bd5, #00d2ff);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  width: 100%;
}

.login-button:hover:not(:disabled) {
  background-color: #2c5fb3;
  transform: translateY(-2px);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
  box-shadow: none;
}

.loading-dots {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.dot {
  animation: bounce 1.4s infinite ease-in-out;
  font-size: 24px;
  line-height: 0;
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

@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
}

.login-footer {
  text-align: center;
  margin-top: 16px;
}

.error-message {
  color: #e53e3e;
  font-size: 14px;
  margin-bottom: 12px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.register-link {
  color: #718096;
  font-size: 14px;
}

.register-text {
  color: #3a7bd5;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.register-text:hover {
  color: #2c5fb3;
  text-decoration: underline;
}
</style>
