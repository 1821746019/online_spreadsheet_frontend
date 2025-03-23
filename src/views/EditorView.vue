<!-- views/EditorView.vue -->
<template>
  <div class="editor-view">
    <ReadCSV></ReadCSV>
  <CommonForm></CommonForm>
    <hr>
    <div class="toolbar">
      <button @click="addNewCourse" class="feat-btn">添加课程</button>
      <div class="current-user">
        当前用户: {{ store.currentUser.name }}
        <span class="color-indicator" :style="{ backgroundColor: store.currentUser.color }"></span>
      </div>
    </div>

    <ScheduleGrid @courseMoved="handleCourseMoved" />
    <button @click="saveForm" class="feat-btn">保存表格</button>
    <div class="collaborators">
      <h3>协作者:</h3>
      <div v-for="user in store.collaborators" :key="user.id" class="collaborator">
        {{ user.name }}
        <span class="color-indicator" :style="{ backgroundColor: user.color }"></span>
      </div>
    </div>
  </div>
</template>

<script setup name="EditorView">
import { useScheduleStore } from '../stores/schedule'
import ScheduleGrid from '../components/ScheduleGrid.vue'
import { emitCourseUpdate } from '../utils/socket'
import ReadCSV from '@/components/ReadCSV.vue'
import CommonForm from '@/components/commonForm.vue'
const store = useScheduleStore()
function handleCourseMoved(course) {
  emitCourseUpdate(course)
}

function addNewCourse() {
  const newCourse = {
    id: crypto.randomUUID(),
    day: 'Monday',
    start: '09:00',
    end: '10:00',
    course: '新课程',
    teacher: '新老师',
    room: '未分配',
    lastUpdatedBy: store.currentUser.id
  }
  store.timetable.push(newCourse)
  emitCourseUpdate(newCourse)
}
</script>

<style scoped>
.editor-view{
  flex: 1;
  padding: 2rem;
  max-width: 1500px;
  margin: 0 auto;
  width: 100%;
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
}
</style>
