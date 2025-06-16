<template>
  <div>
    <el-select v-model="currentWeek" placeholder="请选择周数">
      <el-option
        v-for="week in 20"
        :key="week"
        :label="`第 ${week} 周`"
        :value="week"
      />
    </el-select>

    <TeacherSchedule :week="currentWeek" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TeacherSchedule from '../components/TeacherSchedule.vue'

const currentWeek = ref(1)
</script>
