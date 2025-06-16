<template>
  <div class="editor-view">
    <div class="page-header">
    <h2 class="modern-title">
      <span class="class-name">{{ selectedClass.name }}的课表</span>
    </h2>
  </div>

    <CourseDataform></CourseDataform>
    <hr>
    <ScheduleGrid />
  </div>
</template>

<script setup name="EditorView">
import {  computed, onMounted,onUnmounted } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import ScheduleGrid from '../components/ScheduleGrid.vue'
import CourseDataform from '../components/CourseDataform.vue'
const store = useScheduleStore()
const selectedClass = store.currentClass
const week = computed(() => store.currentWeek)
onMounted(async()=>{
  console.log('EditorView mounted, starting timetable polling...',week.value)
  await store.startPollingTimetable(week.value)
  await store.fetchTimetable(week.value)
})
// 组件卸载时停止轮询
onUnmounted(() => {
  store.stopPollingTimetable();
});
</script>

<style scoped>
.editor-view{
  flex: 1;
  padding: 1rem;
  max-width: 1500px;
  width: 100%;
}
.page-header {
  margin-bottom: 2rem;
  padding: 0 1.5rem;
}

.modern-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  padding-bottom: 0.75rem;
}

.modern-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #3a7bd5, #00d2ff);
  border-radius: 3px;
}

.class-name {
  color: #3a7bd5;
  font-weight: 700;
  position: relative;
}

.sheet-name {
  color: #2d3748;
  font-weight: 600;
  background: linear-gradient(transparent 70%, rgba(58, 123, 213, 0.2) 70%);
}

.separator {
  color: #718096;
  font-weight: 400;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modern-title {
    font-size: 1.5rem;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .modern-title::after {
    width: 40px;
    height: 2px;
  }
}
/* .header-selectors {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.selector {
  flex: 1;
  max-width: 300px;
}
.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
}

.color-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-left: 8px;
}

.collaborators {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.collaborator {
  margin: 8px 0;
  display: flex;
  align-items: center;
}
.feat-btn {
  background-color: #2c3e50;
  color: white;
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
} */


</style>
