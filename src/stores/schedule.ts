import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { emitOperation, type Operation } from '../utils/socket'
import { ElMessage } from 'element-plus';
import axios, {
  fetchCellData,
  fetchDragItem,
  deleteDragItem,
  updateDragItem,
  moveDragItem,
  updateCellData,
} from '../utils/api'
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
  id: number
  row_index: number
  col_index: number
  course: string
  teacher: string
  room: string
  lastUpdatedBy?: any
  hasConflict?: boolean
  week_type: 'single' | 'double' | 'all'
  classId: number
}

export interface Sheet {
  class_id?: number
  col?: number
  create_time?: Date
  creator_id?: number
  id?: number
  name?: string
  row?: number
  update_time?: Date
  week?: number
  [property: string]: any
}

function getDayFromColIndex(colIndex: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return days[colIndex - 1] || 'Monday'
}

function getTimeFromRowIndex(rowIndex: number): { start: string; end: string } {
  const times = [
    '08:30-09:55',
    '10:15-11:40',
    '11:45-12:25',
    '14:00-15:25',
    '15:45-17:10',
    '17:15-17:55',
    '19:00-20:20',
    '20:30-21:50',
  ]
  const [start, end] = times[rowIndex - 1]?.split('-') || ['08:30', '09:55']
  return { start, end }
}

export const useScheduleStore = defineStore(
  'schedule',
  () => {
    const timetable = ref<Course[]>([])
    const courseMap = ref(new Map<string, Course>()) // 新增 Map 存储课程
    const currentWeek = ref(1)
    const totalweek=ref(20)
    const currentClass = ref<Class | null>(null)
    const currentSheet = ref<Sheet | null>(null)
    const collaborators = ref([])
    const auth = useAuthStore()

    async function fetchTimetable(week: number) {
      currentWeek.value = week
      if (!currentClass.value) return

      try {
        const cellresponse = fetchCellData(currentClass.value.id, currentSheet.value?.id || 0)
        console.log('cell',(await cellresponse).data)
        const cellData = (await cellresponse).data.filter((item) => item.item_id !== null)
        const dragItemResponse = await Promise.all(
          cellData.map((Item) => fetchDragItem(Item.item_id)),
        )
        const dragItemData = dragItemResponse.map((response) => response.data)

        const newCourses = cellData.map((cell, index) => convertToCourse(cell, dragItemData[index]))

        // 更新 Map 和数组
        courseMap.value.clear()
        newCourses.forEach((course) => {
          courseMap.value.set(course.id, course)
        })
        timetable.value = newCourses
      } catch (error) {
        timetable.value = []
        courseMap.value.clear()
        console.error('获取课表失败:', error)
      }
    }
    const convertToCourse = (cell: any, item: any): Course => {
      return {
        id: item.id.toString(),
        row_index: cell.row_index,
        col_index: cell.col_index,
        course: item.content,
        teacher: item.teacher,
        room: item.classroom,
        week_type: item.week_type || 'single', // 默认 single
        classId: currentClass.value?.id || 0, // 这里使用 item.id 作为 classId，如果不正确请调整
        // lastUpdatedBy 和 hasConflict 是可选的，可以不赋值
        hasConflict: false,
      }
    }
    async function setCurrentClass(classInfo: Class) {
      currentClass.value = classInfo
    }

    async function setCurrentSheet(sheetInfo: Sheet) {
      currentSheet.value = sheetInfo
      console.log('当前工作表:', currentSheet.value)
    }

    const groupedTimetable = computed(() => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      return days.map((day) => ({
        day,
        courses: timetable.value.filter(
          (c) =>
            getDayFromColIndex(c.col_index) === day &&
            (c.week_type === 'all' ||
              (c.week_type === 'single' && currentWeek.value % 2 === 1) ||
              (c.week_type === 'double' && currentWeek.value % 2 === 0)) &&
            c.classId === currentClass.value?.id,
        ),
      }))
    })

    function getCoursesByDay(day: string) {
      return timetable.value.filter(
        (c) =>
          getDayFromColIndex(c.col_index) === day &&
          (c.week_type === 'all' ||
            (c.week_type === 'single' && currentWeek.value % 2 === 1) ||
            (c.week_type === 'double' && currentWeek.value % 2 === 0)) &&
          c.classId === currentClass.value?.id,
      )
    }
    const convertTodragItem = (course: Course): any => {
      return {
        id: course.id,
        classroom: course.room,
        content: course.course,
        teacher: course.teacher,
        selected_class_ids: [course.classId],
        week_type: course.week_type,
        row_index: course.row_index,
        col_index: course.col_index,
      }
    }
    async function updateCourse(updatedCourse: Course) {
      const operationId = `update-${Date.now()}`
      pendingOperations.value.add(operationId)

      try {
        const auth = useAuthStore()
        const finalCourse = {
          ...updatedCourse,
          classId: currentClass.value?.id || 0,
          lastUpdatedBy: auth.$state.user?.username || '未知用户',
          week_type: updatedCourse.week_type || 'all',
        }

        // 使用 Map 快速更新
        courseMap.value.set(finalCourse.id.toString(), finalCourse)
        timetable.value = Array.from(courseMap.value.values())
        console.log('finalcourse',finalCourse)
        // 延迟冲突检查
        setTimeout(() => checkConflicts(finalCourse), 100)
        // 合并 API 调用并等待完成
        await Promise.all(
          [
          updateDragItem(finalCourse.id, {
            class_room: finalCourse.room,
            content: finalCourse.course,
            teacher: finalCourse.teacher,
            selected_class_ids: [currentClass.value?.id || 0],
            week_type: finalCourse.week_type,
          }),
          moveDragItem(finalCourse.id, currentClass.value?.id || 0, currentSheet.value?.id || 0, {
            target_col: finalCourse.col_index,
            target_row: finalCourse.row_index,
          }),

        ]
      )
    ElMessage.success('目标拖动成功');
      } catch (error) {
        console.error('更新课程失败:', error)
        throw error
      } finally {
        pendingOperations.value.delete(operationId)
      }
    }

    function checkConflicts(course: Course) {
      const { start, end } = getTimeFromRowIndex(course.row_index)
      const day = getDayFromColIndex(course.col_index)
      let hasConflict = false

      // 使用 Map 快速遍历
      for (const [id, c] of courseMap.value.entries()) {
        if (id === course.id.toString()) continue

        const cTime = getTimeFromRowIndex(c.row_index)
        const cDay = getDayFromColIndex(c.col_index)

        const isSameDayAndTime = cDay === day && cTime.start === start && cTime.end === end
        const isSameWeekType =
          c.week_type === course.week_type || course.week_type === 'all' || c.week_type === 'all'
        const isSameClass = c.classId === course.classId

        if (isSameDayAndTime && isSameWeekType && isSameClass) {
          c.hasConflict = true
          hasConflict = true
        } else {
          c.hasConflict = false
        }
      }

      course.hasConflict = hasConflict
      return hasConflict
    }

    const operationQueue = ref<Operation[]>([])
    const pendingOperations = ref(new Set<string>())

    function applyRemoteOperation(op: Operation) {
      console.log('Applying remote operation:', op)
      try {
        switch (op.type) {
          case 'insert':
            if (!timetable.value.some((c) => c.id === op.data.id)) {
              timetable.value.push(op.data)
              checkConflicts(op.data)
            }
            break
          case 'update':
            const index = timetable.value.findIndex((c) => c.id === op.data.id)
            if (index > -1) {
              timetable.value[index] = op.data
              checkConflicts(op.data)
            }
            break
          case 'delete':
            const delIndex = timetable.value.findIndex((c) => c.id === op.data.id)
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

    async function removeCourse(courseId: string) {
      const operationId = `remove-${Date.now()}`
      pendingOperations.value.add(operationId)

      try {
        const auth = useAuthStore()
        const course = courseMap.value.get(courseId)
        if (course) {
          courseMap.value.delete(courseId)
          timetable.value = Array.from(courseMap.value.values())

          await updateCellData(currentClass.value?.id || 0, currentSheet.value?.id || 0, {
            Row: course.row_index,
            Col: course.col_index,
          })
        }
      } catch (error) {
        console.error('删除课程失败:', error)
        throw error
      } finally {
        pendingOperations.value.delete(operationId)
      }
    }

    return {
      timetable,
      currentWeek,
      currentClass,
      currentSheet,
      collaborators,
      groupedTimetable,
      fetchTimetable,
      setCurrentClass,
      setCurrentSheet,
      getCoursesByDay,
      updateCourse,
      removeCourse,
      applyRemoteOperation,
      operationQueue,
      convertToCourse,
      totalweek
    }
  },
  {
    persist: true,
  },
)
