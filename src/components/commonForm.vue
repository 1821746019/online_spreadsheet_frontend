<template>
  <el-table :data="tableData" class="form">
    <el-table-column fixed prop="id" label="ID" width="120" />
    <el-table-column prop="week" label="周次" width="80" />
    <el-table-column prop="day" label="星期" width="100" />
    <el-table-column prop="start" label="开始时间" width="120"/>
    <el-table-column prop="end" label="结束时间" width="120"/>
    <el-table-column prop="course" label="课程名称" width="180"/>
    <el-table-column prop="teacher" label="教师" width="150"/>
    <el-table-column prop="room" label="教室" width="150"/>
    <el-table-column prop="lastUpdatedBy" label="最后更新人" width="150"/>
    <el-table-column fixed="right" label="Operations" min-width="120">
      <template #default="scope">
        <el-button link type="primary" size="small" @click="handleEdit(scope.row)">
          编辑
        </el-button>
        <el-button link type="danger" size="small" @click="handleDelete(scope.row.id)">
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import { useScheduleStore } from '../stores/schedule';

const store=useScheduleStore()
const tableData =store.timetable
const handleEdit = (row) => {
  // 这里可以打开编辑对话框或直接编辑行数据
  console.log('Editing:', row)
}

const handleDelete = (id) => {
  store.removeCourse(id)
  console.log('Deleted course:', id)
}
</script>
<style scoped>
.form{
  max-width: 1800px;
}
</style>
