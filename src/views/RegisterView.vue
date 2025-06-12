<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>创建账户</h1>
        <p>加入我们，开始您的旅程</p>
        <p><router-link to="/">回到首页</router-link></p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
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
            v-model="email"
            type="email"
            id="email"
            required
            placeholder=" "
            class="form-input"
          />
          <label for="email" class="form-label">邮箱</label>
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
    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
  </span>
        </div>

        <div class="form-group">
          <input
            v-model="confirmPassword"
            type="password"
            id="confirmPassword"
            required
            placeholder=" "
            class="form-input"
          />
          <label for="confirmPassword" class="form-label">确认密码</label>
          <div class="form-underline"></div>
        </div>

        <button type="submit" :disabled="loading" class="register-button">
          <span v-if="!loading">注 册</span>
          <span v-else class="loading-dots">
            <span class="dot">.</span>
            <span class="dot">.</span>
            <span class="dot">.</span>
          </span>
        </button>

        <div class="register-footer">
          <p v-if="error" class="error-message">{{ error }}</p>
          <p v-if="success" class="success-message">注册成功! 正在跳转登录...</p>
          <p class="login-link">
            已有账号? <router-link to="/login" class="login-text">立即登录</router-link>
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
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const error = ref('');
const success = ref(false);
const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致';
    return;
  }
  if( password.value.length < 8 ) {
    error.value = '密码长度必须在8个字符以上';
    return;
  }
  try {
    loading.value = true;
    error.value = '';
    await authStore.register(username.value, email.value, password.value);
    success.value = true;
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  } catch (err: any) {
    error.value = err.message || '注册失败，用户名或邮箱被使用';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

.register-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  padding: 2rem;
  transition: transform 0.3s ease;
}

.register-card:hover {
  transform: translateY(-5px);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  color: #2d3748;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.register-header p {
  color: #718096;
  font-size: 14px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  position: relative;
  margin-bottom: 8px;
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

.register-button {
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

.register-button:hover:not(:disabled) {
  background-color: #2c5fb3;
  transform: translateY(-2px);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

.register-button:disabled {
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

.register-footer {
  text-align: center;
  margin-top: 16px;
}

.error-message {
  color: #e53e3e;
  font-size: 14px;
  margin-bottom: 12px;
  animation: shake 0.5s ease-in-out;
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
.success-message {
  color: #38a169;
  font-size: 14px;
  margin-bottom: 12px;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-link {
  color: #718096;
  font-size: 14px;
}

.login-text {
  color: #3a7bd5;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.login-text:hover {
  color: #2c5fb3;
  text-decoration: underline;
}
</style>
