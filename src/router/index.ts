import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '../views/EditorView.vue'
import ReadCSV from '../components/ReadCSV.vue'
import CourseDataform from '../components/CourseDataform.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import { useAuthStore } from '../stores/auth'
import LandingPage from '../views/LandingPage.vue'
import Home from '../views/Home.vue'
import CommonFormView from '../views/CommonFormView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'home',
      component: Home,
      children: [
        {
          path: '',
          name: 'editor',
          component: EditorView,
        },
        {
          path: '/read',
          name: 'read',
          component: ReadCSV,
        },
        {
          path: '/form',
          name: 'form',
          component: CommonFormView,
        },
        {
          path:'/course',
          name:'course',
          component:CourseDataform
        }
      ],
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      name: 'Page',
      component: LandingPage,
      meta: { requiresAuth: false },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
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
