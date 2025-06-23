import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// import { type Operation } from '../utils/socket'
import { ElMessage } from 'element-plus';
import * as api from '../utils/api'
import  {
  fetchCellData,
  updateDragItem,
  moveDragItem,
  updateCellData,
} from '../utils/api'

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
    const weekToSheetMap = ref<Record<number, number>>({})
    const totalweek=ref(20)
    const currentClass = ref<Class | null>(null)
    const currentSheet = ref<Sheet | null>(null)
    const collaborators = ref([])
    const ifdrag=ref(true)
    // const auth = useAuthStore()

    async function fetchSheets(classId: number) {
      try {
        const response =await api.fetch_sheetlist(<number>classId, {
      page: 1,
      page_size: 20
    })
        if (!response.data?.sheets) {
          throw new Error('API返回数据格式不正确，缺少sheets字段')
        }

        console.log('API响应数据:', response.data)
        weekToSheetMap.value = response.data.sheets.reduce((map, sheet) => {
          if (!sheet.week || !sheet.id) {
            console.warn('无效的sheet数据:', sheet)
            return map
          }
          map[sheet.week] = sheet.id
          return map
        }, {})

        console.log('初始化后的weekToSheetMap:', weekToSheetMap.value)
      } catch (error) {
        console.error('获取sheet列表失败:', error)
        ElMessage.error('初始化周数映射表失败')
        throw error // 抛出错误以便调用方处理
      }
    }
// 存储轮询的定时器ID
let pollingInterval: number | null = null;
// 存储当前轮询的周数
let currentPollingWeek: number | null = null;
let abortController: AbortController | null = null;
// 轮询间隔时间（毫秒）
const POLL_INTERVAL = 3000; // 10秒

// 封装轮询逻辑
function startPollingTimetable(week: number) {
  // 停止之前的轮询
  console.log('开始轮询课表，当前周数:', week);
  stopPollingTimetable();

  // 立即获取一次数据
  // fetchTimetable(week);

  // 存储当前轮询的周数
  currentPollingWeek = week

  // 开始新的轮询
  pollingInterval = window.setInterval(() => {
    if (currentPollingWeek !== null) {
      fetchTimetable(currentPollingWeek);
    }
  }, POLL_INTERVAL);
}

// 停止轮询
function stopPollingTimetable() {
  if (pollingInterval !== null) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  if (abortController !== null) {
    abortController.abort(); // 取消当前正在进行的请求
    abortController = null;
  }
  console.log('停止轮询课表');
  currentPollingWeek = null;
}

async function fetchTimetable(week: number) {
  if (abortController) {
    abortController.abort();
  }

  // 创建新的 AbortController
  abortController = new AbortController();
  currentWeek.value = week;
  if(ifdrag.value===false){
    return
  }
  if (!currentClass.value?.id) {
    timetable.value = [];
    courseMap.value.clear();
    return;
  }

  try {
    await fetchSheets(currentClass.value.id);
    const sheetId = weekToSheetMap.value[week] || currentSheet.value?.id;
    if (!sheetId) {
      throw new Error("没有有效的sheetid");
    }
    console.log('当前获取课表工作表ID:', sheetId);
    const response = await fetchCellData(currentClass.value.id, sheetId);

    const cellData = response.data.filter((item) => item.item_id !== null);
    console.log('response:', response);

    const newCourses = cellData.map(cell => ({
      classId: currentClass.value!.id,
      col_index: cell.col_index,
      course: cell.content,
      hasConflict: false,
      id: cell.item_id.toString(),
      room: cell.class_room,
      row_index: cell.row_index,
      teacher: cell.teacher,
      week_type: cell.week_type || 'all',
    }));

    // 检查数据是否有变化
    const hasChanged = checkTimetableChanges(newCourses);

    if (hasChanged) {
      // 更新 Map 和数组
      courseMap.value.clear();
      newCourses.forEach((course) => {
        courseMap.value.set(course.id, course);
      });
      timetable.value = newCourses;
      console.log('课表已更新:', timetable.value);
      ElMessage.success('课表已更新');
    } else {
      console.log('课表无变化');
    }

  } catch (error) {
    timetable.value = [];
    courseMap.value.clear();
    console.error('获取课表失败:', error);
    ElMessage.warning('课表为空或获取课表失败');
  }finally{
    if (!abortController?.signal.aborted) {
      abortController = null;
    }
  }
}

// 在 schedule.ts 中
function checkTimetableChanges(newCourses: Course[]): boolean {
  // 如果长度不同，肯定有变化
  if (timetable.value.length !== newCourses.length) {
    return true;
  }

  // 使用 Map 快速查找
  const currentMap = new Map(timetable.value.map(c => [c.id, c]));

  for (const newCourse of newCourses) {
    const oldCourse = currentMap.get(newCourse.id);
    if (!oldCourse) return true;

    if (newCourse.row_index !== oldCourse.row_index ||
        newCourse.col_index !== oldCourse.col_index ||
        newCourse.course !== oldCourse.course ||
        newCourse.teacher !== oldCourse.teacher ||
        newCourse.room !== oldCourse.room ||
        newCourse.week_type !== oldCourse.week_type) {
      return true;
    }
  }

  return false;
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
      // 添加这行，确保当前周数与sheet对应
      if (sheetInfo.week) {
        currentWeek.value = sheetInfo.week
      }
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
    // const convertTodragItem = (course: Course): any => {
    //   return {
    //     id: course.id,
    //     classroom: course.room,
    //     content: course.course,
    //     teacher: course.teacher,
    //     selected_class_ids: [course.classId],
    //     week_type: course.week_type,
    //     row_index: course.row_index,
    //     col_index: course.col_index,
    //   }
    // }
    async function updateCourse(updatedCourse: Course,ifposition: boolean = true,nopoistionchange:boolean=true) {
  const operationId = `update-${Date.now()}`;
  pendingOperations.value.add(operationId);
  try {
    // 1. 准备数据
    // const auth = useAuthStore();
    const classId = currentClass.value?.id || 0;
    const sheetId = currentSheet.value?.id || 0;

    // 2. 构建最终课程对象
    const finalCourse = {
      ...updatedCourse,
      classId,
      // lastUpdatedBy: auth.$state.user?.username || '未知用户',
      week_type: updatedCourse.week_type || 'all',
    };

    // 3. 更新本地状态
    courseMap.value.set(finalCourse.id.toString(), finalCourse);
    timetable.value = Array.from(courseMap.value.values());

    // 4. 异步检查冲突（不阻塞主流程）
    setTimeout(() => checkConflicts(finalCourse), 100);
    console.log('更新后的课程:', finalCourse);
    // 5. 并行API调用
    if (ifposition) {
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
  }else {
    if(!nopoistionchange){

      await updateDragItem(finalCourse.id, {
        class_room: finalCourse.room,
        content: finalCourse.course,
        teacher: finalCourse.teacher,
        selected_class_ids: [classId],
        week_type: finalCourse.week_type,
      })
    }else{
    const updateResult = await moveDragItem(finalCourse.id, classId, sheetId, {
        target_col: finalCourse.col_index,
        target_row: finalCourse.row_index,
      });}
    console.log('移动结果:');
  }
  // //周类型修改后滞留问题
  //  if((finalCourse.week_type === 'single' && (currentWeek.value % 2 === 0)) ||
  //        (finalCourse.week_type === 'double' && currentWeek.value % 2 === 1)){
  //         updateCellData(classId, sheetId, {
  //           Row: finalCourse.row_index,
  //           Col: finalCourse.col_index,
  //         });
  //         timetable.value = timetable.value.filter(c => c.id !== finalCourse.id);
  //         courseMap.value.delete(finalCourse.id.toString());
  //         ElMessage.warning('当前周不符合课程类型，已从课表中移除');
  //        }
    // 6. 显示成功消息
    ElMessage.success('目标拖动成功');

  } catch (error) {
    const errorMsg = (typeof error === 'object' && error !== null && 'msg' in error) ? (error as any).msg : '未知错误';
    console.error('更新课程失败:', errorMsg);
    ElMessage.error(`${errorMsg}`);
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

    // const operationQueue = ref<Operation[]>([])
    const pendingOperations = ref(new Set<string>())

    // function applyRemoteOperation(op: Operation) {
    //   console.log('Applying remote operation:', op)
    //   try {
    //     switch (op.type) {
    //       case 'insert':
    //         if (!timetable.value.some((c) => c.id === op.data.id)) {
    //           timetable.value.push(op.data)
    //           checkConflicts(op.data)
    //         }
    //         break
    //       case 'update':
    //         const index = timetable.value.findIndex((c) => c.id === op.data.id)
    //         if (index > -1) {
    //           timetable.value[index] = op.data
    //           checkConflicts(op.data)
    //         }
    //         break
    //       case 'delete':
    //         const delIndex = timetable.value.findIndex((c) => c.id === op.data.id)
    //         if (delIndex > -1) {
    //           timetable.value.splice(delIndex, 1)
    //         }
    //         break
    //     }
    //   } catch (e) {
    //     console.error('Failed to apply operation:', op, e)
    //     operationQueue.value.push(op)
    //     setTimeout(() => {
    //       if (operationQueue.value.length > 0) {
    //         const nextOp = operationQueue.value.shift()
    //         if (nextOp) {
    //           applyRemoteOperation(nextOp)
    //         }
    //       }
    //     }, 1000)
    //   }
    // }

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
      // applyRemoteOperation,
      // operationQueue,
      fetchSheets,
      weekToSheetMap,
      // convertToCourse,
      startPollingTimetable,
      stopPollingTimetable,
      totalweek,
      ifdrag
    }
  },
  {
    persist: true,
  },
)
