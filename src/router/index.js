import { createRouter, createWebHistory } from 'vue-router'
import testA from '@/views/testA.vue'
import EditorView from '@/views/EditorView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: EditorView,
    },
    {
      path: '/A',
      name: 'A',
      component:  testA,
    },
  ],
})

export default router
