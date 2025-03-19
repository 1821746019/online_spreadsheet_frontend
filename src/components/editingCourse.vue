<template>
  <!-- 在原有模板基础上增加编辑层 -->
  <div class="timetable-container">
    <!-- 原有结构保持不变... -->

    <!-- 编辑弹层 -->
    <div v-if="editingCourse" class="edit-overlay" @click.self="cancelEdit">
      <div class="edit-form">
        <h3>编辑课程信息</h3>
        <div class="form-group">
          <label>课程名称：</label>
          <input v-model="editingCourse.course" ref="courseInput">
        </div>
        <div class="form-group">
          <label>教师：</label>
          <input v-model="editingCourse.teacher">
        </div>
        <div class="form-group">
          <label>教室：</label>
          <input v-model="editingCourse.room">
        </div>
        <div class="form-actions">
          <button @click="saveEdit">保存</button>
          <button @click="cancelEdit">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import store from '@/stores/schedule'
// 原有数据...
const editingCourse = ref(null) // 当前编辑的课程
const originalCourse = ref(null) // 编辑前的副本

// 双击事件处理
const handleDblClick = (course, event) => {
  if (event.target.classList.contains('course-block')) {
    // 创建副本防止直接修改原数据
    originalCourse.value = JSON.parse(JSON.stringify(course))
    editingCourse.value = course
  }
}

// 保存修改
const saveEdit = async () => {
  try {
    // 调用API保存修改
    await store.updateCourse(editingCourse.value)
    // 更新冲突检测
    store.checkConflicts()
    editingCourse.value = null
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 取消编辑
const cancelEdit = () => {
  // 恢复原始数据
  Object.assign(editingCourse.value, originalCourse.value)
  editingCourse.value = null
}

// 在原有课程区块添加双击事件
</script>

<style>
/* 编辑层样式 */
.edit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.edit-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  min-width: 400px;
}

.form-group {
  margin: 15px 0;
}

.form-group label {
  display: inline-block;
  width: 80px;
}

.form-actions {
  text-align: right;
  margin-top: 20px;
}

.form-actions button {
  margin-left: 10px;
  padding: 8px 15px;
}
</style>
