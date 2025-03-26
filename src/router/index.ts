import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '../views/EditorView.vue'
import ReadCSV from '../components/ReadCSV.vue'
import CommonForm from '../components/commonForm.vue'
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue'
import { useAuthStore } from '../stores/auth';
import IndexView from '../views/IndexView.vue';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: EditorView,
      meta: { requiresAuth: true }
    },
    {
      path: '/read',
      name: 'read',
      component:  ReadCSV,
    },
    {
      path: '/form',
      name: 'form',
      component:  CommonForm,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresAuth: false }
    },
  ],
})
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // 初始化认证状态
  authStore.initialize();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router
