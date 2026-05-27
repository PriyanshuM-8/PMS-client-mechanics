import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { FaMapMarkerAlt, FaWrench, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { MdBuild } from 'react-icons/md'

// Global audio unlock — pehle user interaction pe silent audio bajao
let audioUnlocked = false
const unlockAudio = () => {
  if (audioUnlocked) return
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const buf = ctx.createBuffer(1, 1, 22050)
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.connect(ctx.destination)
  src.start(0)
  ctx.resume().then(() => { audioUnlocked = true })
}

// Page load hote hi unlock attempt
if (typeof window !== 'undefined') {
  const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click']
  const handler = () => {
    unlockAudio()
    events.forEach(e => document.removeEventListener(e, handler))
  }
  events.forEach(e => document.addEventListener(e, handler, { once: true }))
}

export default function JobAlertPopup() {
  const { jobAlert, dismissAlert } = useAuth()
  const navigate = useNavigate()
  const audioRef = useRef(null)
  const retryRef = useRef(null)

  const playSound = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      const audio = new Audio('/sound/booking.wav')
      audio.loop = true
      audio.volume = 1.0
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay blocked — retry after 300ms (user might interact)
          retryRef.current = setTimeout(() => {
            audio.play().catch(() => {})
          }, 300)
        })
      }
      audioRef.current = audio
    } catch {}
  }

  const stopSound = () => {
    if (retryRef.current) clearTimeout(retryRef.current)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
  }

  useEffect(() => {
    if (!jobAlert) return
    playSound()
    // Vibrate on mobile
    if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 300])
    return () => stopSound()
  }, [jobAlert])

  const handleAccept = async () => {
    stopSound()
    try {
      await api.patch(`/bookings/mechanic/${jobAlert.bookingId}/accept`)
      dismissAlert()
      navigate(`/job/${jobAlert.bookingId}`)
    } catch (err) {
      dismissAlert()
      const msg = err.response?.data?.message || 'Failed to accept'
      if (msg.toLowerCase().includes('wallet') || msg.toLowerCase().includes('balance')) {
        alert('Low wallet balance. Please recharge to accept jobs.')
      } else {
        alert(msg)
      }
    }
  }

  const handleReject = () => {
    stopSound()
    dismissAlert()
  }

  if (!jobAlert) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[101] animate-slide-up"
        style={{ maxWidth: 430, margin: '0 auto', left: 0, right: 0 }}>
        <div className="bg-white rounded-t-[1.75rem] shadow-2xl overflow-hidden">

          {/* Pulse bar */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 animate-pulse" />

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-8 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Icon + title */}
          <div className="flex flex-col items-center px-5 pt-2 pb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-300/50 mb-2.5 animate-bounce">
              <FaWrench className="text-white text-xl" />
            </div>
            <p className="text-gray-900 font-black text-sm">New Job Request!</p>
            <p className="text-gray-400 text-[11px] mt-0.5">A customer needs your help</p>
          </div>

          {/* Details */}
          <div className="mx-4 mb-3 bg-gray-50 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MdBuild className="text-blue-500 text-xs" />
              </div>
              <div>
                <p className="text-gray-400 text-[9px] uppercase tracking-wider">Customer</p>
                <p className="text-gray-900 font-bold text-xs">{jobAlert.customerName}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FaMapMarkerAlt className="text-red-500 text-[10px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-[9px] uppercase tracking-wider">Location</p>
                <p className="text-gray-700 text-[11px] leading-relaxed line-clamp-2">{jobAlert.address || 'Location shared'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                <FaWrench className="text-cyan-600 text-[10px]" />
              </div>
              <div>
                <p className="text-gray-400 text-[9px] uppercase tracking-wider">Service</p>
                <p className="text-gray-900 font-bold text-xs capitalize">{jobAlert.serviceType}</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 px-4 pb-6">
            <button onClick={handleReject}
              className="flex-1 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-500 font-black text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
              <FaTimesCircle className="text-sm" /> Reject
            </button>
            <button onClick={handleAccept}
              className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-300/50 active:scale-95 transition-transform">
              <FaCheckCircle className="text-sm" /> Accept Job
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
