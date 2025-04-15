<template>
  <div class="sheet-container">
    <div class="header">
      <h1 class="page-title">当前班级：{{ class_name }}</h1>
      <button @click="showCreateDialog = true" class="create-btn">
        <span class="btn-icon">+</span>
        <span class="btn-text">创建工作表</span>
      </button>
    </div>

    <!-- 创建工作表对话框 -->
    <div v-if="showCreateDialog" class="modal-overlay">
      <div class="modal-content">
        <h2>创建工作表</h2>
        <form @submit.prevent="createSheet">
          <div class="form-group">
            <label for="name">工作表名称 <span class="required">*</span></label>
            <input
              id="name"
              v-model="newSheet.name"
              type="text"
              required
              placeholder="输入工作表名称"
            />
          </div>

          <div class="form-group">
            <label for="week">周数 <span class="required">*</span></label>
            <input
              id="week"
              v-model.number="newSheet.week"
              type="number"
              min="1"
              required
              placeholder="输入周数"
            />
          </div>

          <div class="form-group">
            <label for="row">行数 <span class="required">*</span></label>
            <input
              id="row"
              v-model.number="newSheet.row"
              type="number"
              min="1"
              required
              placeholder="输入行数"
            />
          </div>

          <div class="form-group">
            <label for="col">列数 <span class="required">*</span></label>
            <input
              id="col"
              v-model.number="newSheet.col"
              type="number"
              min="1"
              required
              placeholder="输入列数"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showCreateDialog = false">取消</button>
            <button type="submit" class="submit-btn">创建</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 工作表卡片列表 -->
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="sheet-grid">
      <div
        v-for="sheet in sheets"
        :key="sheet.id"
        class="sheet-card"
        @click="goToSheet(<Sheet>sheet)"
      >
        <div class="sheet-header">
          <h3>{{ sheet.name }}</h3>
          <button
            @click.stop="deleteSheet(<number>sheet.id)"
            class="delete-btn"
            title="删除工作表"
          >
            <span class="delete-icon">×</span>
          </button>
        </div>
        <div class="sheet-meta">
          <div class="meta-item">
            <span class="meta-label">周数:</span>
            <span class="meta-value">{{ sheet.week }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">尺寸:</span>
            <span class="meta-value">{{ sheet.row }}×{{ sheet.col }}</span>
          </div>
        </div>
        <div class="sheet-footer">
          <small>创建时间: {{ formatDate(sheet.create_time) }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {  ref, onMounted } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import * as api from '../utils/api'
import { useScheduleStore } from '../stores/schedule'
// 定义工作表接口
export interface Sheet {
  class_id?: number;
  col?: number;
  create_time?: Date;
  creator_id?: number;
  id?: number;
  name?: string;
  row?: number;
  update_time?: Date;
  week?: number;
  [property: string]: any;
}

const route = useRoute()
const router = useRouter()

const scheduleStore = useScheduleStore()
const class_id = scheduleStore.currentClass?.id
const class_name = scheduleStore.currentClass?.name
// 响应式数据
const sheets = ref<Sheet[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)

// 新工作表表单数据
const newSheet = ref({
  name: '',
  week: 1,
  row: 1,
  col: 1
})

// 组件挂载时获取工作表列表
onMounted(() => {
  console.log('class_name:', class_name)
  console.log('class_id:', class_id)
  fetchSheets()
})

// 从后端获取工作表列表
const fetchSheets = async () => {
  try {
    loading.value = true
    const response = await api.fetch_sheetlist(<number>class_id, {
      page: 1,
      page_size: 10
    })
    sheets.value = response.data.sheets
    console.log('工作表列表:', sheets.value)
  } catch (error) {
    console.error('获取工作表列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 创建工作表
const createSheet = async () => {
  try {
    // 验证数据
    if (!newSheet.value.name || newSheet.value.week < 1 ||
        newSheet.value.row < 1 || newSheet.value.col < 1) {
      alert('请填写完整且有效的表单数据')
      return
    }

    // 调用API创建工作表
    const response = await api.create_sheet(<number>class_id, newSheet.value)

    // 添加到列表
    sheets.value.push(response.data)

    // 重置表单并关闭对话框
    newSheet.value = { name: '', week: 1, row: 1, col: 1 }
    showCreateDialog.value = false
  } catch (error) {
    console.error('创建工作表失败:', error)
    alert('创建工作表失败，请重试')
  }
}
// 删除工作表
const deleteSheet = async (id: number) => {
  if (!confirm('确定要删除这个工作表吗？')) return

  try {
    await api.delete_sheet(<number>class_id, id)
    sheets.value = sheets.value.filter(sheet => sheet.id !== id)
  } catch (error) {
    console.error('删除工作表失败:', error)
    alert('删除工作表失败，请重试')
  }
}

// 跳转到指定工作表
const goToSheet = (sheet:Sheet) => {
  scheduleStore.setCurrentSheet(sheet)
  // console.log('跳转到工作表:', scheduleStore.currentSheet)
  router.push(`/class/${<number>class_id}/sheet/${sheet.id}`)
}

// 格式化日期显示
const formatDate = (date?: Date) => {
  if (!date) return '未知'
  return new Date(date).toLocaleString()
}

</script>

<style scoped>
.sheet-container {
  padding: 30px;
  background-color: #f8fafc;
  min-height: 100vh;
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

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(250px, 1fr));
  gap: 20px;
}

.sheet-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  position: relative;
  border: 1px solid #e2e8f0;
}

.sheet-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e0;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.sheet-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  padding-right: 30px;
}

.delete-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 24px;
  height: 24px;
  background-color: #f56565;
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background-color: #e53e3e;
  transform: scale(1.1);
}

.delete-icon {
  font-size: 16px;
  line-height: 1;
}

.sheet-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
  margin-bottom: 15px;
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

.sheet-footer {
  font-size: 12px;
  color: #718096;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #718096;
  font-size: 16px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 450px;
  max-width: 90%;
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
  .sheet-container {
    margin-left: 0;
    padding: 20px;
    padding-top: 80px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .sheet-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 90%;
    padding: 20px;
  }

  .form-actions {
    justify-content: space-between;
  }
}
</style>
