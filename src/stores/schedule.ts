import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { emitOperation, type Operation } from '../utils/socket'
import axios, { fetchCellData,fetchDragItem,deleteDragItem,updateDragItem, moveDragItem,updateCellData } from '../utils/api'
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

function getDayFromColIndex(colIndex: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[colIndex - 1] || 'Monday';
}

function getTimeFromRowIndex(rowIndex: number): {start: string, end: string} {
  const times = [
    '08:30-09:55', '10:15-11:40', '11:45-12:25',
    '14:00-15:25', '15:45-17:10', '17:15-17:55',
    '19:00-20:20', '20:30-21:50'
  ];
  const [start, end] = times[rowIndex - 1]?.split('-') || ['08:30', '09:55'];
  return {start, end};
}

export const useScheduleStore = defineStore(
  'schedule',
  () => {
    const timetable = ref<Course[]>([])
    const currentWeek = ref(1)
    const currentClass = ref<Class | null>(null)
    const currentSheet= ref<Sheet | null>(null)
    const collaborators = ref([])
    const auth = useAuthStore()

    async function fetchTimetable(week: number) {
      currentWeek.value = week
      if (!currentClass.value) return

      try {
        const cellresponse = fetchCellData(currentClass.value.id, currentSheet.value?.id || 0)
        console.log('获取课表:', ((await cellresponse).data))
        const cellData = (await cellresponse).data.filter(item => item.item_id !== null);
        // timetable.value = []
        const dragItemResponse = (cellData.map(Item => Item.item_id)).map((itemId: number) => fetchDragItem(itemId))
        const dragItemData = (await Promise.all(dragItemResponse)).map((response: any) => response.data)
        console.log('dragItemData',dragItemData)
        timetable.value = cellData.map((cell, index) =>
          convertToCourse(cell, dragItemData[index])
        );
        console.log('获取拖动元素:', dragItemData)
      } catch (error) {
        timetable.value=[]
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
        classId: currentClass.value?.id||0, // 这里使用 item.id 作为 classId，如果不正确请调整
        // lastUpdatedBy 和 hasConflict 是可选的，可以不赋值
        hasConflict: false,
      };
    };
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
        courses: timetable.value.filter((c) =>
          getDayFromColIndex(c.col_index) === day &&
          (c.week_type === 'all' ||
           (c.week_type === 'single' && currentWeek.value % 2 === 1) ||
           (c.week_type === 'double' && currentWeek.value % 2 === 0)) &&
          c.classId === currentClass.value?.id
        ),
      }))
    })

    function getCoursesByDay(day: string) {
      return timetable.value.filter((c) =>
        getDayFromColIndex(c.col_index) === day &&
        (c.week_type === 'all' ||
         (c.week_type === 'single' && currentWeek.value % 2 === 1) ||
         (c.week_type === 'double' && currentWeek.value % 2 === 0)) &&
        c.classId === currentClass.value?.id
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
      return new Promise<void>(async (resolve, reject) => {
        try {
          const auth = useAuthStore()
          const index = timetable.value.findIndex((c) => c.id === updatedCourse.id)

          const finalCourse = {
            ...updatedCourse,
            classId: currentClass.value?.id || 0,
            lastUpdatedBy: auth.$state.user?.username || '未知用户',
            week_type: updatedCourse.week_type || 'all'
          }

          if (index > -1) {
            timetable.value.splice(index, 1)
          }
          timetable.value.push(finalCourse)


          timetable.value.sort((a, b) => a.id - b.id)

          if(!checkConflicts(finalCourse)){
            // 发送请求到后端
          await updateDragItem(finalCourse.id, {
            classroom: finalCourse.room,
            content: finalCourse.course,
            teacher: finalCourse.teacher,
            selected_class_ids: [finalCourse.classId],
            week_type: finalCourse.week_type
          })
          await moveDragItem(
            finalCourse.id,
            currentClass.value?.id || 0,
            currentSheet.value?.id || 0,
            {
              target_col: finalCourse.col_index,
              target_row: finalCourse.row_index,
            }
          )
          }

          // emitOperation({
          //   type: 'update',
          //   data: finalCourse,
          //   version: Date.now(),
          //   timestamp: Date.now(),
          //   userId: auth.user?.username || 'unknown'
          // })
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    }

    function checkConflicts(course: Course) {
      // 1. 获取当前课程的时间段和星期
      const { start, end } = getTimeFromRowIndex(course.row_index);
      const day = getDayFromColIndex(course.col_index);

      // 2. 遍历课表检查冲突
      timetable.value.forEach((c) => {
        // 跳过自身比较
        if (c.id === course.id) return;

        // 3. 获取对比课程的时间段和星期
        const cTime = getTimeFromRowIndex(c.row_index);
        const cDay = getDayFromColIndex(c.col_index);

        // 4. 冲突条件判断（优化后的逻辑）
        const isSameDayAndTime = cDay === day && cTime.start === start&&cTime.end === end;
        // 判断是否为同一周类型
        const isSameWeekType = c.week_type === course.week_type ||
                             course.week_type === 'all' ||
                             c.week_type === 'all';
        const isSameClass = c.classId === course.classId;
        const isTeacherOrRoomConflict = c.teacher === course.teacher ||
                                       c.room === course.room;

        // 5. 设置冲突状态（避免重复计算）
        c.hasConflict = (isSameDayAndTime &&isSameWeekType &&isSameClass )//同一班级同一时间段
        // ||(isTeacherOrRoomConflict&&isSameDayAndTime&&isSameWeekType);//同一时间段的同一老师或教室
        // console.log('课程冲突:', c.course, '与', course.course, '冲突状态:', c.hasConflict);
        // console.log('时间冲突',isSameDayAndTime,'同一周类型',isSameWeekType,'同一班级',isSameClass,'教师或教室冲突',isTeacherOrRoomConflict)
      });

      // 6. 设置当前课程的冲突状态（新增）
      course.hasConflict = timetable.value.some(c =>
        c.hasConflict && c.id !== course.id
      );
      return course.hasConflict
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

    async function removeCourse(courseId: number) {
      const auth = useAuthStore()
      const index = timetable.value.findIndex((c) => c.id === courseId)
      if (index > -1) {
        const row_index=timetable.value[index].row_index
        const col_index=timetable.value[index].col_index
        const removed = timetable.value.splice(index, 1)
        await(updateCellData(currentClass.value?.id||0,currentSheet.value?.id||0,{
          Row:row_index,
          Col:col_index
        }))
        console.log('删除拖动元素:', removed[0])
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
    }
  },
  {
    persist: true,
  }
)
