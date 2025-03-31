<!-- views/EditorView.vue -->
<template>
  <div class="editor-view">
    <CourseDataform></CourseDataform>
    <hr>
    <div class="toolbar">
      <button @click="addNewCourse" class="feat-btn">添加课程</button>
      <div class="current-user">
        当前用户: {{ auth.user?.username }}
        <span class="color-indicator" :style="{ backgroundColor: auth.user?.color || '#cccccc' }"></span>
      </div>
    </div>

    <ScheduleGrid @courseMoved="handleCourseMoved" />
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
import { emitOperation } from '../utils/socket'
import ReadCSV from '@/components/ReadCSV.vue'
import { useAuthStore } from '../stores/auth'
import CourseDataform from '../components/CourseDataform.vue'
const auth=useAuthStore()
const store = useScheduleStore()
function handleCourseMoved(course) {
  emitOperation({
    type: 'update',
    data: course,
    version: Date.now(),
    timestamp: Date.now(),
    userId: auth.user?.username || 'unknown'
  })
}

function addNewCourse() {
  const newCourse = {
    id: typeof self !== 'undefined' && self.crypto && self.crypto.randomUUID
        ? self.crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0,
                  v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          }),
    day: 'Monday',
    start: '08:30',
    end: '9:10',
    course: '新课程',
    teacher: '新老师',
    room: '未分配',
    week: store.currentWeek,
    lastUpdatedBy: auth.user?.username || 'unknown'
  }
  store.timetable.push(newCourse)
  emitOperation({
    type: 'insert',
    data: newCourse,
    version: Date.now(),
    timestamp: Date.now(),
    userId: auth.user?.username || 'unknown'
  })
}
</script>

<style scoped>
.editor-view{
  flex: 1;
  padding: 1rem;
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
