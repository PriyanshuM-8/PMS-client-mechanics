import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { getSocket } from '../utils/socket'
import {
  FaPhoneAlt, FaWhatsapp, FaMapMarkerAlt, FaArrowLeft,
  FaCheckCircle, FaWrench, FaLocationArrow, FaPlus, FaTrash
} from 'react-icons/fa'
import { MdDirectionsCar } from 'react-icons/md'
import { IoMdSync } from 'react-icons/io'
import Swal from 'sweetalert2'

const statusMap = {
  assigned:    { label: 'Assigned',    cls: 'bg-purple-50 text-purple-600 border-purple-200' },
  in_progress: { label: 'On the Way', cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  reached:     { label: 'Arrived',     cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  completed:   { label: 'Completed',   cls: 'bg-green-50 text-green-600 border-green-200' },
}

const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-3.5 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition text-sm'

export default function ActiveJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(false)

  // Work & Payment
  const [labourCharge, setLabourCharge] = useState('')
  const [parts, setParts] = useState([]) // [{partName, price}]
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [workError, setWorkError] = useState('')

  const fetchJob = () => {
    api.get('/mechanic/jobs')
      .then(res => {
        const found = res.data.data.find(j => j._id === id)
        if (found) setJob(found)
      })
      .catch(console.error)
  }

  useEffect(() => {
    fetchJob()
    const socket = getSocket()
    if (!socket) return
    const onUpdate = (data) => { if (data.bookingId?.toString() === id) fetchJob() }
    socket.on('booking:update', onUpdate)
    return () => socket.off('booking:update', onUpdate)
  }, [id])

  // Calculate total
  const partsTotal = parts.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0)
  const labour = parseFloat(labourCharge) || 0
  const totalAmount = partsTotal + labour

  const addPart = () => setParts(p => [...p, { partName: '', price: '' }])
  const removePart = (i) => setParts(p => p.filter((_, idx) => idx !== i))
  const updatePart = (i, field, val) => setParts(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const handleStart = async () => {
    setLoading(true)
    try {
      await api.patch(`/bookings/mechanic/${id}/start`)
      setJob(j => ({ ...j, status: 'in_progress' }))
    } catch (err) {
      alert(err.response?.data?.message || 'Could not start job')
    } finally { setLoading(false) }
  }

  const handleArrived = async () => {
    setLoading(true)
    try {
      await api.patch(`/bookings/mechanic/${id}/arrived`)
      setJob(j => ({ ...j, status: 'reached' }))
    } catch (err) {
      alert(err.response?.data?.message || 'Could not mark arrived')
    } finally { setLoading(false) }
  }

  const handleCompleteJob = async () => {
    if (totalAmount <= 0) return setWorkError('Please enter labour charge or add parts')
    if (!paymentMethod) return setWorkError('Please select a payment method')
    const invalidPart = parts.find(p => !p.partName.trim() || !p.price)
    if (invalidPart) return setWorkError('Please fill all part name and price fields')
    setWorkError('')
    setSubmitting(true)
    try {
      const res = await api.patch(`/bookings/mechanic/${id}/complete`, {
        amount: totalAmount,
        paymentMethod,
        workDetails: {
          partsChanged: parts.map(p => ({ partName: p.partName.trim(), price: parseFloat(p.price) || 0 })),
          labourCharge: labour,
          totalAmount,
        }
      })
      fetchJob()
      
      const trialMsg = res.data?.data?.trialMessage;
      Swal.fire({
        icon: 'success',
        title: 'Job Completed!',
        text: trialMsg || 'Earnings have been added to your wallet.',
        timer: trialMsg ? undefined : 2000,
        showConfirmButton: !!trialMsg
      });
    } catch (err) {
      setWorkError(err.response?.data?.message || 'Failed to complete job')
    } finally { setSubmitting(false) }
  }

  if (!job) return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading job details...</p>
    </div>
  )

  const status = statusMap[job.status] || statusMap.assigned
  const mapsUrl = job.address?.location?.coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${job.address.location.coordinates[1]},${job.address.location.coordinates[0]}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address?.full || '')}`

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-16">
      {/* Header */}
      <div className="px-5 pt-12 pb-8 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-b-[2.5rem] shadow-xl shadow-red-300/40 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center border border-white/20 mb-5 active:scale-95 transition-all">
          <FaArrowLeft className="text-white text-sm" />
        </button>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">Active Job</p>
            <h2 className="font-black text-2xl text-white mt-0.5">Service Details</h2>
            <p className="text-white/50 text-[10px] mt-1 font-mono">#{id.slice(-8).toUpperCase()}</p>
          </div>
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${status.cls}`}>{status.label}</span>
        </div>
      </div>

      <div className="px-5 -mt-4 relative z-10 space-y-4">
        {/* Customer Card */}
        <div className="bg-white rounded-3xl p-5 shadow-md border border-gray-100">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-amber-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xl">{job.customer?.name?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <h3 className="font-black text-base text-gray-900 leading-tight">{job.customer?.name}</h3>
                <p className="text-gray-400 text-sm">{job.customer?.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${job.customer?.phone}`} className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 active:scale-95 transition-all">
                <FaPhoneAlt className="text-blue-500 text-sm" />
              </a>
              <a href={`https://wa.me/91${job.customer?.phone}`} target="_blank" rel="noreferrer" className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-sm shadow-green-200 active:scale-95 transition-all">
                <FaWhatsapp className="text-white text-lg" />
              </a>
            </div>
          </div>
          <div className="space-y-3">
            {job.workDetails?.vehicleName && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MdDirectionsCar className="text-blue-500 text-base" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Vehicle</p>
                  <p className="text-sm text-gray-800 font-semibold">{job.workDetails.vehicleName}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FaWrench className="text-orange-400 text-sm" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Issue</p>
                <p className="text-sm text-gray-800 font-semibold mt-0.5">{job.workDetails?.description || 'Not specified'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FaMapMarkerAlt className="text-red-400 text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Location</p>
                <p className="text-sm text-gray-800 font-semibold mt-0.5 leading-snug">{job.address?.full}</p>
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-amber-500 px-3 py-1.5 rounded-full shadow-sm">
                  <FaLocationArrow className="text-[10px]" /> Open in Maps
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Start Trip */}
        {job.status === 'assigned' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-800 font-black text-sm mb-1">Ready to go?</p>
            <p className="text-gray-400 text-xs mb-4">Press Start Trip when heading to the customer location.</p>
            <button onClick={handleStart} disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl shadow-lg shadow-blue-300/40 font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60">
              {loading ? <><IoMdSync className="animate-spin" /> Starting...</> : <><FaLocationArrow /> Start Trip</>}
            </button>
          </div>
        )}

        {/* Arrived Button */}
        {job.status === 'in_progress' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-800 font-black text-sm mb-1">Reached the location?</p>
            <p className="text-gray-400 text-xs mb-4">Press Arrived once you reach the customer. They will be notified instantly.</p>
            <button onClick={handleArrived} disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-4 rounded-2xl shadow-lg shadow-purple-300/40 font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60">
              {loading ? <><IoMdSync className="animate-spin" /> Updating...</> : <><FaMapMarkerAlt /> I've Arrived</>}
            </button>
          </div>
        )}

        {/* Complete Job Form */}
        {job.status === 'reached' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <FaWrench className="text-orange-500 text-base" />
              <p className="text-gray-800 font-black text-sm">Complete Job</p>
            </div>

            {/* Parts Changed */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-gray-500 text-xs font-bold">Parts Changed</label>
                <button onClick={addPart} className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg hover:bg-orange-100 transition">
                  <FaPlus className="text-[9px]" /> Add Part
                </button>
              </div>
              {parts.length === 0 && (
                <p className="text-gray-300 text-xs text-center py-3 border border-dashed border-gray-200 rounded-xl">No parts added</p>
              )}
              <div className="space-y-2">
                {parts.map((part, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={part.partName}
                      onChange={e => updatePart(i, 'partName', e.target.value)}
                      placeholder="Part name"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-400 transition"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                      <input
                        type="number"
                        value={part.price}
                        onChange={e => updatePart(i, 'price', e.target.value)}
                        placeholder="0"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-6 pr-2 py-2.5 text-xs focus:outline-none focus:border-orange-400 transition"
                      />
                    </div>
                    <button onClick={() => removePart(i)} className="w-8 h-8 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FaTrash className="text-red-400 text-xs" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Labour Charge */}
            <div className="mb-4">
              <label className="text-gray-500 text-xs font-bold mb-1.5 block">Labour Charge (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input type="number" value={labourCharge}
                  onChange={e => setLabourCharge(e.target.value)}
                  placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-7 pr-3 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition" />
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-2">
              {parts.map((p, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-500">
                  <span>{p.partName || `Part ${i + 1}`}</span>
                  <span>₹{parseFloat(p.price) || 0}</span>
                </div>
              ))}
              {labour > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Labour Charge</span>
                  <span>₹{labour}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-black text-sm">Total Amount</span>
                <span className="text-red-500 font-black text-xl">₹{totalAmount}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="text-gray-500 text-xs font-bold mb-2 block">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {['cash', 'upi'].map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`py-3 rounded-xl font-bold text-sm border-2 transition capitalize ${paymentMethod === m ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400 bg-white'}`}>
                    {m === 'cash' ? 'Cash' : 'UPI'}
                  </button>
                ))}
              </div>
            </div>

            {/* UPI QR */}
            {paymentMethod === 'upi' && totalAmount > 0 && (
              <div className="bg-blue-50 p-4 rounded-2xl flex flex-col items-center mb-4">
                <p className="text-blue-800 font-bold text-sm mb-2">Ask customer to scan and pay</p>
                <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-100">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${job.mechanic?.upiId || 'demo@upi'}&pn=${job.mechanic?.name || 'Mechanic'}&am=${totalAmount}`)}`}
                    alt="UPI QR Code" className="w-40 h-40 object-contain"
                  />
                </div>
                <p className="text-blue-600 font-black text-xl mt-3">₹{totalAmount}</p>
              </div>
            )}

            {workError && <p className="text-red-500 text-xs text-center font-semibold mb-3">{workError}</p>}

            <button onClick={handleCompleteJob} disabled={submitting || !paymentMethod || totalAmount <= 0}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl shadow-lg shadow-green-300/40 font-black text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50">
              {submitting ? <><IoMdSync className="animate-spin" /> Completing...</> : <><FaCheckCircle /> Complete Job — ₹{totalAmount}</>}
            </button>
          </div>
        )}

        {/* Completed */}
        {job.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaCheckCircle className="text-green-500 text-3xl" />
            </div>
            <h3 className="text-green-700 font-black text-lg">Job Completed!</h3>
            <p className="text-green-600 text-sm mt-1">Great work! Earnings have been added to your wallet.</p>
            {job.amount > 0 && <p className="text-green-800 font-black text-2xl mt-2">+₹{job.amount}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
