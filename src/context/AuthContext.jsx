import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { initiateSocket, disconnectSocket, getSocket } from '../utils/socket'
import Swal from 'sweetalert2'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mechanic_user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('mechanic_token'))
  const [jobAlert, setJobAlert] = useState(null)

  const dismissAlert = useCallback(() => setJobAlert(null), [])

  useEffect(() => {
    const userId = user?.id || user?._id
    if (!userId) return

    // Socket connect karo
    initiateSocket(userId)

    const handleNewJob = (data) => {
      console.log('[Mechanic] new job received:', data)
      try {
        const audio = new Audio('/sound/booking.wav')
        audio.play().catch(() => {})
      } catch {}
      setJobAlert({
        bookingId:    data.bookingId,
        customerName: data.customerName || 'Customer',
        address:      data.address || '',
        serviceType:  data.serviceType || 'mechanic',
      })
    }

    const attachListeners = () => {
      const socket = getSocket()
      if (!socket) return
      socket.off('new_mechanic_job')
      socket.off('new_job')
      socket.off('job_completed_mechanic')

      socket.on('new_mechanic_job', handleNewJob)
      socket.on('new_job', handleNewJob)
      socket.on('job_completed_mechanic', (data) => {
        if (data.trialMessage) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Job Completed',
            text: data.trialMessage,
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
          })
        }
      })
      console.log('[Mechanic] socket listeners attached, room:', userId)
    }

    // Abhi attach karo
    attachListeners()

    // Socket connect hone ke baad bhi attach karo (race condition fix)
    const s = getSocket()
    if (s) {
      s.on('connect', () => {
        s.emit('join', userId.toString())
        attachListeners()
      })
      s.on('reconnect', () => {
        s.emit('join', userId.toString())
        attachListeners()
      })
    }

    // Polling fallback — 500ms baad ek baar aur attach karo
    const t = setTimeout(attachListeners, 500)

    return () => {
      clearTimeout(t)
      const socket = getSocket()
      if (socket) {
        socket.off('new_mechanic_job', handleNewJob)
        socket.off('new_job', handleNewJob)
        socket.off('job_completed_mechanic')
      }
      disconnectSocket()
    }
  }, [user?.id, user?._id])

  const login = (tok, usr) => {
    localStorage.setItem('mechanic_token', tok)
    localStorage.setItem('mechanic_user', JSON.stringify(usr))
    setToken(tok)
    setUser(usr)
  }

  const logout = () => {
    disconnectSocket()
    localStorage.removeItem('mechanic_token')
    localStorage.removeItem('mechanic_user')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, jobAlert, dismissAlert }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
