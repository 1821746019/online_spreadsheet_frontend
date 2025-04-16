import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { emitOperation, type Operation } from '../utils/socket'
import axios, { fetchCellData,fetchDragItem } from '../utils/api'
import { useAuthStore } from './auth'
import { Item } from 'ant-design-vue/es/menu'

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
  week_type: 'single' | 'double' | 'douyou'
  classId: number
  // semester: string
}
export interface Sheet {
  class_id?: number;
  col?: number;
  create_time?: Date;
  creator_id?: number;
  id?: number;
  name?: string;
  row?: number;
  update_time?: Date;
  week?: number;
  [property: string]: any;
}
export const useScheduleStore = defineStore(
  'schedule',
  () => {
    const timetable = ref<Course[]>([])
    const currentWeek = ref(1)
    const currentClass = ref<Class | null>(null)
    const currentSheet= ref<Sheet | null>(null)
    // const currentSemester = ref('2024-2025-第一学期')
    const collaborators = ref([])
    const auth = useAuthStore()
    // 获取课表数据
    async function fetchTimetable(week: number) {
      currentWeek.value = week
      if (!currentClass.value) return

      try {
        const cellresponse = fetchCellData(currentClass.value.id, currentSheet.value?.id || 0)
        const cellData = (await cellresponse).data.cells
        console.log('获取课表:', (cellData))
        const dragItemResponse = (cellData.map(Item => Item.item_id)).map((itemId: number) => fetchDragItem(itemId))
        // console.log('获取拖动元素响应:', Promise.all(dragItemResponse))
        const dragItemData = (await Promise.all(dragItemResponse)).map((response: any) => response.data)
        console.log('获取拖动元素:', dragItemData)

        // timetable.value = response.data.map((course: any) => ({
        //   ...course,
        //   classId: currentClass.value?.id || 0,
        //   // semester: currentSemester.value
        // }))
      } catch (error) {
        console.error('获取课表失败:', error)
      }
    }

    // 获取班级列表


    // 设置当前班级
    async function setCurrentClass(classInfo: Class) {
      currentClass.value = classInfo
      //await fetchTimetable(currentWeek.value)
    }
    //设置当前工作表
    async function setCurrentSheet(sheetInfo: Sheet) {
      currentSheet.value = sheetInfo
      console.log('当前工作表:', currentSheet.value)

    }
    // 设置当前学期
    // async function setCurrentSemester(semester: string) {
    //   currentSemester.value = semester
    //   await fetchTimetable(currentWeek.value)
    // }

    // 计算属性：按天分组
    const groupedTimetable = computed(() => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      return days.map((day) => ({
        day,
        courses: timetable.value.filter((c) =>
          c.day === day &&
          (c.week_type === 'douyou' ||
           (c.week_type === 'single' && currentWeek.value % 2 === 1) ||
           (c.week_type === 'double' && currentWeek.value % 2 === 0)) &&
          c.classId === currentClass.value?.id
          // &&
          // c.semester === currentSemester.value
        ),
      }))
    })

    function getCoursesByDay(day: string) {
      return timetable.value.filter((c) =>
        c.day === day &&
        (c.week_type === 'douyou' ||
         (c.week_type === 'single' && currentWeek.value % 2 === 1) ||
         (c.week_type === 'double' && currentWeek.value % 2 === 0)) &&
        c.classId === currentClass.value?.id
        // &&
        // c.semester === currentSemester.value
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
            // semester: currentSemester.value,
            lastUpdatedBy: auth.$state.user?.username || '未知用户',
            week_type: updatedCourse.week_type || 'douyou'
          }

          if (index > -1) {
            timetable.value.splice(index, 1)
            timetable.value.push(finalCourse)
          } else {
            timetable.value.push(finalCourse)
          }

          timetable.value.sort((a, b) => a.id.localeCompare(b.id))

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
          c.week_type === course.week_type &&
          c.classId === course.classId &&
          // c.semester === course.semester &&
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
      currentSheet,
      // currentSemester,
      collaborators,
      groupedTimetable,
      fetchTimetable,
      setCurrentClass,
      setCurrentSheet,
      // setCurrentSemester,
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
