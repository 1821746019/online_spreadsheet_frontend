<template>
  <div class="schedule-container">
    <el-table
      :data="tableData"
      style="width: 100%"
      v-loading="loading"
    >
      <!-- 时间列 -->
      <el-table-column prop="time" label="时间" width="120" fixed />

      <!-- 周一到周日列 -->
      <el-table-column
        v-for="day in weekDays"
        :key="day.value"
        :label="day.label"
        :prop="day.value"
        width="200"
      >
        <template #default="{ row, column }">
          <div v-if="row[column.property]" class="course-cell">
            <div class="course-content">{{ row[column.property].content }}</div>
            <div class="course-content">{{ row[column.property].className }}</div>
            <div class="course-info">
              <span>{{ row[column.property].teacher }}</span>
              <span>{{ row[column.property].classroom }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { getWeekcourse } from '../utils/api'

export default {
  name: 'TeacherSchedule',
  props: {
    week: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const loading = ref(false)
    const tableData = ref([])

    // 时间段定义
    const timeSlots = [
      '08:30-09:55',
      '10:15-11:40',
      '11:45-12:25',
      '14:00-15:25',
      '15:45-17:10',
      '17:15-17:55',
      '19:00-20:20',
      '20:30-21:50'
    ]

    // 周一到周日定义
    const weekDays = [
      { label: '周一', value: 'monday', col: 1 },
      { label: '周二', value: 'tuesday', col: 2 },
      { label: '周三', value: 'wednesday', col: 3 },
      { label: '周四', value: 'thursday', col: 4 },
      { label: '周五', value: 'friday', col: 5 },
      { label: '周六', value: 'saturday', col: 6 },
      { label: '周日', value: 'sunday', col: 7 }
    ]

    // 初始化表格数据
    const initTableData = () => {
      return timeSlots.map((time, rowIndex) => {
        const row = { time, row: rowIndex + 1 } // 添加row属性表示行号
        weekDays.forEach(day => {
          row[day.value] = null // 初始化为null，表示没有课程
        })
        return row
      })
    }

    // 获取表格数据
    const fetchScheduleData = async () => {
      try {
        loading.value = true
        // 调用后端API，传入week参数
        const response = await getWeekcourse( {
            week: props.week
        })

        // 处理返回的数据
        const data = response.data.cells
        const newTableData = initTableData()

        // 填充课程数据
        data.forEach(course => {
          // 找到对应的行和列
          const rowIndex = course.row - 1 // 转换为0-based索引
          const day = weekDays.find(d => d.col === course.col)

          if (rowIndex >= 0 && rowIndex < newTableData.length && day) {
            newTableData[rowIndex][day.value] = {
              content: course.content,
              teacher: course.teacher,
              classroom: course.classroom,
              className: course.className
            }
          }
        })

        tableData.value = newTableData
      } catch (error) {
        console.error('获取课表数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 监听week变化
    onMounted(fetchScheduleData)
    watch(() => props.week, fetchScheduleData)

    return {
      loading,
      tableData,
      weekDays
    }
  }
}
</script>

<style scoped>
.schedule-container {
  margin: 20px;
}

.course-cell {
  padding: 8px;
  min-height: 60px;
}

.course-content {
  font-weight: bold;
  margin-bottom: 4px;
  font-size: 18px;
}

.course-info {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  color: #666;
}
</style>
