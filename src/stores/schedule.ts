import { defineStore } from 'pinia'
import { ref, computed,unref } from 'vue'
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
    // const auth = useAuthStore()

    async function fetchTimetable(week: number) {
      currentWeek.value = week;
      if (!currentClass.value?.id) {
        timetable.value = [];
        courseMap.value.clear();
        return;
      }

      try {
        const sheetId = currentSheet.value?.id;
        if (!sheetId) {
          throw new Error("没有sheetid");
        }

        const response = await fetchCellData(currentClass.value.id, sheetId);
        // console.log('cell', response.data);

        const cellData = response.data.filter((item) => item.item_id !== null);

        const newCourses = cellData.map(cell => ({
          classId: currentClass.value!.id, // 使用 ! 因为前面已经检查过
          col_index: cell.col_index,
          course: cell.content,
          hasConflict: false,
          id: cell.item_id.toString(),
          room: cell.class_room,
          row_index: cell.row_index,
          teacher: cell.teacher,
          week_type: cell.week_type || 'all',
        }));

        // 更新 Map 和数组
        courseMap.value.clear();
        newCourses.forEach((course) => {
          courseMap.value.set(course.id, course);
        });
        timetable.value = newCourses;
        ElMessage.success('获取课表成功')
      } catch (error) {
        timetable.value = [];
        courseMap.value.clear();
        console.error('获取课表失败:', error);
        // 考虑在这里添加错误处理，如显示用户通知
        ElMessage.warning('获取课表失败')
      }
    }
    // const convertToCourse = (cell: any, item: any): Course => {
    //   return {
    //     id: item.id.toString(),
    //     row_index: cell.row_index,
    //     col_index: cell.col_index,
    //     course: item.content,
    //     teacher: item.teacher,
    //     room: item.classroom,
    //     week_type: item.week_type || 'single', // 默认 single
    //     classId: currentClass.value?.id || 0, // 这里使用 item.id 作为 classId，如果不正确请调整
    //     // lastUpdatedBy 和 hasConflict 是可选的，可以不赋值
    //     hasConflict: false,
    //   }
    // }
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
  const operationId = `update-${Date.now()}`;
  pendingOperations.value.add(operationId);

  try {
    // 1. 准备数据
    const auth = useAuthStore();
    const classId = currentClass.value?.id || 0;
    const sheetId = currentSheet.value?.id || 0;

    // 2. 构建最终课程对象
    const finalCourse = {
      ...updatedCourse,
      classId,
      lastUpdatedBy: auth.$state.user?.username || '未知用户',
      week_type: updatedCourse.week_type || 'all',
    };

    // 3. 更新本地状态
    courseMap.value.set(finalCourse.id.toString(), finalCourse);
    timetable.value = Array.from(courseMap.value.values());

    // 4. 异步检查冲突（不阻塞主流程）
    setTimeout(() => checkConflicts(finalCourse), 100);
    console.log('更新后的课程:', finalCourse);
    // 5. 并行API调用
    const [updateResult, moveResult] = await Promise.all([
      updateDragItem(finalCourse.id, {
        class_room: finalCourse.room,
        content: finalCourse.course,
        teacher: finalCourse.teacher,
        selected_class_ids: [classId],
        week_type: finalCourse.week_type,
      }),
      moveDragItem(finalCourse.id, classId, sheetId, {
        target_col: finalCourse.col_index,
        target_row: finalCourse.row_index,
      }),
    ]);

    // 6. 显示成功消息
    ElMessage.success('目标拖动成功');

  } catch (error) {
    console.error('更新课程失败:', error);
    ElMessage.error('部分请求失败，请稍后重试');
    throw error;
  } finally {
    pendingOperations.value.delete(operationId);
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
        // const auth = useAuthStore()
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
      // convertToCourse,
      totalweek
    }
  },
  {
    persist: true,
  },
)
