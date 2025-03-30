import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { emitOperation, type Operation } from '../utils/socket'
import axios from '../utils/api'
import { useAuthStore } from './auth'

export interface Course {
  id: string
  day: string
  start: string
  end: string
  course: string
  teacher: string
  room: string
  lastUpdatedBy: any
  hasConflict?: boolean
  week: number
}

export const useScheduleStore = defineStore(
  'schedule',
  () => {
    const timetable = ref<Course[]>([])
    const currentWeek = ref(1)
    const collaborators = ref([])
    const auth = useAuthStore()

    interface Course {
      id: string
      day: string
      start: string
      end: string
      course: string
      teacher: string
      room: string
      lastUpdatedBy: any
      hasConflict?: boolean
      week: number
    }

    // 初始化空课表
    async function fetchTimetable(week: number) {
      currentWeek.value = week
      // 保留所有周次数据，仅切换当前显示的周次
    }

    // 计算属性：按天分组
    const groupedTimetable = computed(() => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      return days.map((day) => ({
        day,
        courses: timetable.value.filter((c) => c.day === day && c.week === currentWeek.value),
      }))
    })

    function getCoursesByDay(day: string) {
      return timetable.value.filter((c) => c.day === day && c.week === currentWeek.value)
    }

    async function updateCourse(updatedCourse: Course) {
      return new Promise<void>((resolve, reject) => {
        try {
          const auth = useAuthStore()
          const index = timetable.value.findIndex((c) => c.id === updatedCourse.id)
          if (index > -1) {
            // 先移除旧记录
            timetable.value.splice(index, 1)
            // 添加更新后的记录，确保按周次排序
            timetable.value.push({
              ...updatedCourse,
              lastUpdatedBy: auth.$state.user?.username || '未知用户',
              week: updatedCourse.week || currentWeek.value,
            })
            // 按周次和ID重新排序
            timetable.value.sort((a, b) => {
              if (a.week !== b.week) return a.week - b.week
              return a.id.localeCompare(b.id)
            })
            checkConflicts(updatedCourse)
            emitOperation({
              type: 'update',
              data: updatedCourse,
              version: Date.now(),
              timestamp: Date.now(),
              userId: auth.user?.username || 'unknown'
            })
          } else {
            // 如果是新课程，添加到timetable
            timetable.value.push({
              ...updatedCourse,
              lastUpdatedBy: auth.$state.user?.username || '未知用户',
              week: updatedCourse.week || currentWeek.value,
            })
            checkConflicts(updatedCourse)
            emitOperation({
              type: 'insert',
              data: updatedCourse,
              version: Date.now(),
              timestamp: Date.now(),
              userId: auth.user?.username || 'unknown'
            })
          }
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    }

    function checkConflicts(course: Course) {
      timetable.value.forEach((c) => {
        c.hasConflict =
          c.day === course.day &&
          c.start === course.start &&
          c.week === course.week &&
          c.id !== course.id &&
          (c.teacher === course.teacher || c.room === course.room)
      })
    }

    const operationQueue = ref<Operation[]>([])

    function applyRemoteOperation(op: Operation) {
      console.log('Applying remote operation:', op)
      try {
        switch(op.type) {
          case 'insert':
            if (!timetable.value.some(c => c.id === op.data.id)) {
              timetable.value.push(op.data)
              checkConflicts(op.data)
            }
            break
          case 'update':
            const index = timetable.value.findIndex(c => c.id === op.data.id)
            if (index > -1) {
              timetable.value[index] = op.data
              checkConflicts(op.data)
            }
            break
          case 'delete':
            const delIndex = timetable.value.findIndex(c => c.id === op.data.id)
            if (delIndex > -1) {
              timetable.value.splice(delIndex, 1)
            }
            break
        }
      } catch (e) {
        console.error('Failed to apply operation:', op, e)
        // 将失败的操作重新放入队列
        operationQueue.value.push(op)
        setTimeout(() => {
          if (operationQueue.value.length > 0) {
            const nextOp = operationQueue.value.shift()
            if (nextOp) {
              applyRemoteOperation(nextOp)
            }
          }
        }, 1000)
      }
    }

    function removeCourse(courseId: string) {
      const auth = useAuthStore()
      const index = timetable.value.findIndex((c) => c.id === courseId)
      if (index > -1) {
        const removed = timetable.value.splice(index, 1)
        emitOperation({
          type: 'delete',
          data: {
            ...removed[0],
            _deleted: true,
            lastUpdatedBy: auth.$state.user?.username || '未知用户'
          },
          version: Date.now(),
          timestamp: Date.now(),
              userId: auth.user?.username || 'unknown'
        })
      }
    }

    return {
      timetable,
      currentWeek,
      collaborators,
      groupedTimetable,
      fetchTimetable,
      getCoursesByDay,
      updateCourse,
      removeCourse,
      applyRemoteOperation,
      operationQueue
    }
  },
  {
    persist: true,
  },
)
