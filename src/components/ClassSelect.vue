<template>
  <div class="class-select-container">
    <div class="header">
      <h1 class="page-title">选择班级</h1>
      <button class="create-btn" @click="showCreateDialog = true">
        <span class="btn-icon">+</span>
        <span class="btn-text">创建班级</span>
      </button>
    </div>
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 创建班级对话框 -->
     <teleport to="body">
    <div v-if="showCreateDialog" class="modal-overlay">
      <div class="modal-content">
        <h2>创建新班级</h2>
        <form @submit.prevent="createclass">
          <div class="form-group">
            <label for="className">班级名称 <span class="required">*</span></label>
            <input
              id="className"
              v-model="formData.name"
              type="text"
              required
              placeholder="请输入班级名称"
            >
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showCreateDialog = false">取消</button>
            <button type="submit" class="submit-btn">创建</button>
          </div>
        </form>
      </div>
    </div>
    </teleport>

    <div class="class-grid">
      <div
        v-for="classItem in classList"
        :key="classItem.id"
        class="class-card"
        @click="selectClass(classItem)"
      >
        <div class="class-name">{{ classItem.name }}</div>
        <button class="delete-btn" @click.stop="deleteClassHandler(classItem.id)">
          <span class="delete-icon">×</span>
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useScheduleStore } from '../stores/schedule';
import { createClass, fetchClasses, deleteClass } from '../utils/api'
import { ElMessage } from 'element-plus';


interface ClassItem {
  id: number;
  name: string;
  create_id: string;
  create_time: string;
  update_time: string;
}
const loading = ref(false)
const scheduleStore = useScheduleStore();
const router = useRouter();
const classList = ref<ClassItem[]>([]);
const showCreateDialog = ref(false);
const formData = reactive({
  name: '',
  create_sheet: false,
  weeks: 1
});

const fetchClassList = async () => {
  try {
    loading.value = true
    const classRes = await fetchClasses();
    classList.value = classRes.data?.list || [];
    console.log('班级列表:', classList.value);
  } catch (error) {
    console.error('获取班级列表失败:', error);
    classList.value = []; // 确保在出错时清空班级列表
  }finally{
    loading.value = false
  }
};

const createclass = async () => {
  try {
    await createClass({
      name: formData.name,
      create_sheet: formData.create_sheet,
      weeks: formData.create_sheet ? formData.weeks : undefined
    });
    showCreateDialog.value = false;
    formData.name = '';
    formData.create_sheet = false;
    formData.weeks = 1;
    ElMessage.success('成功创建班级')
    await fetchClassList();
  } catch (error) {
    console.error('创建班级失败:', error);
  }
};

const deleteClassHandler = async (classId: number) => {
  if (confirm('确定要删除这个班级吗？')) {
    try {
      await deleteClass(classId);
      ElMessage.success('成功删除班级')
      await fetchClassList();
    } catch (error) {
      console.error('删除班级失败:', error);
    }
  }
};

const selectClass = (classItem: ClassItem) => {
  scheduleStore.setCurrentClass(classItem);
  router.push({
    name: 'SheetSelect',
    params: { class_id: classItem.id}
  });
};

onMounted(() => {
  fetchClassList();
});


</script>

<style scoped>
.class-select-container {
  padding: 30px;
  background-color: #f8fafc;
  min-height: 100vh;
}
.loading {
  text-align: center;
  padding: 40px;
  color: #718096;
  font-size: 16px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.create-btn {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: linear-gradient(90deg, #3a7bd5, #00d2ff);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-icon {
  font-size: 18px;
  margin-right: 8px;
}

.class-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(250px, 1fr));
  gap: 20px;
}

.class-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  position: relative;
  border: 1px solid #e2e8f0;
}

.class-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e0;
}

.class-name {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 15px;
  padding-right: 30px;
}

.delete-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ff6b6b;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
}

.class-card:hover .delete-btn {
  opacity: 1;
  transform: scale(0.75);
}

.delete-icon {
  color: white;
  font-size: 26px;
  font-weight: 300;
  line-height: 1;
  margin-top: -2px;
}

.delete-btn:hover {
  background: #fa5252;
  transform: scale(1.1) !important;
}

.class-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
}

.meta-label {
  color: #718096;
}

.meta-value {
  color: #4a5568;
}

/* 模态框样式 */
.modal-overlay {
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

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 450px;
  max-width: 90%;
  position: absolute;     /* 绝对定位 */
  top: 25%;               /* 调整这个值控制偏上程度（默认50%是正中间） */
  left: 0;
  right: 0;
  margin: 0 auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 25px;
  color: #2d3748;
  font-size: 22px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #4a5568;
}

.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: 10px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus {
  outline: none;
  border-color: #3a7bd5;
  box-shadow: 0 0 0 2px rgba(58, 123, 213, 0.2);
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-group input[type="checkbox"] {
  margin-right: 10px;
}

.required {
  color: #f56565;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}

.cancel-btn {
  padding: 8px 16px;
  background-color: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background-color: #cbd5e0;
}

.submit-btn {
  padding: 8px 16px;
  background: linear-gradient(90deg, #3a7bd5, #00d2ff);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .class-select-container {
    margin-left: 0;
    padding: 20px;
    padding-top: 80px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .class-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 90%;
    padding: 20px;
  }

  .form-actions {
    justify-content: space-between;
  }
   .delete-btn {
    opacity: 1;
    transform: scale(0.75);
  }
}
</style>
