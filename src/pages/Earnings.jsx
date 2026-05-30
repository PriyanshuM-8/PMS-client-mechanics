import { useEffect, useState } from 'react'
import api from '../utils/api'
import { FaWallet, FaClipboardList, FaStar, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa'
import BottomNav from '../components/BottomNav'

export default function Earnings() {
  const [stats, setStats] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')

  useEffect(() => {
    Promise.all([
      api.get('/mechanic/stats'),
      api.get('/mechanic/jobs?status=completed'),
    ]).then(([s, j]) => {
      setStats(s.data.data)
      setJobs(Array.isArray(j.data.data) ? j.data.data : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const now = new Date()

  const todayJobs = jobs.filter(j => new Date(j.createdAt).toDateString() === now.toDateString())
  const weekJobs = jobs.filter(j => {
    const d = new Date(j.createdAt)
    const diff = (now - d) / (1000 * 60 * 60 * 24)
    return diff <= 7
  })
  const monthJobs = jobs.filter(j => {
    const d = new Date(j.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const earn = arr => arr.reduce((s, j) => s + (j.amount || 0), 0)

  const periodData = {
    today:   { jobs: todayJobs,  earn: earn(todayJobs),  label: "Today" },
    week:    { jobs: weekJobs,   earn: earn(weekJobs),   label: "This Week" },
    monthly: { jobs: monthJobs,  earn: earn(monthJobs),  label: "This Month" },
  }

  const current = periodData[period]

  if (loading) return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading earnings...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">

      {/* Header */}
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top,0px))] pb-24 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-b-[2.5rem] shadow-xl shadow-red-300/40 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-36 h-36 bg-white/10 rounded-full" />
        <div className="absolute top-10 -right-2 w-20 h-20 bg-white/5 rounded-full" />
        <h1 className="text-2xl font-black text-white relative z-10">Earnings</h1>
        <p className="text-white/60 text-xs mt-0.5 relative z-10">Track your income & performance</p>
      </div>

      <div className="px-5 -mt-14 relative z-10 space-y-4">

        {/* All-time summary cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Total Earned', value: `₹${stats?.totalEarnings ?? 0}`, icon: <FaWallet className="text-green-400 text-sm" /> },
            { label: 'Total Jobs', value: stats?.totalJobs ?? 0, icon: <FaClipboardList className="text-red-400 text-sm" /> },
            { label: 'Avg Rating', value: (stats?.rating ?? 0).toFixed(1), icon: <FaStar className="text-yellow-400 text-sm" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl p-3.5 shadow-md border border-gray-100 text-center">
              <div className="flex justify-center mb-1.5">{icon}</div>
              <p className="text-gray-900 font-black text-base leading-tight">{value}</p>
              <p className="text-gray-400 text-[9px] uppercase tracking-wider mt-0.5 font-semibold">{label}</p>
            </div>
          ))}
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex gap-1">
          {Object.entries(periodData).map(([key, val]) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${
                period === key
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-sm'
                  : 'text-gray-400'
              }`}>
              {val.label}
            </button>
          ))}
        </div>

        {/* Period Earnings Card */}
        <div className="bg-gradient-to-br from-red-500 to-amber-400 rounded-3xl p-5 shadow-md shadow-red-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs font-semibold">{current.label}'s Earnings</p>
              <p className="text-white font-black text-4xl mt-1">₹{current.earn}</p>
              <p className="text-white/70 text-xs mt-1">{current.jobs.length} job{current.jobs.length !== 1 ? 's' : ''} completed</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <FaWallet className="text-white text-2xl" />
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-800 font-black text-sm">{current.label}'s Jobs</p>
            <span className="text-[10px] text-gray-400 font-semibold">{current.jobs.length} jobs</span>
          </div>

          {current.jobs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
              <FaCalendarAlt className="text-gray-200 text-4xl mx-auto mb-3" />
              <p className="text-gray-500 font-bold text-sm">No jobs {period === 'today' ? 'today' : `this ${period === 'week' ? 'week' : 'month'}`}</p>
              <p className="text-gray-400 text-xs mt-1">Complete jobs to see earnings here</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {current.jobs.map(j => (
                <div key={j._id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm">
                  <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <FaWallet className="text-white text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm font-bold">{j.customer?.name || '—'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <FaMapMarkerAlt className="text-gray-300 text-[9px] flex-shrink-0" />
                      <p className="text-gray-400 text-[10px] truncate">{j.address?.full || '—'}</p>
                    </div>
                    {j.isRated && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <FaStar key={s} className={`text-[9px] ${s <= j.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                        {j.feedback && <p className="text-gray-400 text-[9px] ml-1 italic">"{j.feedback}"</p>}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-green-600 font-black text-sm">+₹{j.amount || 0}</p>
                    <p className="text-gray-300 text-[9px] mt-0.5">
                      {new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
