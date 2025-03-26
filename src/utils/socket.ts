import io from 'socket.io-client'
import type { StoreDefinition } from 'pinia'
import type { Course } from '../stores/schedule'

let socket: ReturnType<typeof io> | null = null
let store: ReturnType<StoreDefinition> | null = null

export function initSocket() {
  socket = io('http://localhost:3000')

  // 延迟获取 store 引用
  import('../stores/schedule').then(module => {
    const { useScheduleStore } = module
    store = useScheduleStore()

    // 初始化事件监听
    socket?.on('courseUpdated', (course: Course) => {
      if (store && course.lastUpdatedBy !== store.currentUser.id) {
        store.updateCourse(course)
      }
    })

    socket?.on('collaboratorsUpdated', (users) => {
      if (store) {
        store.collaborators = users.filter((u: any) => u.id !== store?.currentUser.id)
      }
    })
  })
}

export function emitCourseUpdate(course: Course | (Course & { _deleted: boolean })) {
  socket?.emit('courseUpdate', course)
}
