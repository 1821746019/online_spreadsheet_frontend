<template>
  <el-table :data="tableData" class="form" :key="tableKey">
    <el-table-column fixed prop="id" label="ID" width="120" />
    <el-table-column prop="week_type" label="周次" width="80" />
    <el-table-column prop="day" label="星期" width="100" />
    <el-table-column prop="start" label="开始时间" width="120"/>
    <el-table-column prop="end" label="结束时间" width="120"/>
    <el-table-column prop="course" label="课程名称" width="180"/>
    <el-table-column prop="teacher" label="教师" width="150"/>
    <el-table-column prop="room" label="教室" width="150"/>
    <el-table-column prop="lastUpdatedBy" label="最后更新人" width="150"/>
    <el-table-column fixed="right" label="Operations" min-width="120">
      <template #default="scope">
        <el-button link type="primary" size="small" @click="handleEdit(scope.row)">
          编辑
        </el-button>
        <el-button link type="danger" size="small" @click="handleDelete(scope.row.id)">
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- 编辑模态框 -->
  <teleport to="body">
    <div v-if="showEditDialog" class="edit-modal">
      <div class="modal-card">
        <h3 class="modal-title">编辑课程信息</h3>
        <div class="form-group">
          <label class="input-label">课程名称</label>
          <el-input
            v-model="editingCourse.course"
            type="text"
            class="modern-input rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            v-if="editingCourse"
          />
        </div>
        <div class="form-group">
          <label class="input-label">授课教师</label>
          <el-input
            v-model="editingCourse.teacher"
            type="text"
            class="modern-input rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            v-if="editingCourse"
          />
        </div>
        <div class="form-group">
          <label class="input-label">教室</label>
          <el-input
            v-model="editingCourse.room"
            type="text"
            class="modern-input rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            v-if="editingCourse"
          />
        </div>
        <div class="form-group">
          <label class="input-label">星期</label>
          <el-select
            v-model="editingCourse.day"
            class="modern-input w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            v-if="editingCourse"
          >
            <el-option label="星期一" value="Monday" />
            <el-option label="星期二" value="Tuesday" />
            <el-option label="星期三" value="Wednesday" />
            <el-option label="星期四" value="Thursday" />
            <el-option label="星期五" value="Friday" />
            <el-option label="星期六" value="Saturday" />
            <el-option label="星期日" value="Sunday" />
          </el-select>
        </div>
        <div class="form-group">
          <label class="input-label">起始时间</label>
          <el-input
            v-model="editingCourse.start"
            type="text"
            class="modern-input rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            v-if="editingCourse"
          />
        </div>
        <div class="form-group">
          <label class="input-label">结束时间</label>
          <el-input
            v-model="editingCourse.end"
            type="text"
            class="modern-input rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            v-if="editingCourse"
          />
        </div>
        <div class="form-group">
          <label class="input-label">周次类型</label>
          <el-select v-model="editingCourse.week_type" class="modern-input w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" v-if="editingCourse">
            <el-option label="单周" value="single" />
            <el-option label="双周" value="double" />
            <el-option label="都有" value="douyou" />
          </el-select>
        </div>
        <div class="button-group">
          <button @click="showEditDialog = false" class="cancel-btn">
            <span>取消</span>
          </button>
          <button @click="handleDelete(editingCourse?.id)" class="delete-btn" v-if="editingCourse">
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

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useScheduleStore } from '../stores/schedule'
import { useAuthStore } from '../stores/auth'
import { ElInput } from 'element-plus'

interface Course {
  id: string
   week_type: 'single' | 'double' | 'douyou'
  day: string
  start: string
  end: string
  course: string
  teacher: string
  room: string
  lastUpdatedBy: string | undefined
  classId: number
  // semester: string
}

const store = useScheduleStore()
const auth = useAuthStore()
const tableKey = ref(0)

const tableData = computed(() => {
  return store.timetable.filter(course =>
    course.classId === store.currentClass?.id
  //   &&
  //  course.semester === store.currentSemester
  )
})

const forceTableUpdate = () => {
  tableKey.value++
}

// 编辑相关状态
const editingCourse = ref<Course | null>(null)
const showEditDialog = ref(false)

const handleEdit = (row: Course) => {
  editingCourse.value = JSON.parse(JSON.stringify(row))
  showEditDialog.value = true
}

const handleDelete = (id: string) => {
  store.removeCourse(id)
  console.log('Deleted course:', id)
}

// 保存修改
function saveCourse() {
  if (editingCourse.value) {
    const updatedCourse = {
      ...editingCourse.value,
      classId: store.currentClass?.id || 0,
      // semester: store.currentSemester || '2024-2025-第一学期',
      lastUpdatedBy: auth.user?.username || '未知用户'
    }

    store.updateCourse(updatedCourse).then(() => {
      showEditDialog.value = false
      forceTableUpdate()
    })
  }
}
</script>

<style scoped>
.form {
  max-width: 1800px;
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
  width: 440px;
  max-height: calc(100vh - 80px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow-y: auto;
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

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
}

.modern-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #111827;
  background-color: #f9fafb;
  transition: all 0.2s ease;
}

.modern-input:hover {
  border-color: #9ca3af;
  background-color: #fff;
}

.modern-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
  background-color: #fff;
}

.el-select .el-input__inner {
  height: 2.25rem;
  line-height: 2.25rem;
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
