import io from 'socket.io-client'
import type { StoreDefinition } from 'pinia'
import type { Course } from '../stores/schedule'

let socket: ReturnType<typeof io> | null = null
let store: ReturnType<StoreDefinition> | null = null

export interface Operation {
  type: 'insert' | 'update' | 'delete'
  data: Course | (Course & { _deleted: boolean })
  version: number
  timestamp: number
  userId: string
}

export function initSocket() {
  // socket = io('http://10.161.229.242:5173', {
  //   reconnection: true,
  //   reconnectionAttempts: Infinity,
  //   reconnectionDelay: 1000,
  //   reconnectionDelayMax: 10000,
  //   randomizationFactor: 0.5,
  //   timeout: 30000,
  //   autoConnect: true,
  //   transports: ['websocket', 'polling'],
  //   upgrade: true,
  //   forceNew: true,
  //   rejectUnauthorized: false,
  // })

  // 延迟获取 store 引用
  import('../stores/schedule').then(module => {
    const { useScheduleStore } = module
    store = useScheduleStore()

    // 初始化事件监听
    socket?.on('connect', () => {
      console.log('Socket connected')
    })

    socket?.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    socket?.on('operation', (op: Operation) => {
      if (store) {
        console.log('Received remote operation:', op)
        // 添加操作队列处理
        if (!store.operationQueue) {
          store.operationQueue = []
        }
        store.operationQueue.push(op)
        processOperationQueue(store)
      }
    })

    // 添加操作队列处理函数
    const processOperationQueue = (store: any) => {
      if (store.operationQueue && store.operationQueue.length > 0) {
        const op = store.operationQueue.shift()
        try {
          store.applyRemoteOperation(op)
        } catch (e) {
          console.error('Failed to apply operation:', op, e)
          // 重试失败的operation
          store.operationQueue.unshift(op)
          setTimeout(() => processOperationQueue(store), 1000)
        }
      }
    }

    socket?.on('collaboratorsUpdated', (users) => {
      if (store) {
        console.log('Collaborators updated:', users)
        store.collaborators = users.filter((u: any) => u.id !== store?.currentUser.id)
      }
    })

    socket?.on('connect_error', (err) => {
      console.error('Socket connection error:', err)
      setTimeout(() => {
        socket?.connect()
      }, 5000)
    })

    socket?.on('error', (err) => {
      console.error('Socket general error:', err)
      setTimeout(() => {
        socket?.connect()
      }, 5000)
    })
  })
}

export function emitOperation(op: Operation) {
  socket?.emit('operation', op)
}
