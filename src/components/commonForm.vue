<template>
  <el-table :data="tableData" class="form">
    <el-table-column fixed prop="id" label="id" width="180" />
    <el-table-column prop="day" label="day" width="180" />
    <el-table-column prop="start" label="start" width="180"/>
    <el-table-column prop="end" label="end" width="180"/>
    <el-table-column prop="course" label="course" width="180"/>
    <el-table-column prop="teacher" label="teacher" width="180"/>
    <el-table-column prop="room" label="room" width="180"/>
    <el-table-column fixed="right" label="Operations" min-width="120">
      <template #default>
        <el-button link type="primary" size="small" @click="handleClick()">
          Detail
        </el-button>
        <el-button link type="primary" size="small">Edit</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import { useScheduleStore } from '../stores/schedule';

const store=useScheduleStore()
const tableData =store.timetable
const handleClick = () => {
  console.log('click')
}
</script>
<style scoped>
.form{
  max-width: 1800px;
}
</style>
