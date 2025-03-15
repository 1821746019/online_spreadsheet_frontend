<!-- views/EditorView.vue -->
<template>
  <div class="editor-view">
    <div class="toolbar">
      <button @click="addNewCourse">添加课程</button>
      <div class="current-user">
        当前用户: {{ store.currentUser.name }}
        <span class="color-indicator" :style="{ backgroundColor: store.currentUser.color }"></span>
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

<script setup>
import { useScheduleStore } from '../stores/schedule'
import ScheduleGrid from '../components/ScheduleGrid.vue'
import { emitCourseUpdate } from '../utils/socket'

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
.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
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
</style>
