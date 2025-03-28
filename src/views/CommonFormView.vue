<template>
  <div class="common-form-view">
    <h2>表格编辑</h2>

    <!-- CSV导入组件 -->
    <ReadCSV ref="csvImporter" @data-loaded="handleCSVData" />

    <!-- 操作按钮组 -->
    <div class="action-buttons">
      <button @click="addNewItem">新增行</button>
      <button @click="addNewColumn">新增列</button>
      <button @click="deleteSelectedColumn" :disabled="!selectedColumn">删除列</button>
      <button @click="exportToCSV">导出CSV</button>
    </div>

    <!-- AG Grid表格 -->
    <div class="excel-table-container">
      <table class="excel-table">
        <thead>
          <tr>
            <th @dblclick="startEditRowHeader" :class="{ 'editing-header': editingRowHeader }">
              <template v-if="editingRowHeader">
                <input v-model="newRowHeaderName" @blur="saveRowHeader" @keyup.enter="saveRowHeader"
                  @keyup.escape="editingRowHeader = false" class="header-input" autofocus />
              </template>
              <template v-else>
                {{ newRowHeaderName }}
              </template>
            </th>
            <th v-for="(header, index) in tableHeaders" :key="index" @click="selectedColumn = header"
              @dblclick="editColumnHeader(index)"
              :class="{ 'selected-column': selectedColumn === header, 'editing-header': editingHeader === index }">
              <template v-if="editingHeader === index">
                <input v-model="newHeaderName" @blur="saveColumnHeader(index)" @keyup.enter="saveColumnHeader(index)"
                  @keyup.escape="editingHeader = null" class="header-input" autofocus />
              </template>
              <template v-else>
                {{ header }}
              </template>
            </th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in tableData" :key="rowIndex">
            <td>
              <input type="text" v-model="row.__rowNumber" @focus="onCellFocus(rowIndex, '__rowNumber')"
                @blur="onCellBlur(rowIndex, '__rowNumber')">
            </td>
            <td v-for="(header, colIndex) in tableHeaders" :key="colIndex">
              <textarea v-model="row[header]" @focus="onCellFocus(rowIndex, header)"
                @blur="onCellBlur(rowIndex, header)" @keydown.enter.prevent="row[header] += '\n'"></textarea>
            </td>
            <td class="action-cell">
              <button @click="deleteItem(rowIndex)" class="delete-btn">删除行</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑对话框 -->
    <div v-if="showEditDialog" class="edit-dialog">
      <h3>{{ isEditing ? '编辑' : '新增' }}记录</h3>
      <form @submit.prevent="saveItem">
        <div v-for="header in tableHeaders" :key="header">
          <label :for="header">{{ header }}:</label>
          <input :id="header" v-model="currentItem[header]" type="text">
        </div>
        <button type="submit">保存</button>
        <button type="button" @click="cancelEdit">取消</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ReadCSV from '@/components/ReadCSV.vue';
import Papa from 'papaparse';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

const tableHeaders = ref(Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i)));
const selectedColumn = ref(null);
const editingHeader = ref(null);
const newHeaderName = ref('');

// 编辑列标题
const editColumnHeader = (index) => {
  editingHeader.value = index;
  newHeaderName.value = tableHeaders.value[index];
};

// 保存列标题修改
const saveColumnHeader = (index) => {
  if (newHeaderName.value && newHeaderName.value !== tableHeaders.value[index]) {
    const oldHeader = tableHeaders.value[index];
    tableHeaders.value[index] = newHeaderName.value;

    // 更新所有行数据中的键
    tableData.value.forEach(row => {
      row[newHeaderName.value] = row[oldHeader];
      delete row[oldHeader];
    });

    // 通知服务器数据更新
    if (socket.value) {
      socket.value.emit('table-update', {
        rows: tableData.value,
        activeCells: currentUsers.value
      });
    }
  }
  editingHeader.value = null;
};

// 行号标题编辑功能
const editingRowHeader = ref(false);
const newRowHeaderName = ref('行号');

const startEditRowHeader = () => {
  editingRowHeader.value = true;
};

const saveRowHeader = () => {
  if (newRowHeaderName.value.trim()) {
    editingRowHeader.value = false;
  }
};

// 删除选中列
const deleteSelectedColumn = () => {
  if (!selectedColumn.value) return;

  const index = tableHeaders.value.indexOf(selectedColumn.value);
  if (index !== -1) {
    tableHeaders.value.splice(index, 1);
    tableData.value.forEach(row => {
      delete row[selectedColumn.value];
    });
    selectedColumn.value = null;

    // 通知服务器数据更新
    if (socket.value) {
      socket.value.emit('table-update', {
        rows: tableData.value,
        activeCells: currentUsers.value
      });
    }
  }
};

const showEditDialog = ref(false);
const isEditing = ref(false);
const currentItem = ref({});

const tableData = ref(Array.from({ length: 5 }, (_, i) => {
  const row = { __rowNumber: String(i + 1) };
  tableHeaders.value.forEach(header => {
    row[header] = '';
  });
  return row;
}));
const csvImporter = ref(null);
const socket = ref(null);
const authStore = useAuthStore();
const currentUsers = ref({}); // { cellId: username }

// 处理从CSV组件接收的数据
const isLoading = ref(false);
const errorMessage = ref('');

const handleCSVData = (data, headers) => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    // 过滤掉内部字段(__rowId, __rowNumber)
    const filteredHeaders = headers ?
      headers.filter(h => !h.startsWith('__')) :
      Array.from({ length: Math.max(...data.map(row => Object.keys(row).length)) }, (_, i) => String.fromCharCode(65 + i));

    tableHeaders.value = filteredHeaders;

    // 保留原始数据中的内部字段
    tableData.value = data.map(row => {
      const newRow = {};
      // 保留内部字段
      if (row.__rowId) newRow.__rowId = row.__rowId;
      if (row.__rowNumber) newRow.__rowNumber = row.__rowNumber;

      // 添加CSV数据
      filteredHeaders.forEach(header => {
        newRow[header] = row[header] || '';
      });

      return newRow;
    });

    // 自动添加缺失的列
    const allHeaders = new Set(tableHeaders.value);
    tableData.value.forEach(row => {
      Object.keys(row).forEach(key => {
        if (!key.startsWith('__') && !allHeaders.has(key)) {
          allHeaders.add(key);
        }
      });
    });

    // 更新表头
    tableHeaders.value = Array.from(allHeaders);

    // 确保所有行都有所有列
    tableData.value = tableData.value.map(row => {
      const completeRow = { ...row };
      tableHeaders.value.forEach(header => {
        if (!(header in completeRow)) {
          completeRow[header] = '';
        }
      });
      return completeRow;
    });

    // 通知服务器数据更新
    if (socket.value) {
      socket.value.emit('table-update', {
        rows: tableData.value,
        activeCells: currentUsers.value
      });
    }
  } catch (error) {
    errorMessage.value = `导入失败: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
};

const onCellFocus = (rowIndex, header) => {
  const cellId = `${rowIndex}-${header}`;

  // 初始化WebSocket连接
  if (!socket.value) {
    socket.value = io('http://localhost:3000');
    socket.value.on('table-update', (data) => {
      tableData.value = data.rows;
      currentUsers.value = data.activeCells;
    });

    socket.value.emit('user-joined', {
      username: authStore.user?.username || 'Anonymous'
    });
  }

  // 通知服务器当前单元格被编辑
  socket.value.emit('cell-focus', {
    rowIndex,
    field: header,
    username: authStore.user?.username || 'Anonymous'
  });

  // 自动调整textarea高度
  if (header !== '__rowNumber') {
    const colIndex = tableHeaders.value.indexOf(header) + 2; // +2 for row number and 1-based index
    const textarea = document.querySelector(`.excel-table tr:nth-child(${rowIndex + 1}) td:nth-child(${colIndex}) textarea`);
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }
};

const onCellBlur = (rowIndex, header) => {
  const cellId = `${rowIndex}-${header}`;

  // 通知服务器单元格编辑结束
  if (socket.value) {
    socket.value.emit('cell-blur', {
      rowIndex,
      field: header,
      username: authStore.user?.username || 'Anonymous'
    });
  }

  // 重置textarea高度
  if (header !== '__rowNumber') {
    const colIndex = tableHeaders.value.indexOf(header) + 2; // +2 for row number and 1-based index
    const textarea = document.querySelector(`.excel-table tr:nth-child(${rowIndex + 1}) td:nth-child(${colIndex}) textarea`);
    if (textarea) {
      textarea.style.height = '48px';
    }
  }
};

// 新增项目
const addNewItem = () => {
  // 计算当前最大行号
  const maxRowNumber = Math.max(...tableData.value.map(row =>
    parseInt(row.__rowNumber) || 0
  ));

  const newItem = {
    __rowId: Date.now(),
    __rowNumber: String(maxRowNumber + 1)
  };
  tableHeaders.value.forEach(header => {
    newItem[header] = '';
  });
  tableData.value.push(newItem);

  // 通知服务器数据更新
  if (socket.value) {
    socket.value.emit('table-update', {
      rows: tableData.value,
      activeCells: currentUsers.value
    });
  }
};

// 新增列
const addNewColumn = () => {
  // 计算当前最大列号
  const maxColCode = Math.max(...tableHeaders.value.map(header =>
    header.charCodeAt(0)
  ));
  const newHeader = String.fromCharCode(maxColCode + 1);

  tableHeaders.value.push(newHeader);

  // 为所有现有行添加新列
  tableData.value.forEach(row => {
    row[newHeader] = '';
  });

  // 通知服务器数据更新
  if (socket.value) {
    socket.value.emit('table-update', {
      rows: tableData.value,
      activeCells: currentUsers.value
    });
  }
};

// 删除项目
const deleteItem = (index) => {
  tableData.value.splice(index, 1);
  tableData.value = [...tableData.value];
};

// 导出CSV
const exportToCSV = () => {
  const csv = Papa.unparse({
    fields: tableHeaders.value,
    data: tableData.value
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'export.csv';
  link.click();
};
</script>

<style scoped>
.common-form-view {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
}

.common-form-view h2 {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(90deg, #3a7bd5, #00d2ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradient 8s ease infinite;
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.excel-table-container {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid #ddd;
  resize: both;
  min-width: 100%;
  min-height: 70vh;
  max-width: 100%;
  max-height: 100%;
  margin: 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: white;
  padding: 8px;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
}

.excel-table th,
.excel-table td {
  border: 1px solid #ddd;
  padding: 4px 8px;
  text-align: left;
  min-width: 80px;
  height: 32px;
  box-sizing: border-box;
}

.excel-table th {
  background-color: #f2f2f2;
  position: sticky;
  top: 0;
  cursor: pointer;
}

.excel-table th.selected-column {
  background-color: #ffeb3b;
  color: #000;
}

.excel-table th.editing-header {
  padding: 0;
}

.excel-table th .header-input {
  width: 100%;
  height: 100%;
  border: none;
  padding: 8px;
  box-sizing: border-box;
  font-weight: bold;
  text-align: center;
}

.excel-table th .header-input:focus {
  outline: 2px solid #4CAF50;
  background-color: #fffde7;
}

.excel-table input {
  width: 100%;
  border: none;
  padding: 2px 4px;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-height: 24px;
  resize: vertical;
  font-size: 0.9em;
}

.excel-table textarea {
  width: 100%;
  border: none;
  padding: 2px 4px;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-height: 24px;
  resize: none;
  font-family: inherit;
  font-size: 0.9em;
  overflow: hidden;
  transition: height 0.2s;
}

.excel-table input:focus,
.excel-table textarea:focus {
  outline: 2px solid #4CAF50;
  background-color: #fffde7;
  min-height: 32px;
}

.excel-table td.editing {
  background-color: #fffde7;
  position: relative;
}

.excel-table td.editing::after {
  content: attr(data-user);
  position: absolute;
  bottom: -15px;
  right: 0;
  font-size: 10px;
  color: #666;
}

.action-buttons {
  margin: 2rem 0;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-buttons button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  background-color: #3a7bd5;
  color: white;
  border: none;
}

.action-buttons button:hover {
  transform: translateY(-2px);
  background-color: #2c5fb3;
}

.action-buttons button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.delete-btn {
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background-color: #cc0000;
  transform: translateY(-2px);
}

.action-cell {
  min-width: 100px;
  text-align: center;
}
</style>
