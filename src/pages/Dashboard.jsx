import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { getSocket, initiateSocket } from '../utils/socket'
import { FaWrench, FaWallet, FaClipboardList, FaMapMarkerAlt, FaStar, FaTimes, FaBolt, FaChevronRight } from 'react-icons/fa'
import { IoMdSync } from 'react-icons/io'
import BottomNav from '../components/BottomNav'
import Swal from 'sweetalert2'
export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [profile, setProfile] = useState(null)
  const [pendingJob, setPendingJob] = useState(null)
  const [togglingStatus, setTogglingStatus] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('mechanic_token')
    if (!token) return navigate('/login')

    api.get('/mechanic/me').then(({ data }) => setProfile(data.data)).catch(() => {})

    const userId = JSON.parse(localStorage.getItem('mechanic_user') || '{}')?.id
    initiateSocket(userId)
    const socket = getSocket()

    socket.on('new_mechanic_job', data => {
      setPendingJob(data)
      if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    })
    socket.on('job_assigned_to_other', data => {
      setPendingJob(p => (p?.bookingId === data.bookingId ? null : p))
    })

    fetchStats()
    return () => { socket.off('new_mechanic_job'); socket.off('job_assigned_to_other') }
  }, [])

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/mechanic/stats')
      setStats(data.data)
      if (data.data.activeJob) navigate(`/job/${data.data.activeJob._id}`)
      if (data.data.pendingJob) setPendingJob(data.data.pendingJob)
    } catch (e) { console.error(e) }
  }

  const toggleAvailability = async () => {
    setTogglingStatus(true)
    try {
      await api.patch('/mechanic/availability')
      setStats(s => ({ ...s, isAvailable: !s.isAvailable }))
    } catch { } finally { setTogglingStatus(false) }
  }

  const handleAccept = async (bookingId) => {
    try {
      await api.patch(`/bookings/mechanic/${bookingId}/accept`)
      setPendingJob(null)
      navigate(`/job/${bookingId}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not accept job';
      if (msg.includes('Insufficient wallet balance')) {
        Swal.fire({
          title: 'Insufficient Balance',
          text: msg,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Recharge Wallet',
          cancelButtonText: 'Close'
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/wallet');
          }
        });
      } else {
        Swal.fire('Error', msg, 'error');
      }
      setPendingJob(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('mechanic_token')
    localStorage.removeItem('mechanic_user')
    navigate('/login')
  }

  if (!stats || !profile) return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading dashboard...</p>
      <button 
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold active:scale-95 transition"
      >
        Logout / Retry
      </button>
    </div>
  )

  const name = profile.name || 'Mechanic'
  const firstName = name.split(' ')[0]
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">

      {/* ── Header ── */}
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top,0px))] pb-24 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-b-[2.5rem] shadow-xl shadow-red-300/40 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-44 h-44 bg-white/10 rounded-full" />
        <div className="absolute top-12 -right-4 w-24 h-24 bg-white/5 rounded-full" />

        {/* Top bar */}
        <div className="flex justify-between items-center relative z-10">
          <img src="/Images/Logo.png" alt="FuelX" className="h-8 w-auto object-contain drop-shadow"
            onError={e => { e.target.style.display = 'none' }} />
          <Link to="/profile" className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-sm font-black border border-white/30 overflow-hidden">
            {profile.profileImage
              ? <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
              : <span>{initials}</span>}
          </Link>
        </div>

        {/* Greeting */}
        <div className="mt-5 relative z-10">
          <p className="text-white/60 text-xs font-medium">{greeting} </p>
          <h2 className="text-white font-black text-2xl leading-tight mt-0.5">Welcome Back, {firstName}!</h2>
          <div className="flex items-center gap-1.5 mt-1.5">
            <FaMapMarkerAlt className="text-white/50 text-xs flex-shrink-0" />
            <p className="text-white/50 text-[11px] truncate max-w-[220px]">{profile.address || 'Location not set'}</p>
          </div>
        </div>

        {/* Availability Toggle */}
        <button onClick={toggleAvailability} disabled={togglingStatus}
          className={`mt-4 relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black shadow-lg transition-all active:scale-95 disabled:opacity-70 ${
            stats.isAvailable
              ? 'bg-green-400 text-green-900 border border-green-300 shadow-green-300/40'
              : 'bg-white/20 text-white border border-white/30'
          }`}>
          {togglingStatus
            ? <IoMdSync className="animate-spin text-sm" />
            : <span className={`w-2 h-2 rounded-full ${stats.isAvailable ? 'bg-green-800 animate-pulse' : 'bg-white/50'}`} />}
          {stats.isAvailable ? 'Online — Accepting Jobs' : 'Offline — Tap to Go Online'}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="px-5 -mt-14 relative z-10">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Today's Jobs", value: stats.todayJobs ?? 0, icon: <FaClipboardList className="text-red-400 text-sm" /> },
            { label: "Today's Earn", value: `₹${stats.todayEarnings ?? 0}`, icon: <FaWallet className="text-amber-400 text-sm" /> },
            { label: 'Rating', value: profile.rating?.toFixed(1) ?? '—', icon: <FaStar className="text-yellow-400 text-sm" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl p-3.5 shadow-md border border-gray-100 text-center">
              <div className="flex justify-center mb-1.5">{icon}</div>
              <p className="text-gray-900 font-black text-lg leading-tight">{value}</p>
              <p className="text-gray-400 text-[9px] uppercase tracking-wider mt-0.5 font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">

        {/* ── Live Job Alert ── */}
        {pendingJob && (
          <div className="bg-white rounded-3xl border-2 border-red-500 shadow-xl shadow-red-200/60 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-amber-500 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBolt className="text-white text-sm animate-pulse" />
                <p className="text-white font-black text-sm">New Job Request!</p>
              </div>
              <span className="text-white/80 text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">Just now</span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-red-500 font-black text-lg">{pendingJob.customerName?.[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-gray-900 font-black text-sm">{pendingJob.customerName}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{pendingJob.problemDescription || pendingJob.description}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3 mb-3 space-y-2 border border-gray-100">
                {pendingJob.vehicleType && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-[10px] font-bold uppercase">Vehicle</span>
                    <span className="text-gray-800 text-xs font-bold">{pendingJob.vehicleType}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-[10px] font-bold uppercase">Location</span>
                  <span className="text-gray-700 text-xs font-bold max-w-[160px] truncate text-right">{pendingJob.address}</span>
                </div>
                {pendingJob.estimatedEarning && (
                  <div className="flex justify-between items-center pt-1.5 border-t border-gray-200">
                    <span className="text-gray-400 text-[10px] font-bold uppercase">Est. Earning</span>
                    <span className="text-green-600 font-black text-sm">₹{pendingJob.estimatedEarning}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5">
                <button onClick={() => handleAccept(pendingJob.bookingId)}
                  className="flex-1 bg-gradient-to-r from-red-600 to-amber-500 text-white font-black py-3.5 rounded-2xl shadow-md shadow-red-200 text-sm active:scale-95 transition-all">
                  ✓ Accept Job
                </button>
                <button onClick={() => setPendingJob(null)}
                  className="w-12 h-12 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center active:scale-95 transition-all flex-shrink-0">
                  <FaTimes />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Active Job Banner ── */}
        {stats.activeJob && !pendingJob && (
          <Link to={`/job/${stats.activeJob._id}`}
            className="flex items-center gap-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-4 shadow-lg shadow-orange-200/50 active:scale-[0.98] transition-all">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FaWrench className="text-white text-lg" />
            </div>
            <div className="flex-1">
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">Active Job</p>
              <p className="text-white font-black text-sm mt-0.5">{stats.activeJob.customer?.name || 'Customer'}</p>
              <p className="text-white/70 text-xs capitalize">{stats.activeJob.status?.replace('_', ' ')}</p>
            </div>
            <FaChevronRight className="text-white/70 text-sm" />
          </Link>
        )}

        {/* ── Status Card (when no pending/active job) ── */}
        {!pendingJob && !stats.activeJob && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${stats.isAvailable ? 'bg-green-50' : 'bg-gray-100'}`}>
                <FaWrench className={`text-xl ${stats.isAvailable ? 'text-green-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-gray-800 font-black text-sm">{stats.isAvailable ? 'Waiting for jobs...' : 'You are offline'}</p>
                <p className="text-gray-400 text-xs mt-0.5">{stats.isAvailable ? 'New requests will appear here' : 'Go online to start receiving jobs'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Summary ── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <p className="text-gray-800 font-black text-3xl mb-4">Overall Summary</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-red-500 to-amber-400 rounded-2xl p-4 shadow-sm">
              <FaClipboardList className="text-white/70 text-base mb-2" />
              <p className="text-white font-black text-3xl leading-none">{stats.totalJobs ?? 0}</p>
              <p className="text-white/70 text-[10px] mt-1 font-semibold">Total Jobs Done</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <FaWallet className="text-gray-400 text-base mb-2" />
              <p className="text-gray-900 font-black text-2xl leading-none">₹{stats.totalEarnings ?? 0}</p>
              <p className="text-gray-400 text-[10px] mt-1 font-semibold">Total Earned</p>
            </div>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-1 gap-3">
          <Link to="/my-jobs" className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-95 transition-all">
            <div className="w-9 h-15 bg-purple-50 rounded-xl flex items-center justify-center">
              <FaClipboardList className="text-purple-500 text-sm" />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-xs">Job History</p>
              <p className="text-gray-400 text-[10px]">View all jobs</p>
            </div>
          </Link>
          <Link to="/earnings" className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-95 transition-all">
            <div className="w-9 h-15 bg-green-50 rounded-xl flex items-center justify-center">
              <FaWallet className="text-green-500 text-sm" />
            </div>
            <div>
              <p className="text-gray-900 font-bold text-xs">Earnings</p>
              <p className="text-gray-400 text-[10px]">Income report</p>
            </div>
          </Link>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
