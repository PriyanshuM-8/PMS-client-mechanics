import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { FaWrench, FaMapMarkerAlt, FaRegCalendarAlt, FaStar } from 'react-icons/fa'
import BottomNav from '../components/BottomNav'

const statusConfig = {
  pending:     { label: 'Pending',     cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  assigned:    { label: 'Assigned',    cls: 'bg-purple-50 text-purple-600 border-purple-200' },
  in_progress: { label: 'In Progress', cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  completed:   { label: 'Completed',   cls: 'bg-green-50 text-green-600 border-green-200' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-50 text-red-500 border-red-200' },
}

const filters = ['all', 'active', 'completed', 'cancelled']

export default function MyJobs() {
  const [jobs, setJobs] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/mechanic/jobs')
      .then(res => setJobs(Array.isArray(res.data.data) ? res.data.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = jobs.filter(j => {
    if (filter === 'all') return true
    if (filter === 'active') return ['assigned', 'in_progress'].includes(j.status)
    return j.status === filter
  })

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">

      {/* Header */}
      <div className="px-5 pt-12 pb-20 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-b-[2.5rem] shadow-xl shadow-red-300/40 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <h1 className="text-2xl font-black text-white relative z-10">Job History</h1>
        <p className="text-white/60 text-xs mt-0.5 relative z-10">{jobs.length} total assignments</p>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 -mt-5 relative z-10 mb-4">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-1.5 flex gap-1">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-bold capitalize transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-sm'
                  : 'text-gray-400'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading jobs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <FaWrench className="text-gray-300 text-2xl" />
            </div>
            <p className="text-gray-700 font-bold text-sm">No jobs found</p>
            <p className="text-gray-400 text-xs mt-1">Try a different filter</p>
          </div>
        ) : (
          filtered.map(job => {
            const s = statusConfig[job.status] || statusConfig.pending
            const isActive = ['assigned', 'in_progress'].includes(job.status)
            return (
              <Link to={isActive ? `/job/${job._id}` : '#'} key={job._id}
                className="block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform">
                {isActive && <div className="h-1 bg-gradient-to-r from-red-500 to-amber-400" />}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-gradient-to-br from-red-500 to-amber-400' : 'bg-gray-100'}`}>
                        <FaWrench className={`text-sm ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-sm">{job.customer?.name || '—'}</p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${s.cls}`}>{s.label}</span>
                      </div>
                    </div>
                    <p className="font-black text-green-600 text-sm flex-shrink-0">₹{job.amount || 0}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-red-400 text-[10px] mt-0.5 flex-shrink-0" />
                      <p className="text-gray-400 text-[11px] line-clamp-1">{job.address?.full || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaRegCalendarAlt className="text-gray-300 text-[10px] flex-shrink-0" />
                      <p className="text-gray-400 text-[11px]">
                        {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  {job.status === 'completed' && job.isRated && (
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5">
                      {[1,2,3,4,5].map(star => (
                        <FaStar key={star} className={`text-sm ${star <= job.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                      ))}
                      {job.feedback && <p className="text-gray-400 text-[10px] ml-1 italic">"{job.feedback}"</p>}
                    </div>
                  )}

                  {isActive && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <p className="text-red-500 text-xs font-bold">Tap to view active job →</p>
                    </div>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
      <BottomNav />
    </div>
  )
}
