import { defineStore } from 'pinia'
import { ref} from 'vue'
import { useScheduleStore } from './schedule'

export const useFormStore = defineStore('form', () => {
  const formData = ref([])
  const lastUpdated = ref(null)
  const scheduleStore = useScheduleStore()

  // 自动同步数据的示例
  const autoSync = () => {
    formData.value = [...scheduleStore.timetable]
  }

  // 手动加载方法
  const manualLoad = () => {
    formData.value = [...formData.value, ...scheduleStore.timetable]
    lastUpdated.value = new Date()
  }

  return {
    formData,
    lastUpdated,
    autoSync,
    manualLoad
  }
})
