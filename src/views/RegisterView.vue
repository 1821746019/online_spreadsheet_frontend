<template>
  <div class="register-container">
    <h1>注册</h1>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          v-model="username"
          type="text"
          id="username"
          required
        />
      </div>
      <div class="form-group">
        <label for="email">邮箱</label>
        <input
          v-model="email"
          type="email"
          id="email"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input
          v-model="password"
          type="password"
          id="password"
          required
        />
      </div>
      <div class="form-group">
        <label for="confirmPassword">确认密码</label>
        <input
          v-model="confirmPassword"
          type="password"
          id="confirmPassword"
          required
        />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? '注册中...' : '注册' }}
      </button>
      <p class="login-link">
        已有账号? <router-link to="/login">立即登录</router-link>
      </p>
      <p v-if="error" class="error-message">{{ error }}</p>
      <p v-if="success" class="success-message">注册成功! 请登录</p>
    </form>
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

  try {
    loading.value = true;
    error.value = '';
    await authStore.register(username.value, email.value, password.value);
    success.value = true;
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  } catch (err: any) {
    error.value = err.message || '注册失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
}
input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 10px;
  background-color: #42b983;
  color: white;
  border: none;
  cursor: pointer;
}
button:disabled {
  background-color: #cccccc;
}
.error-message {
  color: red;
  margin-top: 10px;
}
.success-message {
  color: green;
  margin-top: 10px;
}
.login-link {
  margin-top: 15px;
  text-align: center;
}
</style>
