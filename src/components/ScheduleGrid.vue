<template>
  <div class="week-selector">
    <el-select v-model="currentWeek" placeholder="选择周次" @change="handleWeekChange">
      <el-option
        v-for="week in 20"
        :key="week"
        :label="`第 ${week} 周`"
        :value="week"
      />
    </el-select>
  </div>
  <div class="schedule-grid">
    <div class="header-row">
      <div class="time-header" style="background-color: #2d3748">时间</div>
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

  <!-- 编辑模态框 -->
  <teleport to="body">
    <div v-if="showEditDialog" class="edit-modal">
      <div class="modal-card">
        <h3 class="modal-title">编辑课程信息</h3>
        <div class="form-group">
          <label>课程名称</label>
          <el-input v-model="editingCourse.course" type="text" class="modern-input"></el-input>
        </div>
        <div class="form-group">
          <label>授课教师</label>
          <el-input v-model="editingCourse.teacher" type="text" class="modern-input"></el-input>
        </div>
        <div class="form-group">
          <label>教室</label>
          <el-input v-model="editingCourse.room" type="text" class="modern-input"></el-input>
        </div>
        <div class="form-group">
          <label>起始时间</label>
          <el-input v-model="editingCourse.start" type="text" class="modern-input"></el-input>
        </div>
        <div class="form-group">
          <label>结束时间</label>
          <el-input v-model="editingCourse.end" type="text" class="modern-input"></el-input>
        </div>
        <div class="button-group">
          <button @click="showEditDialog = false" class="cancel-btn">
            <span>取消</span>
          </button>
          <button @click="handleDelete" class="delete-btn" v-if="editingCourse">
            <span>删除课程</span>
          </button>
          <button @click="saveCourse" class="save-btn">
            <span>保存</span>
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import { ElInput } from 'element-plus'

const store = useScheduleStore()
const emit = defineEmits(['courseMoved'])
const currentWeek = ref(store.currentWeek)

// 监听store.currentWeek变化
watch(() => store.currentWeek, (newWeek) => {
  currentWeek.value = newWeek
})

function handleWeekChange(week) {
  store.fetchTimetable(week)
}

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
  return store.timetable.filter(c => {
    // 严格匹配当前周次和日期
    return c.day === day && c.week === store.currentWeek
  })
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
    end: convertMinutesToTime(realtimeTimes[newEndSlot].end),
    week: originalCourse.week || store.currentWeek // 保留原周次或使用当前周次
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
  editingCourse.value = {
    day: 'Monday',
    start: '8:30',
    end: '9:10',
    week: store.currentWeek,
    ...(course ? JSON.parse(JSON.stringify(course)) : {}),
    id: course?.id || crypto.randomUUID()
  }
  showEditDialog.value = true
}

// 保存修改
function saveCourse() {
  if (editingCourse.value) {
    const courseToSave = {
      ...editingCourse.value,
      week: store.currentWeek, // 强制使用当前周次
      id: editingCourse.value.id,
      day: editingCourse.value.day || 'Monday'
    }
    store.updateCourse(courseToSave)
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
.week-selector {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.schedule-grid {
  padding: 20px;
  max-width: 1500px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.header-row {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 1px;
  background: #f8fafc;
}

.time-header, .day-header {
  background: #2d3748;
  color: white;
  padding: 15px 10px;
  text-align: center;
  font-weight: 600;
  font-size: 0.95em;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.time-header {
  background: #1a202c;
}

.time-grid {
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  gap: 1px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
}

.time-column {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #fff;
  white-space: nowrap;
  font-size: 0.8em;
  border-right: 1px solid #e2e8f0;
}

.time-slot {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85em;
  color: #4a5568;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
}

.day-column {
  position: relative;
  min-height: 800px;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  background-image: linear-gradient(to bottom, #edf2f7 1px, transparent 1px);
  background-size: 100% 80px;
}

.course-block {
  position: absolute;
  left: 4px;
  right: 4px;
  background: linear-gradient(135deg, #ebf4ff 0%, #c3dafe 100%);
  border: 2px solid #90cdf4;
  border-radius: 8px;
  padding: 10px;
  cursor: move;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  top: calc(var(--slot-index) * 80px);
  height: calc(var(--slot-duration) * 80px);
  min-height: 60px;
}

.course-block:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  border-color: #63b3ed;
}

.course-block.conflict {
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  border-color: #fc8181;
  z-index: 1;
  animation: pulse 1.5s infinite;
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
  color: #2d3748;
}

.course-info {
  font-size: 0.85em;
  color: #4a5568;
  line-height: 1.4;
  flex-grow: 1;
}

.user-indicator {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@keyframes pulse {
  0% {
    transform: scale(0.98);
    box-shadow: 0 0 0 0 rgba(252, 129, 129, 0.4);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(252, 129, 129, 0);
  }
  100% {
    transform: scale(0.98);
    box-shadow: 0 0 0 0 rgba(252, 129, 129, 0);
  }
}

/* 编辑模态框样式 */
.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 改为顶部对齐 */
  padding-top: 40px; /* 添加顶部内边距 */
  padding-bottom: 40px; /* 添加底部内边距 */
  overflow-y: auto; /* 允许垂直滚动 */
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.modal-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  width: 440px;
  max-height: calc(100vh - 80px); /* 限制最大高度 */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow-y: auto; /* 允许内容滚动 */
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-title {
  color: #2d3748;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  position: relative;
  padding-bottom: 12px;
}

.modal-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #4299e1, #48bb78);
  border-radius: 3px;
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  color: #4a5568;
  font-size: 0.95rem;
  font-weight: 600;
}

.modern-input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 16px;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  background-color: #f8fafc;
}

.modern-input:focus {
  background-color: white;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
  border-color: #4299e1;
}

.modern-input:hover {
  border-color: #cbd5e0;
}

.modern-input:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.button-group {
  margin-top: 2.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  position: sticky;
  bottom: 0;
  background: white;
  padding-top: 16px;
  padding-bottom: 8px;
  z-index: 1;
}

.save-btn, .cancel-btn, .delete-btn {
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.save-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(72, 187, 120, 0.3);
}

.cancel-btn {
  background: #edf2f7;
  color: #4a5568;
}

.cancel-btn:hover {
  background: #e2e8f0;
}

.delete-btn {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
  margin-right: auto;
}

.delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(245, 101, 101, 0.3);
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

@media (max-width: 768px) {
  .modal-card {
    width: 90%;
    padding: 1.5rem;
  }

  .button-group {
    flex-wrap: wrap;
  }

  .save-btn, .cancel-btn, .delete-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
