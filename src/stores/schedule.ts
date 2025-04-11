import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { emitOperation, type Operation } from '../utils/socket'
import axios from '../utils/api'
import { useAuthStore } from './auth'

export interface Class {
  id: number
  name: string
  creator_id?: number
  create_time?: string
  update_time?: string
}

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
  classId: number
  semester: string
}

export const useScheduleStore = defineStore(
  'schedule',
  () => {
    const timetable = ref<Course[]>([])
    const currentWeek = ref(1)
    const currentClass = ref<Class | null>(null)
    const currentSemester = ref('2024-2025-第一学期')
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
      classId: number
      semester: string
    }

    // 获取课表数据
    async function fetchTimetable(week: number) {
      currentWeek.value = week
      if (!currentClass.value) return

      try {
        const response = await axios.get(`/classes/${currentClass.value.id}/sheet`, {
          params: {
            semester: currentSemester.value,
            week
          }
        })
        timetable.value = response.data.map((course: any) => ({
          ...course,
          classId: currentClass.value?.id || 0,
          semester: currentSemester.value
        }))
      } catch (error) {
        console.error('获取课表失败:', error)
      }
    }

    // 获取班级列表
    async function fetchClasses() {
      try {
        const response = await axios.get('/classes')
        return response.data.list || []
      } catch (error) {
        console.error('获取班级列表失败:', error)
        return []
      }
    }

    // 设置当前班级
    async function setCurrentClass(classInfo: Class) {
      currentClass.value = classInfo
      await fetchTimetable(currentWeek.value)
    }

    // 设置当前学期
    async function setCurrentSemester(semester: string) {
      currentSemester.value = semester
      await fetchTimetable(currentWeek.value)
    }

    // 计算属性：按天分组
    const groupedTimetable = computed(() => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      return days.map((day) => ({
        day,
        courses: timetable.value.filter((c) =>
          c.day === day &&
          c.week === currentWeek.value &&
          c.classId === currentClass.value?.id &&
          c.semester === currentSemester.value
        ),
      }))
    })

    function getCoursesByDay(day: string) {
      return timetable.value.filter((c) =>
        c.day === day &&
        c.week === currentWeek.value &&
        c.classId === currentClass.value?.id &&
        c.semester === currentSemester.value
      )
    }

    async function updateCourse(updatedCourse: Course) {
      return new Promise<void>((resolve, reject) => {
        try {
          const auth = useAuthStore()
          const index = timetable.value.findIndex((c) => c.id === updatedCourse.id)
          const finalCourse = {
            ...updatedCourse,
            classId: currentClass.value?.id || 0,
            semester: currentSemester.value,
            lastUpdatedBy: auth.$state.user?.username || '未知用户',
            week: updatedCourse.week || currentWeek.value
          }

          if (index > -1) {
            timetable.value.splice(index, 1)
            timetable.value.push(finalCourse)
          } else {
            timetable.value.push(finalCourse)
          }

          timetable.value.sort((a, b) => {
            if (a.week !== b.week) return a.week - b.week
            return a.id.localeCompare(b.id)
          })

          checkConflicts(finalCourse)
          emitOperation({
            type: 'update',
            data: finalCourse,
            version: Date.now(),
            timestamp: Date.now(),
            userId: auth.user?.username || 'unknown'
          })
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
          c.classId === course.classId &&
          c.semester === course.semester &&
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
      currentClass,
      currentSemester,
      collaborators,
      groupedTimetable,
      fetchTimetable,
      fetchClasses,
      setCurrentClass,
      setCurrentSemester,
      getCoursesByDay,
      updateCourse,
      removeCourse,
      applyRemoteOperation,
      operationQueue
    }
  },
  {
    persist: true,
  }
)
