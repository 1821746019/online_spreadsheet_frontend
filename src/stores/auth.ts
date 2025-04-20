import { defineStore } from 'pinia'
import api from '../utils/api'
import { useRouter } from 'vue-router'
interface User {
  username: string
  email?: string
  color?: string
  id: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
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
        const response = await api.post('/login', { username, password })
        this.token = response.data.token
        this.user = { username, id: response.data.id }
        this.isAuthenticated = true

        // 存储token和user到localStorage
        if (this.token) {
          localStorage.setItem('token', this.token)
          localStorage.setItem('user', JSON.stringify(this.user))
        }

        return response
      } catch (error) {
        this.logout()
        throw error
      }
    },

    async register(username: string, email: string, password: string) {
      try {
        const response = await api.post('/signup', { username, password,email})
        return response
      } catch (error) {
        throw error
      }
    },

    async logout() {
      await api.post('/logout') // 发送登出请求到后端
      // if (response.status !== 200) {
      //   throw new Error('Logout failed')
      // }
      // 清除token和user
      this.token = null
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return '/login' // 返回登录页路径
    },

    // 初始化时从localStorage恢复登录状态
    initialize() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token) {
        this.token = token
        this.isAuthenticated = true
        if (user) {
          this.user = JSON.parse(user)
        } else {
          // 如果只有token没有user，尝试获取用户信息
          this.fetchUser()
        }
      }
    },

    async fetchUser() {
      try {
        const response = await api.get('/auth/user')
        this.user = response.data
        // 更新localStorage中的user信息
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch (error) {
        this.logout() // 如果获取用户信息失败，强制退出
      }
    },
  },
  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
  },
})
