import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '@/views/EditorView.vue'
import ReadCSV from '@/components/ReadCSV.vue'
import CommonForm from '@/components/commonForm.vue'
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: EditorView,
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

  ],
})

export default router
