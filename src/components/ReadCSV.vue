<template>
  <div
    class="csv-uploader"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="handleDrop"
    :class="{ 'dragging': isDragging }"
  >
    <!-- 文件上传区域 -->
    <div class="upload-area">
      <input
        type="file"
        accept=".csv"
        @change="handleFileUpload"
        ref="fileInput"
        class="file-input"
      />
      <div class="upload-prompt">
        <p>拖拽CSV文件到此处或点击选择文件</p>
        <small>支持标准CSV格式，第一行应为表头</small>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <span>解析中...</span>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

    <!-- 数据预览 -->
    <div v-if="csvData.length" class="preview-container">
      <div class="preview-header">
        <h4>预览数据 (共{{ csvData.length }}行)</h4>
        <div class="preview-actions">
          <button @click="confirmImport" class="confirm-btn">确认导入</button>
          <button @click="clearData" class="cancel-btn">取消</button>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th v-for="header in csvHeaders" :key="header">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in previewData" :key="index">
              <td v-for="(value, key) in row" :key="key">{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Papa from 'papaparse';

const fileInput = ref(null);
const isLoading = ref(false);
const isDragging = ref(false);
const errorMessage = ref('');
const csvHeaders = ref([]);
const csvData = ref([]);

// 只预览前5行数据
const previewData = computed(() => csvData.value.slice(0, 5));

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  parseCSV(file);
};

const handleDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file && file.name.endsWith('.csv')) {
    parseCSV(file);
  } else {
    errorMessage.value = '请上传CSV格式文件';
  }
};

const parseCSV = (file) => {
  if (!file) return;

  // 验证文件类型
  if (!file.name.endsWith('.csv')) {
    errorMessage.value = '请上传CSV格式文件';
    return;
  }

  // 重置状态
  isLoading.value = true;
  errorMessage.value = '';
  csvData.value = [];

  // 解析配置
  Papa.parse(file, {
    header: true,          // 第一行为标题
    skipEmptyLines: true,  // 跳过空行
    transformHeader: header => header.trim(), // 清理表头空格
    transform: value => value ? value.trim() : '', // 清理数据空格
    complete: (results) => {
      if (results.errors.length) {
        errorMessage.value = '文件解析错误: ' +
          results.errors.map(e => `${e.row}: ${e.message}`).join('; ');
      } else if (!results.meta.fields || !results.data.length) {
        errorMessage.value = '文件没有有效数据或表头';
      } else {
        // 验证表头有效性
        const invalidHeaders = results.meta.fields.filter(h => !h || h.startsWith('__'));
        if (invalidHeaders.length) {
          errorMessage.value = `表头包含无效字段: ${invalidHeaders.join(', ')}`;
        } else {
          csvHeaders.value = results.meta.fields;
          csvData.value = results.data;
        }
      }
      isLoading.value = false;
      fileInput.value.value = '';
    },
    error: (error) => {
      errorMessage.value = `解析失败: ${error.message}`;
      isLoading.value = false;
    }
  });
};

const confirmImport = () => {
  // 确保数据有效
  if (!csvData.value.length || !csvHeaders.value.length) {
    errorMessage.value = '没有有效数据可导入';
    return;
  }

  // 转换数据格式以匹配CommonFormView的要求
  const formattedData = csvData.value.map((row, index) => {
    const formattedRow = {
      __rowId: Date.now() + index,
      __rowNumber: String(index + 1)
    };

    // 复制所有CSV列到行对象
    csvHeaders.value.forEach(header => {
      formattedRow[header] = row[header] || '';
    });

    return formattedRow;
  });

  // 过滤掉空行和无效数据
  const validData = formattedData.filter(row =>
    Object.values(row).some(val => val && val.toString().trim())
  );

  if (!validData.length) {
    errorMessage.value = '没有有效数据可导入';
    return;
  }

  emit('data-loaded', validData, csvHeaders.value);
  clearData();
};

const clearData = () => {
  csvData.value = [];
  csvHeaders.value = [];
};

// 定义emit
const emit = defineEmits(['data-loaded']);
</script>

<style scoped>
.csv-uploader {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
}

.csv-uploader.dragging {
  border-color: #42b983;
  background-color: rgba(66, 185, 131, 0.1);
}

.upload-area {
  position: relative;
  text-align: center;
  padding: 40px 20px;
  cursor: pointer;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-prompt p {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.upload-prompt small {
  color: #7f8c8d;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(66, 185, 131, 0.3);
  border-radius: 50%;
  border-top-color: #42b983;
  animation: spin 1s ease-in-out infinite;
  margin-right: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: #e74c3c;
  padding: 10px;
  background-color: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
  margin: 10px 0;
}

.preview-container {
  margin-top: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.preview-actions button {
  padding: 5px 15px;
  margin-left: 10px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}

.confirm-btn {
  background-color: #42b983;
  color: white;
}

.cancel-btn {
  background-color: #f8f9fa;
  border: 1px solid #ddd !important;
}

.table-container {
  max-height: 300px;
  overflow-y: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px 15px;
  border: 1px solid #eee;
  text-align: left;
}

th {
  background-color: #f8f9fa;
  position: sticky;
  top: 0;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}
</style>
