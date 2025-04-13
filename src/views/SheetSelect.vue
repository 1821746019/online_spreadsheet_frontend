<template>
  <div class="sheet-container">
    <h2>{{ class_name }}</h2>
    <!-- 创建新工作表按钮 -->
    <button @click="showCreateDialog = true" class="create-btn">
      创建工作表
    </button>

    <!-- 创建工作表对话框 -->
    <div v-if="showCreateDialog" class="create-dialog">
      <h3>创建工作表</h3>
      <form @submit.prevent="createSheet">
        <div class="form-group">
          <label for="name">工作表名称</label>
          <input
            id="name"
            v-model="newSheet.name"
            type="text"
            required
            placeholder="输入工作表名称"
          />
        </div>

        <div class="form-group">
          <label for="week">周数</label>
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
          <label for="row">行数</label>
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
          <label for="col">列数</label>
          <input
            id="col"
            v-model.number="newSheet.col"
            type="number"
            min="1"
            required
            placeholder="输入列数"
          />
        </div>

        <div class="dialog-actions">
          <button type="button" @click="showCreateDialog = false">取消</button>
          <button type="submit">创建</button>
        </div>
      </form>
    </div>

    <!-- 工作表卡片列表 -->
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="sheet-cards">
      <div
        v-for="sheet in sheets"
        :key="sheet.id"
        class="sheet-card"
        @click="goToSheet(<number>sheet.id)"
      >
        <div class="sheet-header">
          <h3>{{ sheet.name }}</h3>
          <button
            @click.stop="deleteSheet(<number>sheet.id)"
            class="delete-btn"
            title="删除工作表"
          >
            ×
          </button>
        </div>
        <div class="sheet-meta">
          <span>周数: {{ sheet.week }}</span>
          <span>尺寸: {{ sheet.row }}×{{ sheet.col }}</span>
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
const goToSheet = (id: number) => {
  router.push(`/class/${<number>class_id}/sheet/${id}`)
}

// 格式化日期显示
const formatDate = (date?: Date) => {
  if (!date) return '未知'
  return new Date(date).toLocaleString()
}

</script>
<style scoped>
.sheet-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.create-btn {
  background-color: #4CAF50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
}

.create-btn:hover {
  background-color: #45a049;
}

.create-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.dialog-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-actions button:last-child {
  background-color: #4CAF50;
  color: white;
}

.sheet-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 5fr));
  gap: 20px;
}

.sheet-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.sheet-card:hover {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.delete-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #ff4444;
}

.delete-btn:hover {
  color: #cc0000;
}

.sheet-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #666;
}

.sheet-footer {
  font-size: 12px;
  color: #999;
}

.loading {
  text-align: center;
  padding: 20px;
}
</style>
