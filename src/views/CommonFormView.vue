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
    <div class="action-buttons">
      <button @click="undo" :disabled="historyIndex < 0">撤销</button>
      <button @click="redo" :disabled="historyIndex >= editHistory.length - 1">恢复</button>
    </div>

    <!-- 表格 -->
    <div class="excel-table-container">
      <table class="excel-table">
        <thead>
          <tr>
            <th @dblclick="startEditRowHeader"
                :class="{ 'editing-header': editingRowHeader }"
                @mousedown.prevent="startRowResize($event, -1)"
                :style="{ height: rowHeights[-1] ? rowHeights[-1] + 'px' : null }">
              <template v-if="editingRowHeader">
                <input v-model="newRowHeaderName"
                       @blur="saveRowHeader"
                       @keyup.enter="saveRowHeader"
                       @keyup.escape="editingRowHeader = false"
                       class="header-input"
                       autofocus />
              </template>
              <template v-else>
                {{ newRowHeaderName }}
              </template>
            </th>
            <th v-for="(header, index) in tableHeaders"
                :key="index"
                @click="selectedColumn = header"
                @dblclick="editColumnHeader(index)"
                @mousedown.prevent="startColumnResize($event, header)"
                :class="{ 'selected-column': selectedColumn === header, 'editing-header': editingHeader === index }"
                :style="{ width: columnWidths[header] ? columnWidths[header] + 'px' : null }">
              <template v-if="editingHeader === index">
                <input v-model="newHeaderName"
                       @blur="saveColumnHeader(index)"
                       @keyup.enter="saveColumnHeader(index)"
                       @keyup.escape="editingHeader = null"
                       class="header-input"
                       autofocus />
              </template>
              <template v-else>
                {{ header }}
              </template>
            </th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in tableData" :key="rowIndex"
              :style="{ height: rowHeights[rowIndex] ? rowHeights[rowIndex] + 'px' : null }">
            <td @mousedown.prevent="startRowResize($event, rowIndex)">
              <input type="text"
                     v-model="row.__rowNumber"
                     @focus="onCellFocus(rowIndex, '__rowNumber')"
                     @blur="onCellBlur(rowIndex, '__rowNumber')"
                     @copy="handleCopy($event, rowIndex, '__rowNumber')"
                     @paste="handlePaste($event, rowIndex, '__rowNumber')">
            </td>
            <td v-for="(header, colIndex) in tableHeaders"
                :key="colIndex"
                :style="{ width: columnWidths[header] ? columnWidths[header] + 'px' : null }">
              <textarea v-model="row[header]"
                        @focus="onCellFocus(rowIndex, header)"
                        @blur="onCellBlur(rowIndex, header)"
                        @keydown.enter.prevent="row[header] += '\n'"
                        @copy="handleCopy($event, rowIndex, header)"
                        @paste="handlePaste($event, rowIndex, header)"
                        @keydown.ctrl.c="handleCopy($event, rowIndex, header)"
                        @keydown.ctrl.v="handlePaste($event, rowIndex, header)">
              </textarea>
            </td>
            <td class="action-cell">
              <button @click="deleteItem(rowIndex)" class="delete-btn">删除行</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import ReadCSV from '@/components/ReadCSV.vue'
import Papa from 'papaparse'
import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'

const tableHeaders = ref(Array.from({ length: 10 }, (_, i) => String.fromCharCode(65 + i)))
const selectedColumn = ref(null)
const editingHeader = ref(null)
const newHeaderName = ref('')

// 初始列宽和行高
const columnWidths = ref({})
const rowHeights = ref({})

// 拖拽调整状态
const isResizing = ref(false)
const currentResizeTarget = ref(null)
const startX = ref(0)
const startY = ref(0)
const startWidth = ref(0)
const startHeight = ref(0)

// 复制粘贴处理
const clipboard = ref('')

const handleCopy = (event, rowIndex, header) => {
  const value = tableData.value[rowIndex][header]
  clipboard.value = value
  if (event.type !== 'keydown') {
    event.clipboardData.setData('text/plain', value)
    event.preventDefault()
  }
}

const handlePaste = async (event, rowIndex, header) => {
  let pastedText = ''

  if (event.type === 'keydown') {
    try {
      pastedText = await navigator.clipboard.readText()
    } catch (err) {
      pastedText = clipboard.value
    }
  } else {
    pastedText = event.clipboardData.getData('text/plain')
    event.preventDefault()
  }

  tableData.value[rowIndex][header] = pastedText
  recordChange(`粘贴内容到单元格 ${header}[${rowIndex}]`)
}

// 列宽调整处理
const startColumnResize = (e, header) => {
  isResizing.value = true
  currentResizeTarget.value = header
  startX.value = e.pageX

  const headerCell = e.target.closest('th')
  startWidth.value = headerCell.offsetWidth

  document.addEventListener('mousemove', handleColumnResize)
  document.addEventListener('mouseup', stopResize)

  e.preventDefault()
}

const handleColumnResize = (e) => {
  if (!isResizing.value || !currentResizeTarget.value) return

  const delta = e.pageX - startX.value
  const newWidth = Math.max(80, startWidth.value + delta)

  columnWidths.value[currentResizeTarget.value] = newWidth
}

// 行高调整处理
const startRowResize = (e, rowIndex) => {
  isResizing.value = true
  currentResizeTarget.value = rowIndex
  startY.value = e.pageY

  const row = e.target.closest('tr')
  startHeight.value = row.offsetHeight

  document.addEventListener('mousemove', handleRowResize)
  document.addEventListener('mouseup', stopResize)

  e.preventDefault()
}

const handleRowResize = (e) => {
  if (!isResizing.value || currentResizeTarget.value === null) return

  const delta = e.pageY - startY.value
  const newHeight = Math.max(32, startHeight.value + delta)

  rowHeights.value[currentResizeTarget.value] = newHeight
}

// 停止拖拽调整
const stopResize = () => {
  isResizing.value = false
  currentResizeTarget.value = null

  document.removeEventListener('mousemove', handleColumnResize)
  document.removeEventListener('mousemove', handleRowResize)
  document.removeEventListener('mouseup', stopResize)

  recordChange('调整表格尺寸')
}

// 在组件卸载前清理事件监听器
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleColumnResize)
  document.removeEventListener('mousemove', handleRowResize)
  document.removeEventListener('mouseup', stopResize)
})

const editingRowHeader = ref(false)
const newRowHeaderName = ref('行号')

const startEditRowHeader = () => {
  editingRowHeader.value = true
}

const saveRowHeader = () => {
  if (newRowHeaderName.value.trim()) {
    editingRowHeader.value = false
  }
}

const showEditDialog = ref(false)
const isEditing = ref(false)
const currentItem = ref({})

const tableData = ref(Array.from({ length: 5 }, (_, i) => {
  const row = { __rowNumber: String(i + 1) }
  tableHeaders.value.forEach(header => {
    row[header] = ''
  })
  return row
}))

// 编辑历史记录
const editHistory = ref([])
const historyIndex = ref(-1)
const csvImporter = ref(null)
const socket = ref(null)
const authStore = useAuthStore()
const currentUsers = ref({})

const handleCSVData = (data, headers) => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const filteredHeaders = headers ?
      headers.filter(h => !h.startsWith('__')) :
      Array.from({ length: Math.max(...data.map(row => Object.keys(row).length)) }, (_, i) => String.fromCharCode(65 + i))

    tableHeaders.value = filteredHeaders

    tableData.value = data.map(row => {
      const newRow = {}
      if (row.__rowId) newRow.__rowId = row.__rowId
      if (row.__rowNumber) newRow.__rowNumber = row.__rowNumber

      filteredHeaders.forEach(header => {
        newRow[header] = row[header] || ''
      })
      return newRow
    })

    const allHeaders = new Set(tableHeaders.value)
    tableData.value.forEach(row => {
      Object.keys(row).forEach(key => {
        if (!key.startsWith('__') && !allHeaders.has(key)) {
          allHeaders.add(key)
        }
      })
    })

    tableHeaders.value = Array.from(allHeaders)

    tableData.value = tableData.value.map(row => {
      const completeRow = { ...row }
      tableHeaders.value.forEach(header => {
        if (!(header in completeRow)) {
          completeRow[header] = ''
        }
      })
      return completeRow
    })

    if (socket.value) {
      socket.value.emit('table-update', {
        rows: tableData.value,
        activeCells: currentUsers.value
      })
    }
  } catch (error) {
    errorMessage.value = `导入失败: ${error.message}`
  } finally {
    isLoading.value = false
  }
}

const onCellFocus = (rowIndex, header) => {
  const cellId = `${rowIndex}-${header}`

  if (!socket.value) {
    socket.value = io('http://10.161.229.242:5173')
    socket.value.on('table-update', (data) => {
      tableData.value = data.rows
      currentUsers.value = data.activeCells
    })

    socket.value.emit('user-joined', {
      username: authStore.user?.username || 'Anonymous'
    })
  }

  socket.value.emit('cell-focus', {
    rowIndex,
    field: header,
    username: authStore.user?.username || 'Anonymous'
  })

  if (header !== '__rowNumber') {
    const colIndex = tableHeaders.value.indexOf(header) + 2
    const textarea = document.querySelector(`.excel-table tr:nth-child(${rowIndex + 1}) td:nth-child(${colIndex}) textarea`)
    if (textarea) {
      // 保持默认高度不变
      textarea.style.height = 'auto'
    }
  }
}

const onCellBlur = (rowIndex, header) => {
  const cellId = `${rowIndex}-${header}`
  const row = tableData.value[rowIndex]
  const oldValue = row[header]

  if (socket.value) {
    socket.value.emit('cell-blur', {
      rowIndex,
      field: header,
      username: authStore.user?.username || 'Anonymous'
    })
  }

  const snapshot = {
    timestamp: new Date(),
    description: `修改单元格 ${header}[${rowIndex}]`,
    data: JSON.parse(JSON.stringify(tableData.value)),
    headers: [...tableHeaders.value]
  }

  if (historyIndex.value < editHistory.value.length - 1) {
    editHistory.value = editHistory.value.slice(0, historyIndex.value + 1)
  }
  editHistory.value.push(snapshot)
  historyIndex.value = editHistory.value.length - 1

  // 在 blur 时恢复默认高度
  if (header !== '__rowNumber') {
    const colIndex = tableHeaders.value.indexOf(header) + 2
    const textarea = document.querySelector(`.excel-table tr:nth-child(${rowIndex + 1}) td:nth-child(${colIndex}) textarea`)
    if (textarea) {
      textarea.style.height = 'auto'
    }
  }
}

const recordChange = (description) => {
  if (historyIndex.value < editHistory.value.length - 1) {
    editHistory.value = editHistory.value.slice(0, historyIndex.value + 1)
  }

  const snapshot = {
    timestamp: new Date(),
    description,
    data: JSON.parse(JSON.stringify(tableData.value)),
    headers: [...tableHeaders.value]
  }

  editHistory.value.push(snapshot)
  historyIndex.value = editHistory.value.length - 1
}

const undo = () => {
  if (historyIndex.value > 0) {
    historyIndex.value--
    applyHistorySnapshot()
  }
}

const redo = () => {
  if (historyIndex.value < editHistory.value.length - 1) {
    historyIndex.value++
    applyHistorySnapshot()
  }
}

const applyHistorySnapshot = () => {
  if (historyIndex.value < 0 || historyIndex.value >= editHistory.value.length) {
    return
  }

  const snapshot = editHistory.value[historyIndex.value]
  tableData.value = JSON.parse(JSON.stringify(snapshot.data))
  tableHeaders.value = [...snapshot.headers]

  if (socket.value) {
    socket.value.emit('table-update', {
      rows: tableData.value,
      activeCells: currentUsers.value
    })
  }
}

const addNewItem = () => {
  const maxRowNumber = Math.max(...tableData.value.map(row =>
    parseInt(row.__rowNumber) || 0
  ))

  const newItem = {
    __rowId: Date.now(),
    __rowNumber: String(maxRowNumber + 1)
  }
  tableHeaders.value.forEach(header => {
    newItem[header] = ''
  })
  tableData.value.push(newItem)
  recordChange(`新增行 ${newItem.__rowNumber}`)

  if (socket.value) {
    socket.value.emit('table-update', {
      rows: tableData.value,
      activeCells: currentUsers.value
    })
  }
}

const addNewColumn = () => {
  const maxColCode = Math.max(...tableHeaders.value.map(header =>
    header.charCodeAt(0)
  ))
  const newHeader = String.fromCharCode(maxColCode + 1)

  tableHeaders.value.push(newHeader)
  tableData.value.forEach(row => {
    row[newHeader] = ''
  })
  recordChange(`新增列 ${newHeader}`)

  if (socket.value) {
    socket.value.emit('table-update', {
      rows: tableData.value,
      activeCells: currentUsers.value
    })
  }
}

const deleteItem = (index) => {
  const deletedRow = tableData.value[index]
  tableData.value.splice(index, 1)
  recordChange(`删除行 ${deletedRow.__rowNumber}`)

  if (socket.value) {
    socket.value.emit('table-update', {
      rows: tableData.value,
      activeCells: currentUsers.value
    })
  }
}

const deleteSelectedColumn = () => {
  if (!selectedColumn.value) return

  const index = tableHeaders.value.indexOf(selectedColumn.value)
  if (index !== -1) {
    const columnName = selectedColumn.value
    tableHeaders.value.splice(index, 1)
    tableData.value.forEach(row => {
      delete row[selectedColumn.value]
    })
    selectedColumn.value = null
    recordChange(`删除列 ${columnName}`)

    if (socket.value) {
      socket.value.emit('table-update', {
        rows: tableData.value,
        activeCells: currentUsers.value
      })
    }
  }
}

const exportToCSV = () => {
  const exportData = tableData.value.map(row => {
    const exportedRow = {}
    tableHeaders.value.forEach(header => {
      exportedRow[header] = row[header] || ''
    })
    return exportedRow
  })

  const csv = Papa.unparse({
    fields: tableHeaders.value,
    data: exportData
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `export_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}
</script>

<style scoped>
.common-form-view {
  min-height: 100vh;
  padding: 2rem;
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
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
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
  padding: 0;
  text-align: left;
  min-width: 80px;
  min-height: 32px;
  box-sizing: border-box;
  position: relative;
}

/* 列宽调整手柄 */
.excel-table th::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
}

.excel-table th:hover::after {
  background: #1890ff;
}

/* 行高调整手柄 */
.excel-table tr td:first-child::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: transparent;
  cursor: row-resize;
}

.excel-table tr td:first-child:hover::after {
  background: #1890ff;
}

.excel-table td {
  position: relative;
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

.excel-table input,
.excel-table textarea {
  width: 100%;
  border: none;
  padding: 4px 8px;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-family: inherit;
  font-size: 0.9em;
  background: transparent;
  resize: none;
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
}

.excel-table textarea {
  line-height: 1.5;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.excel-table textarea::-webkit-scrollbar {
  width: 4px;
}

.excel-table textarea::-webkit-scrollbar-track {
  background: transparent;
}

.excel-table textarea::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.excel-table input:focus,
.excel-table textarea:focus {
  outline: 2px solid #4CAF50;
  background-color: #fffde7;
  position: relative;
  z-index: 1;
}

.excel-table td.editing {
  background-color: #fffde7;
  position: relative;
  box-shadow: 0 0 0 2px #3a7bd5;
}

.excel-table td.editing::after {
  content: attr(data-user);
  position: absolute;
  bottom: -15px;
  right: 0;
  font-size: 10px;
  color: white;
  background-color: #3a7bd5;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: bold;
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
