import { defineStore } from 'pinia';
import api from '../utils/api';
import { useRouter } from 'vue-router';
interface User {
  username: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
  }),
  actions: {

    async login(username: string, password: string) {
      try {
        const response = await api.post('/login', { username, password });
        this.token = response.data.token;
        this.user = { username };
        this.isAuthenticated = true;

        // 存储token到localStorage
        if (this.token) {
          localStorage.setItem('token', this.token);
        }

        return response;
      } catch (error) {
        this.logout();
        throw error;
      }
    },

    async register(username: string, email: string, password: string) {
      try {
        const response = await api.post('/register', { username, email, password });
        return response;
      } catch (error) {
        throw error;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      return '/login'; // 返回登录页路径
    },

    // 初始化时从localStorage恢复登录状态
    initialize() {
      const token = localStorage.getItem('token');
      const user=localStorage.getItem('user')
      if (token) {
        this.token = token;
        this.isAuthenticated = true;
        // 可选：这里可以添加获取用户信息的API调用
        // await this.fetchUser();
      }
    },

    async fetchUser() {
      try {
        const response = await api.get('/auth/user');
        this.user = response.data;
      } catch (error) {
        this.logout(); // 如果获取用户信息失败，强制退出
      }
    },
  },
  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
  }
});
