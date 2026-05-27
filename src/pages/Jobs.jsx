import { useEffect, useState } from 'react'
import api from '../utils/api'
import BottomNav from '../components/BottomNav'

const statusConfig = {
  assigned:    { label: 'Assigned',    cls: 'bg-purple-50 text-purple-600 border-purple-200' },
  in_progress: { label: 'In Progress', cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  completed:   { label: 'Completed',   cls: 'bg-green-50 text-green-600 border-green-200' },
  cancelled:   { label: 'Cancelled',   cls: 'bg-red-50 text-red-500 border-red-200' },
}

const filters = ['all', 'assigned', 'in_progress', 'completed', 'cancelled']

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/mechanic/jobs')
      .then(({ data }) => setJobs(Array.isArray(data.data) ? data.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-6 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-b-[2.5rem] shadow-xl shadow-blue-300/40">
        <h1 className="text-2xl font-black text-white tracking-tight">My Jobs</h1>
        <p className="text-white/60 text-xs mt-0.5">All assigned & completed jobs</p>
        <div className="flex gap-1.5 mt-4 overflow-x-auto pb-0.5">
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition-all capitalize ${
                filter === f ? 'bg-white text-blue-600 shadow-sm' : 'bg-white/20 text-white'
              }`}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm mt-2">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <i className="ri-tools-line text-blue-400 text-2xl" />
            </div>
            <p className="text-gray-700 font-bold text-sm">No jobs found</p>
            <p className="text-gray-400 text-xs mt-1">Your job history will appear here</p>
          </div>
        ) : (
          filtered.map(j => {
            const s = statusConfig[j.status] || statusConfig.assigned
            return (
              <div key={j._id} className="bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                    <i className="ri-tools-line text-white text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                      <span className="text-gray-300 text-[9px] font-mono">#{j._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <i className="ri-user-line text-gray-400 text-[10px]" />
                      <p className="text-gray-900 text-xs font-bold">{j.customer?.name || '—'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <i className="ri-map-pin-line text-red-400 text-[10px]" />
                      <p className="text-gray-400 text-[10px] truncate">{j.address?.full}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <i className="ri-gas-station-line text-blue-400 text-[10px]" />
                      <p className="text-gray-400 text-[10px]">{j.pump?.pumpName || '—'}</p>
                    </div>
                    {j.serviceType === 'mechanic' && j.workDetails?.description && (
                      <div className="flex items-start gap-1.5 mt-1">
                        <i className="ri-file-text-line text-gray-400 text-[10px] mt-0.5" />
                        <p className="text-gray-400 text-[10px]">{j.workDetails.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {j.amount > 0 && <p className="text-blue-600 font-black text-sm">₹{j.amount}</p>}
                    <p className="text-gray-300 text-[9px] mt-0.5">
                      {new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>

                {/* OTP for active job */}
                {j.status === 'assigned' && j.completionOTP && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2">
                      <i className="ri-shield-keyhole-line text-blue-500 text-sm" />
                      <div>
                        <p className="text-blue-700 text-[10px] font-bold">Completion OTP</p>
                        <p className="text-blue-900 font-black text-lg tracking-[0.3em]">{j.completionOTP}</p>
                      </div>
                      <p className="text-blue-400 text-[9px] ml-auto">Share with pump admin</p>
                    </div>
                  </div>
                )}

                {/* Rating */}
                {j.status === 'completed' && j.isRated && (
                  <div className="mt-2 flex items-center gap-1">
                    {[1,2,3,4,5].map(star => (
                      <i key={star} className={`ri-star-fill text-sm ${star <= j.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                    {j.feedback && <p className="text-gray-400 text-[10px] ml-1">"{j.feedback}"</p>}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      <BottomNav />
    </div>
  )
}
