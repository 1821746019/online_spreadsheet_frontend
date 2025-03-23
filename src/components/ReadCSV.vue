<template>
  <div>
    <!-- 文件上传输入 -->
    <input
      type="file"
      accept=".csv"
      @change="handleFileUpload"
      ref="fileInput"
    />

    <!-- 加载状态 -->
    <div v-if="isLoading">解析中...</div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

    <!-- 数据预览表格 -->
    <table v-if="csvData.length">
      <thead>
        <tr>
          <th v-for="header in csvHeaders" :key="header">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in csvData" :key="index">
          <td v-for="(value, key) in row" :key="key">{{ value }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Papa from 'papaparse';

const fileInput = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');
const csvHeaders = ref([]);
const csvData = ref([]);

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 重置状态
  isLoading.value = true;
  errorMessage.value = '';
  csvData.value = [];

  // 解析配置
  Papa.parse(file, {
    header: true,          // 第一行为标题
    skipEmptyLines: true,  // 跳过空行
    complete: (results) => {
      if (results.errors.length) {
        errorMessage.value = '文件解析错误，请检查格式';
      } else {
        csvHeaders.value = results.meta.fields;
        csvData.value = results.data;
      }
      isLoading.value = false;
      // 清空input以便重复上传同一文件
      fileInput.value.value = '';
    },
    error: (error) => {
      errorMessage.value = `解析失败: ${error.message}`;
      isLoading.value = false;
    }
  });
};
</script>

<style scoped>
.error {
  color: red;
  margin: 10px 0;
}

table {
  margin-top: 20px;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
}

th {
  background-color: #f2f2f2;
}
.feat-btn {
  background-color: #2c3e50;
  color: white;
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}
</style>
