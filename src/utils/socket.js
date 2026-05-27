import { io } from 'socket.io-client'

let socket = null

export const initiateSocket = (userId) => {
  if (socket?.connected) {
    // Already connected — just re-join the room
    socket.emit('join', userId.toString())
    return
  }

  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  })

  socket.on('connect', () => {
    console.log('[Socket] connected, joining room:', userId)
    socket.emit('join', userId.toString())
  })

  socket.on('reconnect', () => {
    console.log('[Socket] reconnected, rejoining room:', userId)
    socket.emit('join', userId.toString())
  })
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}

export const getSocket = () => socket
