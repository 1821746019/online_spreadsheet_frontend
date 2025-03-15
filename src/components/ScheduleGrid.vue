<!-- components/ScheduleGrid.vue -->
<template>
  <div class="schedule-grid">
    <div class="header-row">
      <span class="day-header" style="background-color:black">时间</span>
      <div v-for="day in days" :key="day" class="day-header">
        {{ dayMap[day] }}
      </div>
    </div>

    <div class="time-grid">
      <div class="time-column">
        <div v-for="time in timeSlots" :key="time" class="time-slot">
          {{ time }}
        </div>
      </div>

      <div v-for="day in days" :key="day" class="day-column" @dragover.prevent @drop="handleDrop($event, day)">
        <div v-for="time in timeSlots" :key="time" class="time-slot" :data-time="day + '-' + time"></div>

        <div v-for="course in getCoursesByDay(day)" :key="course.id" class="course-block"
          :style="getCourseStyle(course)" draggable="true" @dragstart="handleDragStart($event, course)"
          :class="{ 'conflict': course.hasConflict }">
          <div class="course-content">
            <span class="course-title">{{ course.course }}</span>
            <span class="course-info">{{ course.teacher }} @ {{ course.room }}</span>
            <div v-if="course.lastUpdatedBy" class="user-indicator"
              :style="{ backgroundColor: getUserColor(course.lastUpdatedBy) }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useScheduleStore } from '../stores/schedule'

const store = useScheduleStore()
const emit = defineEmits(['courseMoved'])

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const timeSlots = Array.from({ length: 10 }, (_, i) => `${i + 8}:00`)

const dayMap = {
  Monday: '周一',
  Tuesday: '周二',
  Wednesday: '周三',
  Thursday: '周四',
  Friday: '周五',
  Saturday: '周六',
  Sunday: '周日'
}

function getCoursesByDay(day) {
  return store.timetable.filter(c => c.day === day)
}

function handleDragStart(e, course) {
  e.dataTransfer.setData('courseId', course.id)
}

function handleDrop(e, day) {
  const courseId = e.dataTransfer.getData('courseId')
  const targetColumn = e.currentTarget
  const rect = targetColumn.getBoundingClientRect()

  // 计算垂直位置
  const mouseY = e.clientY - rect.top
  const hourOffset = Math.floor(mouseY / 80)  // 关键修改点：使用80px高度计算
  const startHour = 8 + hourOffset

  // 获取课程持续时间
  const originalCourse = store.timetable.find(c => c.id === courseId)
  const duration = parseInt(originalCourse.end.split(':')[0]) - parseInt(originalCourse.start.split(':')[0])

  // 边界检查（8:00 - 17:00）
  if (startHour < 8 || (startHour + duration) > 17) {
    console.warn('超出时间范围')
    return
  }

  const updatedCourse = {
    ...originalCourse,
    day,
    start: `${startHour}:00`,
    end: `${startHour + duration}:00`
  }

  store.updateCourse(updatedCourse)
  emit('courseMoved', updatedCourse)
}

function getCourseStyle(course) {
  const startHour = parseInt(course.start.split(':')[0])
  const duration = parseInt(course.end.split(':')[0]) - startHour
  return {
    '--hour': startHour - 8,
    '--duration': duration,
    top: `${(startHour - 8) * 80}px`, // 关键修改点：80px高度
    height: `${duration * 80}px`       // 关键修改点：80px高度
  }
}

function getUserColor(userId) {
  const user = store.collaborators.find(u => u.id === userId)
  return user ? user.color : '#ccc'
}
</script>

<style scoped>
.schedule-grid {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-row {
  display: grid;
  grid-template-columns: 120px repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 1px;
  background: #f0f0f0;
}

.day-header {
  background: #2c3e50;
  color: white;
  padding: 15px 10px;
  text-align: center;
  font-weight: 600;
  font-size: 0.95em;
  border-right: 1px solid #fff;
}

.time-grid {
  display: grid;
  grid-template-columns: 120px repeat(7, 1fr);
  gap: 1px;
  background: #f8f9fa;
  border: 1px solid #eee;
}

.time-column {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
}

.time-slot {
  height: 80px; /* 关键高度设置 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9em;
  color: #666;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
}

.day-column {
  position: relative;
  min-height: 800px; /* 10小时*80px */
  background: #fff;
  border-right: 1px solid #eee;
  background-image: linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
  background-size: 100% 80px; /* 关键修改：匹配80px高度 */
}

.course-block {
  position: absolute;
  left: 4px;
  right: 4px;
  background: #e8f5e9;
  border: 2px solid #81c784;
  border-radius: 6px;
  padding: 10px;
  cursor: move;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  top: calc(var(--hour) * 80px); /* CSS变量计算 */
  height: calc(var(--duration) * 80px); /* CSS变量计算 */
}

.course-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.course-block.conflict {
  background: #ffcdd2;
  border-color: #e53935;
  z-index: 1;
  animation: pulse 1s infinite;
}

.course-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.course-title {
  font-weight: 600;
  font-size: 0.95em;
  margin-bottom: 4px;
  color: #2c3e50;
}

.course-info {
  font-size: 0.85em;
  color: #666;
  line-height: 1.4;
  flex-grow: 1;
}

.user-indicator {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

@keyframes pulse {
  0% { transform: scale(0.95); }
  50% { transform: scale(1.05); }
  100% { transform: scale(0.95); }
}

@media (max-width: 1600px) {
  .schedule-grid {
    max-width: 95%;
    overflow-x: auto;
  }

  .header-row,
  .time-grid {
    grid-template-columns: 100px repeat(7, minmax(120px, 1fr));
  }

  .day-header {
    padding: 12px 8px;
    font-size: 0.9em;
  }

  .time-slot {
    font-size: 0.85em;
  }
}
</style>
