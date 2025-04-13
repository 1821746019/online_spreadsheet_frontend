<template>
  <teleport to="body">
    <div v-if="show" class="edit-modal">
      <div class="modal-card">
        <h3 class="modal-title">{{ title }}</h3>
        <div class="form-group">
          <label>课程名称</label>
          <el-input v-model="course.course" type="text" class="modern-input"></el-input>
        </div>
        <div class="form-group">
          <label>授课教师</label>
          <el-input v-model="course.teacher" type="text" class="modern-input"></el-input>
        </div>
        <div class="form-group">
          <label>教室</label>
          <el-input v-model="course.room" type="text" class="modern-input"></el-input>
        </div>
        <div class="form-group">
          <label>起始时间</label>
          <el-input v-model="course.start" type="text" class="modern-input"></el-input>
        </div>
        <div class="form-group">
          <label>结束时间</label>
          <el-input v-model="course.end" type="text" class="modern-input"></el-input>
        </div>
        <div class="button-group">
          <button @click="cancel" class="cancel-btn">
            <span>取消</span>
          </button>
          <button @click="deleteCourse" class="delete-btn" v-if="showDelete">
            <span>删除课程</span>
          </button>
          <button @click="save" class="save-btn">
            <span>保存</span>
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElInput } from 'element-plus'

const props = defineProps({
  show: Boolean,
  courseData: Object,
  title: {
    type: String,
    default: '编辑课程信息'
  },
  showDelete: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['save', 'cancel', 'delete'])

const course = ref({
  day: 'Monday',
  start: '8:30',
  end: '9:10',
  course: '',
  teacher: '',
  room: '',
  week: 1
})

watch(() => props.courseData, (newVal) => {
  if (newVal) {
    course.value = { ...newVal }
  }
}, { immediate: true })

function save() {
  emit('save', { ...course.value })
}

function cancel() {
  emit('cancel')
}

function deleteCourse() {
  if (confirm('确认删除该课程？')) {
    emit('delete', course.value.id)
  }
}
</script>

<style scoped>
/* 保持原有样式不变 */
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
</style>
