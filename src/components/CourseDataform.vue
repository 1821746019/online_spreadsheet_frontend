<template>
  <el-table :data="tableData" class="form" :key="tableKey">
    <el-table-column label="班级"width="200">
    <template #default>
      {{ currentClass?.name }} <!-- 直接显示 week 变量 -->
    </template>
  </el-table-column>
    <el-table-column label="周次"width="100">
    <template #default>
      第{{ weeknumber }}周 <!-- 直接显示 week 变量 -->
    </template>
  </el-table-column>
    <!-- <el-table-column fixed prop="id" label="ID" width="120" /> -->
    <el-table-column prop="week_type" label="周类型" width="80" >
      <template #default="{ row }">
    <span v-if="row.week_type === 'single'">单周</span>
    <span v-else-if="row.week_type === 'double'">双周</span>
    <span v-else-if="row.week_type === 'all'">全周</span>
    <span v-else>{{ row.week_type }}</span> <!-- 兜底显示原值 -->
  </template>
    </el-table-column>
    <el-table-column prop="col_index" label="星期" width="100">
      <template #default="scope">
        {{ getDayFromColIndex(scope.row.col_index) }}
      </template>
    </el-table-column>
    <el-table-column prop="row_index" label="时间段" width="180">
      <template #default="scope">
        {{ getTimeFromRowIndex(scope.row.row_index) }}
      </template>
    </el-table-column>
    <el-table-column prop="course" label="课程名称" width="180"/>
    <el-table-column prop="teacher" label="教师" width="100"/>
    <el-table-column prop="room" label="教室" width="150"/>

    <el-table-column fixed="right" label="操作" min-width="120">
      <template #default="scope">
        <!-- <el-button link type="primary" size="small" @click="handleEdit(scope.row)">
          编辑
        </el-button> -->
        <el-button link type="danger" size="small" @click="handleDelete(scope.row)">
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
            class="modern-input"
            v-if="editingCourse"
          />
        </div>
        <div class="form-group">
          <label class="input-label">授课教师:{{ editingCourse ? editingCourse.teacher : '' }}</label>
        </div>
        <!-- <div class="form-group">
          <label class="input-label">授课教师</label>
          <el-input
            v-model="editingCourse.teacher"
            type="text"
            class="modern-input rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            v-if="editingCourse"
          />
        </div> -->
        <div class="form-group">
          <label class="input-label">教室</label>
          <el-input
            v-model="editingCourse.room"
            type="text"
            class="modern-input "
            v-if="editingCourse"
          />
        </div>
        <div class="form-group">
          <label class="input-label">星期</label>
          <el-select
            v-model="editingCourse.col_index"
            class="modern-input"
            v-if="editingCourse"
          >
            <el-option label="星期一" :value="1" />
            <el-option label="星期二" :value="2" />
            <el-option label="星期三" :value="3" />
            <el-option label="星期四" :value="4" />
            <el-option label="星期五" :value="5" />
            <el-option label="星期六" :value="6" />
            <el-option label="星期日" :value="7" />
          </el-select>
        </div>
        <div class="form-group">
          <label class="input-label">时间段</label>
          <el-select
            v-model="editingCourse.row_index"
            class="modern-input "
            v-if="editingCourse"
          >
            <el-option label="08:30-09:55 (第1-2节)" :value="1" />
            <el-option label="10:15-11:40 (第3-4节)" :value="2" />
            <el-option label="11:45-12:25 (第5节)" :value="3" />
            <el-option label="14:00-15:25 (第6-7节)" :value="4" />
            <el-option label="15:45-17:10 (第8-9节)" :value="5" />
            <el-option label="17:15-17:55 (第10节)" :value="6" />
            <el-option label="19:00-20:20 (第11-12节)" :value="7" />
            <el-option label="20:30-21:50 (第13-14节)" :value="8" />
          </el-select>
        </div>
        <!-- <div class="form-group">
          <label class="input-label">周次类型</label>
          <el-select v-model="editingCourse.week_type" class="modern-input w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" v-if="editingCourse">
            <el-option label="单周" value="single" />
            <el-option label="双周" value="double" />
            <el-option label="都有" value="all" />
          </el-select>
        </div> -->
        <div class="button-group">
          <button @click="showEditDialog = false" class="cancel-btn">
            <span>取消</span>
          </button>
          <button @click="handleDelete(editingCourse)" class="delete-btn" v-if="editingCourse">
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
import { ElInput,ElMessage } from 'element-plus'

interface Course {
  id: number
  row_index: number
  col_index: number
  week_type: 'single' | 'double' | 'all'
  course: string
  teacher: string
  room: string
  lastUpdatedBy: string | undefined
  classId: number
}

const store = useScheduleStore()
const auth = useAuthStore()
const tableKey = ref(0)

function getDayFromColIndex(colIndex: number): string {
  const days = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期天'];
  return days[colIndex - 1] || 'Monday';
}

function getTimeFromRowIndex(rowIndex: number): string {
  const times = [
    '08:30-09:55', '10:15-11:40', '11:45-12:25',
    '14:00-15:25', '15:45-17:10', '17:15-17:55',
    '19:00-20:20', '20:30-21:50'
  ];
  return times[rowIndex - 1] || '08:30-09:55';
}


const tableData = computed(() => {
  // 获取原始数据
  const data = store.timetable;

  // 创建一个新数组并排序
  return [...data].sort((a, b) => {
    // 1. 先按 col_index 排序
    if (a.col_index !== b.col_index) {
      return a.col_index - b.col_index;
    }

    // 2. 如果 col_index 相同，按 row_index 排序
    if (a.row_index !== b.row_index) {
      return a.row_index - b.row_index;
    }

    // 3. 如果 row_index 也相同，按 week_type 排序
    if (a.week_type !== b.week_type) {
      // 假设 week_type 是字符串，按字母顺序排序
      // 如果是数字，可以用 a.week_type - b.week_type
      return a.week_type.localeCompare(b.week_type);
    }

    // 4. 如果 week_type 也相同，最后按 teacher 排序
    return a.teacher.localeCompare(b.teacher);
  });
});
const weeknumber = computed(() => store.currentWeek)
const currentClass = computed(() => store.currentClass)
const forceTableUpdate = () => {
  tableKey.value++
}

// 编辑相关状态
const editingCourse = ref<Course | null>(null)
const showEditDialog = ref(false)

// const handleEdit = (row: Course) => {

//   // 深拷贝以避免直接修改原数据
//   editingCourse.value = JSON.parse(JSON.stringify(row))
//   if(editingCourse.value?.teacher!=auth.user?.username) {
//     ElMessage.error('只能编辑自己的课程');
//     return;
//     // 如果正在编辑同一行，直接返回
//   }
//   showEditDialog.value = true
// }

const handleDelete = (row: Course) => {
  const id = row.id.toString();
  if (!id) {
    ElMessage.error('课程ID不能为空');
    return;
  }
  if(row.teacher !== auth.user?.username) {
    ElMessage.error('只能删除自己的课程');
    return;
  }
  store.removeCourse(id)
  console.log('Deleted course:', id)
  ElMessage.success('删除成功');

}

// 保存修改
function saveCourse() {
  if (editingCourse.value) {
    const updatedCourse = {
      ...editingCourse.value,
      classId: store.currentClass?.id || 0,
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
/* 保留原有样式不变 */
.form {
  max-width: 1450px;
  min-width: 800px
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
  overflow-y: hidden;
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
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  /* padding: 12px 16px; */
  transition: all 0.3s ease;
  font-size: 0.95rem;
  /* background-color: #f8fafc; */
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
    padding-top: 4px;
  padding-bottom: 2px;
  }

  .save-btn, .cancel-btn, .delete-btn {
    flex: 1;
    justify-content: center;
    padding: 5px 10px;
  font-size: 0.8rem;
  font-weight: 100;
  }

}
</style>
