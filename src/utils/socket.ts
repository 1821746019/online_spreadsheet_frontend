// utils/socket.js
import io from 'socket.io-client'

let socket = null
let store = null

export function initSocket() {
  socket = io('http://localhost:3000')

  // 延迟获取 store 引用
  import('../stores/schedule.js').then(module => {
    const { useScheduleStore } = module
    store = useScheduleStore()

    // 初始化事件监听
    socket.on('courseUpdated', (course) => {
      if (course.lastUpdatedBy !== store.currentUser.id) {
        store.updateCourse(course)
      }
    })

    socket.on('collaboratorsUpdated', (users) => {
      store.collaborators = users.filter(u => u.id !== store.currentUser.id)
    })
  })
}

export function emitCourseUpdate(course) {
  if (socket) {
    socket.emit('courseUpdate', course)
  }
}
