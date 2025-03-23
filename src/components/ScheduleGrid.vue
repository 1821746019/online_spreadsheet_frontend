<!-- components/ScheduleGrid.vue -->
<template>
  <div class="schedule-grid">
    <div class="header-row">
      <div class="day-header" style="background-color:black">时间</div>
      <div v-for="day in days" :key="day" class="day-header">
        {{ dayMap[day] }}
      </div>
    </div>
    <div class="time-grid">
      <div class="time-column">
        <div v-for="time in realtime" :key="time" class="time-slot">
          {{ time }}
        </div>
      </div>

      <div v-for="day in days" :key="day" class="day-column" @dragover.prevent @drop="handleDrop($event, day)">
        <div v-for="time in realtime" :key="time" class="time-slot" :data-time="day + '-' + time"></div>

        <div v-for="course in getCoursesByDay(day)" :key="course.id" class="course-block"
          :style="getCourseStyle(course)" draggable="true" @dragstart="handleDragStart($event, course)"
          :class="{ 'conflict': course.hasConflict }" @dblclick="handleDblClick(course)">
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
  <!-- 编辑层 -->
  <teleport to="body">
    <div v-if="showEditDialog" class="edit-modal">
      <div class="modal-content">
        <h3>编辑课程信息</h3>
        <div class="form-group">
          <label>课程名称</label>
          <input v-model="editingCourse.course" type="text">
        </div>
        <div class="form-group">
          <label>授课教师</label>
          <input v-model="editingCourse.teacher" type="text">
        </div>
        <div class="form-group">
          <label>教室</label>
          <input v-model="editingCourse.room" type="text">
        </div>
        <div class="form-group">
          <label>起始时间</label>
          <input v-model="editingCourse.start" type="text">
        </div>
        <div class="form-group">
          <label>结束时间</label>
          <input v-model="editingCourse.end" type="text">
        </div>
        <div class="button-group">
          <button @click="showEditDialog = false" class="cancel-btn">取消</button>
          <button @click="handleDelete" class="delete-btn" v-if="editingCourse">
            删除课程
          </button>
          <button @click="saveCourse" class="save-btn">保存</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useScheduleStore } from '../stores/schedule'


const store = useScheduleStore()
const emit = defineEmits(['courseMoved'])

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const realtime = ['8:30-9:10', '9:15-9:55', '10:15-10:55', '11:00-11:40', '14:00-14:40', '14:45-15:25', '15:45-16:25', '16:30-17:10', '19:00-20:20', '20:30-21:50']
const realtimeTimes = realtime.map(time => {
  const [start, end] = time.split('-')
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  return {
    start: startHour * 60 + startMinute,
    end: endHour * 60 + endMinute
  }
})

// 时间转换工具函数
const convertTimeToMinutes = timeStr => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

const convertMinutesToTime = minutes => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}:${mins.toString().padStart(2, '0')}`
}
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
  const mouseY = e.clientY - rect.top

  // 计算目标时间槽
  const slotIndex = Math.floor(mouseY / 80)
  if (slotIndex < 0 || slotIndex >= realtimeTimes.length) {
    console.warn('超出时间范围')
    return
  }

  const originalCourse = store.timetable.find(c => c.id === courseId)
  if (!originalCourse) return

  // 计算原课程占用的槽数
  const originalStart = convertTimeToMinutes(originalCourse.start)
  const originalSlotIndex = realtimeTimes.findIndex(t => t.start === originalStart)
  const originalDuration = realtimeTimes
    .slice(originalSlotIndex)
    .findIndex(t => t.end === convertTimeToMinutes(originalCourse.end)) + 1

  // 确定新位置
  const newEndSlot = Math.min(slotIndex + originalDuration - 1, realtimeTimes.length - 1)
  const updatedCourse = {
    ...originalCourse,
    day,
    start: convertMinutesToTime(realtimeTimes[slotIndex].start),
    end: convertMinutesToTime(realtimeTimes[newEndSlot].end)
  }

  store.updateCourse(updatedCourse)
  emit('courseMoved', updatedCourse)
}
function getCourseStyle(course) {
  const startMinutes = convertTimeToMinutes(course.start)
  const endMinutes = convertTimeToMinutes(course.end)

  // 找到对应时间槽
  const slotIndex = realtimeTimes.findIndex(t => t.start === startMinutes)
  const durationSlots = realtimeTimes.filter(t =>
    t.start >= startMinutes && t.end <= endMinutes
  ).length
  return {
    top: `${slotIndex * 80}px`,
    height: `${durationSlots * 60}px`
  }
}

function getUserColor(userId) {
  const user = store.collaborators.find(u => u.id === userId)
  return user ? user.color : '#ccc'
}


// 编辑层
// 新增以下代码

// 编辑相关状态
const editingCourse = ref(null)
const showEditDialog = ref(false)

// 双击事件处理
function handleDblClick(course) {
  editingCourse.value = JSON.parse(JSON.stringify(course)) // 深拷贝避免污染原始数据
  showEditDialog.value = true
}

// 保存修改
function saveCourse() {
  if (editingCourse.value) {
    store.updateCourse(editingCourse.value)
    showEditDialog.value = false
  }
}
const handleDelete = () => {
  if (editingCourse.value && confirm('确认删除该课程？')) {
    store.removeCourse(editingCourse.value.id)
    showEditDialog.value = false
  }
}
</script>

<style scoped>
.schedule-grid {
  padding: 20px;
  max-width: 1500px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-row {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 1px;
  background: #f0f0f0;
}

.day-header {
  background: #2c3e50;
  color: white;
  padding: 15px 15px;
  text-align: center;
  font-weight: 600;
  font-size: 0.95em;
  border-right: 1px solid #fff;
}

.time-grid {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  gap: 1px;
  background: #f8f9fa;
  border: 1px solid #eee;
}

.time-column {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
  white-space: nowrap;
  font-size: 0.7em;
  border-right: 1px solid #eee;
}

.time-slot {
  height: 80px;
  /* 关键高度设置 */
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
  min-height: 800px;
  /* 10小时*80px */
  background: #fff;
  border-right: 1px solid #eee;
  background-image: linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
  background-size: 100% 80px;
  /* 关键修改：匹配80px高度 */
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
  top: calc(var(--slot-index) * 80px);
  height: calc(var(--slot-duration) * 80px);
  min-height: 60px;
  /* CSS变量计算 */
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
  0% {
    transform: scale(0.95);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(0.95);
  }
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



/* 新增编辑模态框样式 */
.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.button-group {
  margin-top: 1.5rem;
  text-align: right;
}

.save-btn {
  background-color: #67C23A;
  color: white;
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}
.cancel-btn {
  background-color: rgb(177.3, 179.4, 183.6);
  color: white;
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}


.delete-btn {
  background-color: #ff4444;
  color: white;
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.delete-btn:hover {
  background-color: #cc0000;
}

</style>
