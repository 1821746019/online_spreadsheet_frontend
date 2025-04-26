import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/Home.vue'),
      children: [
        {
          path: '',
          name: 'class',
          component: () => import('../components/ClassSelect.vue'),
        },
        {
          path: '/class/:class_id/sheet', // 动态路由参数
          name: 'SheetSelect',
          component: () => import('../components/SheetSelect.vue'), // 课表组件
        },
        {
          path: '/class/:class_id/sheet/:sheet_id', // 动态路由参数
          name: 'Sheet',
          component: () => import('../views/EditorView.vue'), // 课表组件
        },
        {
          path: '/home/read',
          name: 'read',
          component: () => import('../components/ReadCSV.vue'), // 读取CSV组件
        },
        {
          path: '/home/form',
          name: 'form',
          component: () => import('../components/CommonForm.vue'), // 表单组件
        },
        {
          path: '/home/course',
          name: 'course',
          component: () => import('../components/CourseDataform.vue'), // 课程数据组件
        },
      ],
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      name: 'Page',
      component: () => import('../views/LandingPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { requiresAuth: false },
    },
  ],
})
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 初始化认证状态
  authStore.initialize()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
