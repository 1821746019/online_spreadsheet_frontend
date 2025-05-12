<template>
  <div class="course-builder-container">
    <!-- 新建课程按钮和待拖动区 -->
    <div class="course-creator">
      <el-button type="primary" @click="showCreateDialog">新建课程</el-button>
      <div class="course-pool" ref="coursePool">
        <div v-for="course in draftCourses" :key="course.id"
             class="course-block draft" draggable="true"
             @dragstart="handleDragStart($event, course)"
             @dragend="handleDragEnd"@dblclick="showupdate(course)">
          <div class="course-content">
            <span class="course-title">{{ course.course }}</span>
            <span class="course-info">{{ course.teacher }} @ {{ course.room }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div class="week-selector">
      <el-select v-model="store.currentWeek" placeholder="第 1 周" @change="handleWeekChange">
        <el-option v-for="week in store.totalweek" :key="week" :label="`第 ${week} 周`" :value="week" />
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

        <div v-for="day in days" :key="day" class="day-column" @dragover.prevent="handleDragOver" @dragenter.prevent
          @drop="handleDrop($event, day)">
          <div v-for="time in realtime" :key="time" class="time-slot" :data-time="day + '-' + time"></div>

          <div v-for="course in getCoursesByDay(day)" :key="course.id" class="course-block"
            :style="getCourseStyle(course)" draggable="true" @dragstart="handleDragStart($event, course)"
            @dragend="handleDragEnd" :class="{ 'conflict': course.hasConflict }" @dblclick="handleDblClick(course)">
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
        <div class="form-group"v-if="!drgamitemlog">
          <label>星期</label>
          <el-select v-model="editingCourse.col_index" class="modern-input">
            <el-option v-for="(day, index) in days" :key="day" :label="dayMap[day]" :value="index + 1" />
          </el-select>
        </div>
        <div class="form-group"v-if="!drgamitemlog">
          <label>时间段</label>
          <el-select v-model="editingCourse.row_index" class="modern-input">
            <el-option v-for="(time, index) in realtime" :key="time" :label="time" :value="index + 1" />
          </el-select>
        </div>
        <div class="form-group">
          <label>周次类型</label>
          <el-select v-model="editingCourse.week_type" class="modern-input">
            <el-option label="单周" value="single" />
            <el-option label="双周" value="double" />
            <el-option label="全周" value="all" />
          </el-select>
        </div>
        <div class="button-group">
          <button @click="showEditDialog = false,drgamitemlog=false,savedrag=false" class="cancel-btn">
            <span>取消</span>
          </button>
          <button @click="handleDelete" class="delete-btn" v-if="editingCourse&&!drgamitemlog">
            <span>删除表格中课程</span>
          </button>
          <button @click="saveCourse" class="save-btn"v-if="!savedrag">
            <span>保存</span>
          </button>
          <button @click="save_drag" class="save-btn"v-if="savedrag">
            <span>保存拖动元素</span>
          </button>
          <button @click="delete_drag_item"class="delete-btn" v-if="drgamitemlog">
            <span>删除拖动元素</span>
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import {  onMounted, ref } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import { createDragItem,deleteDragItem,fetchDragItemlist,updateCellData, updateDragItem } from '../utils/api'
import { ElMessage } from 'element-plus';
const store = useScheduleStore()
const loading = ref(false)
const emit = defineEmits(['courseMoved'])
// 新增状态
const draftCourses = ref([])
const coursePool = ref(null)
async function handleWeekChange(week) {
  try {
    store.currentWeek = week
    await store.fetchTimetable(week)

  } catch (error) {
    console.error('Failed to change week:', error)
  }
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const realtime = [
  '08:30-09:55', // 第1-2节
  '10:15-11:40', // 第3-4节
  '11:45-12:25', // 第5节
  '14:00-15:25', // 第6-7节
  '15:45-17:10', // 第8-9节
  '17:15-17:55', // 第10节
  '19:00-20:20', // 第11-12节
  '20:30-21:50'  // 第13-14节
]

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
  const dayIndex = days.indexOf(day) + 1;
  return store.timetable.filter(c => {
    const matchesWeek = c.week_type === 'all' ||
                      (c.week_type === 'single' && store.currentWeek % 2 === 1) ||
                      (c.week_type === 'double' && store.currentWeek % 2 === 0);
    return c.col_index === dayIndex && matchesWeek;
  });
}

const originalPositions = new Map()

function handleDragStart(e, course) {
  e.dataTransfer.setData('text/plain', course.id)
  e.dataTransfer.effectAllowed = 'move'
  e.target.classList.add('dragging')

  // 保存原位置信息
  originalPositions.set(course.id, {
    row_index: course.row_index,
    col_index: course.col_index,
    element: e.target
  })
}

function handleDragOver(e) {
  e.dataTransfer.dropEffect = 'move'
}

function handleDragEnd(e) {
  const courseId = e.dataTransfer.getData('text/plain')
  const originalPosition = originalPositions.get(courseId)

  if (originalPosition) {
    // 如果没有成功放置，回退到原位置
    if (e.dataTransfer.dropEffect !== 'move') {
      const { row_index, col_index, element } = originalPosition
      element.style.transition = 'all 0.3s ease'
      element.style.top = `${(row_index - 1) * 80}px`
      element.style.left = '4px'
      element.style.right = '4px'

      // 过渡结束后移除样式
      setTimeout(() => {
        element.style.transition = ''
      }, 300)
    }

    originalPositions.delete(courseId)
  }

  e.target.classList.remove('dragging')
}

async function handleDrop(e, day) {
  e.preventDefault();

  // 提取数据
  const courseId = e.dataTransfer.getData('text/plain');
  const targetColumn = e.currentTarget;
  const { top } = targetColumn.getBoundingClientRect();
  const mouseY = e.clientY - top;

  // 计算目标时间槽并验证范围
  const slotIndex = Math.floor(mouseY / 80) + 1;
  if (slotIndex < 1 || slotIndex > realtime.length) {
    console.warn('超出时间范围');
    return;
  }

  // 查找课程（优先从草稿中查找）
  const originalCourse = draftCourses.value.find(c => c.id === courseId) ||
                        store.timetable.find(c => c.id === courseId);
  if (!originalCourse) return;

  // 检查是否是相同位置
  const dayIndex = days.indexOf(day) + 1;
  if (originalCourse.col_index === dayIndex && originalCourse.row_index === slotIndex) {
    return;
  }

  // 检查冲突
  const targetDay = day;
  const targetTime = realtime[slotIndex - 1];
  const targetWeekType = originalCourse.week_type;

  const hasConflict = store.timetable.some(course => {
    if (course.id === courseId) return false;

    const courseDay = days[course.col_index - 1];
    const courseTime = realtime[course.row_index - 1];
    const courseWeekType = course.week_type;

    return courseDay === targetDay &&
           courseTime === targetTime &&
           (courseWeekType === 'all' || targetWeekType === 'all' || courseWeekType === targetWeekType);
  });

  if (hasConflict) {
    ElMessage.warning('目标位置有冲突，取消放置');
    return;
  }

  // 准备更新数据
  const updatedCourse = {
    ...originalCourse,
    col_index: dayIndex,
    row_index: slotIndex
  };

  try {
    const isFromDraft = draftCourses.value.some(c => c.id === courseId);

    if (isFromDraft) {
      // 从草稿区移动到正式课程
      await store.updateCourse(updatedCourse);
      draftCourses.value = draftCourses.value.filter(c => c.id !== courseId);
    } else {
      // 正式课程内部移动
      const updateOperations = [store.updateCourse(updatedCourse)];

      if (!originalCourse.hasConflict) {
        updateOperations.push(
          updateCellData(
            store.currentClass.id || 0,
            store.currentSheet.id || 0,
            {
              Row: originalCourse.row_index,
              Col: originalCourse.col_index
            }
          )
        );
      }

      await Promise.all(updateOperations);
    }
  } catch (error) {
    console.error('拖放操作失败:', error);
    ElMessage.error('操作失败，请重试');
  }
}

function getCourseStyle(course) {
  return {
    top: `${(course.row_index - 1) * 80}px`,
    height: '60px' // 默认高度
  }
}

function getUserColor(userId) {
  const user = store.collaborators.find(u => u.id === userId)
  return user ? user.color : '#ccc'
}

// 编辑相关状态
const editingCourse = ref(null)
const showEditDialog = ref(false)
const drgamitemlog=ref(false)
const savedrag=ref(false)
function handleDblClick(course) {
  console.log('hand',course)
  editingCourse.value = {
    week_type: 'all',
    ...(course || {}),
    id: course?.id //因为id类型问题现在获取的课表无法拖动，创建元素，更新元素等api没有导入
  }
  // console.log('edi',editingCourse.value)
  showEditDialog.value = true
}
function showupdate(course){
  drgamitemlog.value=true
  savedrag.value=true
  handleDblClick(course)
}
async function save_drag(){
  await updateDragItem(editingCourse.value.id, {
            class_room: editingCourse.value.room,
            content: editingCourse.value.course,
            teacher: editingCourse.value.teacher,
            selected_class_ids: [store.currentClass.id],
            week_type: editingCourse.value.week_type,
          })
   console.log('edi',editingCourse.value)

    showEditDialog.value=false
    drgamitemlog.value=false
    savedrag.value=false
    draftCourses.value = draftCourses.value.filter(
    course => course.id !== editingCourse.value.id
  )
    await getdraglist()
}
// 显示创建对话框
function showCreateDialog() {
  drgamitemlog.value=true
  editingCourse.value = {
    id: Math.random(100).toString(),
    course: '新课程',
    teacher: '教师',
    room: '教室',
    week_type: 'all'
  }
  showEditDialog.value = true
}
async function delete_drag_item(params) {
  if (editingCourse.value && confirm('确认删除该拖动课程？')) {
    try{
    await deleteDragItem(editingCourse.value.id)
    ElMessage.success('删除拖动元素成功')
    draftCourses.value = draftCourses.value.filter(
    course => course.id !== editingCourse.value.id
  )
  showEditDialog.value=false
    drgamitemlog.value=false
    savedrag.value=false
    await getdraglist()
  }catch(e){
      ElMessage.warning('必须解除该课程在所有表格的关联')
  }
  }
}
async function saveCourse() {
  if (!editingCourse.value) return;
  console.log('edi',editingCourse.value)
  // 缓存当前班级ID，减少重复访问响应式属性
  const currentClassId = store.currentClass?.id || 0;

  // 使用对象展开语法避免污染原始数据
  const courseToSave = {
    ...editingCourse.value,
    classId: currentClassId
  };

  try {
    // 使用Set实现O(1)复杂度查找，替代数组some方法
    const existingIds = new Set([
      ...store.timetable.map(c => c.id),
      ...draftCourses.value.map(c => c.id)
    ]);

    if (!existingIds.has(courseToSave.id)) {
      // 合并接口参数对象
      const response = await createDragItem({
        content: courseToSave.course,
        teacher: courseToSave.teacher,
        class_room: courseToSave.room,
        week_type: courseToSave.week_type,
        selected_class_ids: [currentClassId], // 使用缓存值
      });
      editingCourse.value.id=response.data.id.toString()
      // 批量更新对象属性
      const newCourse = {
        ...courseToSave,
        id: response.data.id.toString()
      };

      // 使用不可变数据操作减少响应式系统开销
      draftCourses.value = [...draftCourses.value, newCourse];
      ElMessage.success('成功创建拖动元素')
    } else {
      // 使用细粒度状态更新
      store.updateCourse(courseToSave);
    }

    // 延迟界面更新到异步操作完成后
    showEditDialog.value = false;
  } catch (error) {
    console.error('保存课程失败:', error);
  }
}

const handleDelete = async() => {
  if (editingCourse.value && confirm('确认删除该课程？')) {
    console.log('deledi',editingCourse.value)
    store.removeCourse(editingCourse.value.id)
    // draftCourses.value = draftCourses.value.filter(c => c.id !== editingCourse.value.id)
    showEditDialog.value = false
    ElMessage.success('删除成功');
    draftCourses.value=[]
    await getdraglist()
  }
}
async function getdraglist(){
  try{
  loading.value = true
  console.log('ks',store.currentClass.id)
  const response=await fetchDragItemlist(store.currentClass.id)
  console.log(response)
  const dragcourses = response.data.map(item => ({
  id: item.id.toString(),       // 只提取id并转为字符串
  course: item.content,      // 假设原字段是courseName
  teacher: item.teacher,    // 假设原字段是teacherName
  room: item.classroom,         // 直接使用classroom字段
  week_type: item.week_type,   // 假设原字段是weekType
  // 可以继续添加其他需要的字段...
}))
const differentCourses = dragcourses.filter(dragCourse =>
  !store.timetable.some(timetableCourse =>
    timetableCourse.id === dragCourse.id
  )&&
      !draftCourses.value.some(draftCourse =>
        draftCourse.id === dragCourse.id
      )
);
  console.log('diff',differentCourses )
  if(differentCourses){
  draftCourses.value.push(...differentCourses)
  }}catch(e){
    loading.value = false
    throw(e)
  }finally{
    loading.value = false

  }
}
onMounted(async()=>{
  await getdraglist()
})
</script>

<style scoped>
/* 保持原有样式不变 */
.week-selector {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #718096;
  font-size: 16px;
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

.time-header,
.day-header {
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
  top: calc(var(--slot-index) * 80px);
  left: 4px;
  right: 4px;
  height: calc(var(--slot-duration) * 80px);
  min-height: 60px;
  overflow: hidden;
  background: linear-gradient(135deg, #ebf4ff 0%, #c3dafe 100%);
  border: 2px solid #90cdf4;
  border-radius: 8px;
  padding: 10px;
  cursor: grab;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  user-select: none;
}

.course-block.dragging {
  opacity: 0.8;
  transform: scale(0.98);
  cursor: grabbing;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.course-block:active {
  cursor: grabbing;
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

.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 40px;
  padding-bottom: 40px;
  overflow-y: auto;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.modal-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  max-width: 500px;
  max-height: calc(100vh - 100px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow-y: auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

.save-btn,
.cancel-btn,
.delete-btn {
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

  .save-btn,
  .cancel-btn,
  .delete-btn {
    flex: 1;
    justify-content: center;
  }
}

.course-builder-container {
  max-width: 1500px;
  margin: 0 auto;
  padding: 20px;
}

.course-creator {
  margin-bottom: 30px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.course-pool {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  margin-top: 20px;
  min-height: 100px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #e2e8f0;
  align-items: start;
}

.course-block.draft {
  background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
  border-color: #68d391;
  cursor: grab;
  height: 80px;
  margin: 0;
  width: 80px;
  position: static;
  width: 100%;
  box-sizing: border-box;
}

.course-block.draft:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .course-pool {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 768px) {
  .course-pool {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .course-block.draft {
    height: 70px;
    padding: 8px;
  }

  .course-title {
    font-size: 0.85em;
  }

  .course-info {
    font-size: 0.75em;
  }
}

@media (max-width: 480px) {
  .course-pool {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
  }
}
</style>
