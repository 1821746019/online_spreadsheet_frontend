import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { emitCourseUpdate } from '../utils/socket'
import axios from '../utils/api'

export interface Course {
    id: string;
    day: string;
    start: string;
    end: string;
    course: string;
    teacher: string;
    room: string;
    lastUpdatedBy: any;
    hasConflict?: boolean;
    week: number;
}

export const useScheduleStore = defineStore('schedule', () => {
  const timetable = ref<Course[]>([])
  const currentWeek = ref(1)
  const collaborators = ref([])
  const currentUser = ref({
    id: crypto.randomUUID(),
    name: '用户' + Math.floor(Math.random() * 1000),
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  })

  interface Course {
    id: string;
    day: string;
    start: string;
    end: string;
    course: string;
    teacher: string;
    room: string;
    lastUpdatedBy: any;
    hasConflict?: boolean;
    week: number;
  }

  // 初始化空课表
  async function fetchTimetable(week: number) {
    timetable.value = timetable.value.filter(c => c.week !== week) // 保留其他周次数据
    currentWeek.value = week
  }

  // 计算属性：按天分组
  const groupedTimetable = computed(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday','Saturday','Sunday']
    return days.map(day => ({
      day,
      courses: timetable.value.filter(c => c.day === day && c.week === currentWeek.value)
    }))
  })

  function getCoursesByDay(day: string) {
    return timetable.value.filter(c => c.day === day && c.week === currentWeek.value)
  }

  function updateCourse(updatedCourse: Course) {
    const index = timetable.value.findIndex(c => c.id === updatedCourse.id)
    if (index > -1) {
      timetable.value[index] = {
        ...updatedCourse,
        lastUpdatedBy: currentUser.value.id,
        week: updatedCourse.week || currentWeek.value // 保留传入的week或使用当前周次
      }
      checkConflicts(updatedCourse)
      emitCourseUpdate(updatedCourse)
    } else {
      // 如果是新课程，添加到timetable
      timetable.value.push({
        ...updatedCourse,
        lastUpdatedBy: currentUser.value.id,
        week: updatedCourse.week || currentWeek.value
      })
      checkConflicts(updatedCourse)
      emitCourseUpdate(updatedCourse)
    }
  }

  function checkConflicts(course: Course) {
    timetable.value.forEach(c => {
      c.hasConflict = c.day === course.day &&
        c.start === course.start &&
        c.week === course.week &&
        c.id !== course.id &&
        (c.teacher === course.teacher || c.room === course.room)
    })
  }

  function removeCourse(courseId: string) {
    const index = timetable.value.findIndex(c => c.id === courseId)
    if (index > -1) {
      const removed = timetable.value.splice(index, 1)
      emitCourseUpdate({ ...removed[0], _deleted: true })
    }
  }

  return {
    timetable,
    currentWeek,
    collaborators,
    currentUser,
    groupedTimetable,
    fetchTimetable,
    getCoursesByDay,
    updateCourse,
    removeCourse
  }
})
