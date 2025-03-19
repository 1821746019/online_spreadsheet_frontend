// stores/schedule.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
// stores/schedule.js
import { emitCourseUpdate } from '../utils/socket' // 修改为具名导入

export const useScheduleStore = defineStore('schedule', () => {
  const timetable = ref([
    {
      id: 'mon-9am',
      day: 'Monday',
      start: '08:00',
      end: '10:00',
      course: '数学',
      teacher: '张老师',
      room: 'A201',
      lastUpdatedBy: null
    }
  ])

  const collaborators = ref([])
  const currentUser = ref({
    id: crypto.randomUUID(),
    name: '用户' + Math.floor(Math.random() * 1000),
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  })

  // 计算属性：按天分组
  const groupedTimetable = computed(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    return days.map(day => ({
      day,
      courses: timetable.value.filter(c => c.day === day)
    }))
  })

  function updateCourse(updatedCourse) {
    const index = timetable.value.findIndex(c => c.id === updatedCourse.id)
    if (index > -1) {
      timetable.value[index] = {
        ...updatedCourse,
        lastUpdatedBy: currentUser.value.id
      }
      checkConflicts(updatedCourse)
      emitCourseUpdate(updatedCourse) // 确保触发网络同步
    }
  }

  function checkConflicts(course) {
    timetable.value.forEach(c => {
      c.hasConflict = c.day === course.day &&
        c.start === course.start &&
        c.id !== course.id &&
        (c.teacher === course.teacher || c.room === course.room)
    })
  }


  function removeCourse(courseId) {
    const index = timetable.value.findIndex(c => c.id === courseId)
    if (index > -1) {
      const removed = timetable.value.splice(index, 1)
      // 触发网络同步
      emitCourseUpdate({ ...removed[0], _deleted: true })
    }
  }

  return {
    timetable,
    collaborators,
    currentUser,
    groupedTimetable,
    updateCourse,
    removeCourse
  }
})
