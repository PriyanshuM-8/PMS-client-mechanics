import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { FaMobileAlt, FaChevronLeft } from 'react-icons/fa'
import { MdWarning } from 'react-icons/md'
import { IoMdSync } from 'react-icons/io'

const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition text-sm'

export default function Login() {
  const navigate = useNavigate()
  const [step, setStep] = useState('input')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async () => {
    if (phone.length !== 10) return setError('Enter valid 10-digit number')
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login/phone', { phone, requestedRole: 'mechanic' })
      setIdentifier(data.identifier || phone)
      if (data.devOtp) setDevOtp(data.devOtp)
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  const handleVerify = async () => {
    if (otp.length !== 6) return setError('Enter 6-digit OTP')
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { identifier, otp, method: 'sms', requestedRole: 'mechanic' })
      localStorage.setItem('mechanic_token', data.token)
      localStorage.setItem('mechanic_user', JSON.stringify(data.user))
      window.location.href = '/'
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Hero ── */}
     <div className="relative h-[250px] bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-b-[3rem] shadow-[0_20px_60px_rgba(239,68,68,0.35)] overflow-hidden">

        {/* Blur Circle */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-300/20 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">

          {/* Logo */}
          <div className="w-24 h-24 rounded-[2rem] bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">

            <img
              src="/Images/Logo.png"
              alt="logo"
              className="w-14 h-14 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>

          {/* Title */}
          <h1 className="text-white text-2xl font-black mt-5 tracking-wide">
            Mechanic Panel
          </h1>

          <p className="text-white/70 text-sm mt-1 max-w-[260px] leading-relaxed">
            Manage service requests, accept nearby jobs and grow your earnings
          </p>
        </div>
      </div>

      {/* ── Card ── */}
 <div className="flex-1 px-5 -mt-4 pb-8 flex flex-col">
  <div className="bg-white/95 backdrop-blur-xl rounded-[2.2rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white/60 p-6 flex-1 flex flex-col overflow-hidden">

    {/* Top Glow */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 blur-3xl opacity-40 rounded-full" />

    {step === 'input' && (
      <div className="relative z-10 flex flex-col flex-1">

        {/* Heading */}
        <div className="mb-7 ">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Welcome Back
          </h2>

          <p className="text-gray-400 text-sm mt-1 leading-relaxed">
            Login to manage bookings, jobs & customer requests
          </p>
        </div>

        {/* Phone Input */}
        <div className="space-y-3">

          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
              <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-red-500 text-[11px] font-bold">+91</span>
              </div>
            </div>

            <input
              type="tel"
              placeholder="Enter mobile number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                setError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              maxLength={10}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl pl-16 pr-4 py-4 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all text-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <p className="text-gray-400 text-xs">
              OTP will be sent securely via SMS
            </p>
          </div>

        </div>

        {/* Error Box */}
        {error && (
          <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <MdWarning className="text-amber-600 text-lg" />
              </div>

              <div className="flex-1">
                <p className="text-amber-800 text-sm font-bold">
                  {error.toLowerCase().includes('not approved')
                    ? 'Approval Pending'
                    : 'Login Issue'}
                </p>

                <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                  {error}
                </p>

                {!error.toLowerCase().includes('not approved') && (
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 mt-3 bg-gradient-to-r from-red-500 to-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-red-100 active:scale-95 transition-all"
                  >
                    Apply Now
                  </Link>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Button */}
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loading || phone.length !== 10}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white font-bold text-sm shadow-xl shadow-red-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <IoMdSync className="animate-spin text-lg" />
              Sending OTP...
            </>
          ) : (
            <>
              <FaMobileAlt className="text-sm" />
              Continue with OTP
            </>
          )}
        </button>

        {/* Bottom Link */}
        <p className="text-center text-sm text-gray-400 mt-5">
          New mechanic?{' '}
          <Link
            to="/register"
            className="font-bold text-red-500 hover:text-red-600 transition"
          >
            Apply Now
          </Link>
        </p>

      </div>
    )}

    {/* OTP SECTION */}
    {step === 'otp' && (
      <div className="relative z-10 flex flex-col flex-1">

        {/* Heading */}
        <div className="mb-7">

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-200 mb-4">
            <FaMobileAlt className="text-white text-xl" />
          </div>

          <h2 className="text-2xl font-black text-gray-900">
            Verify OTP
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Enter the 6-digit code sent to your mobile
          </p>
        </div>

        {/* OTP Info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4 mb-5">

          <div className="flex items-start gap-3">

            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <FaMobileAlt className="text-green-600 text-sm" />
            </div>

            <div>
              <p className="text-sm font-bold text-green-700">
                OTP Sent Successfully
              </p>

              <p className="text-xs text-green-600 mt-1">
                +91 {phone} · Valid for 10 minutes
              </p>
            </div>

          </div>

        </div>

        {/* Dev OTP */}
        {devOtp && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
            <p className="text-yellow-700 text-xs font-bold">
              Test OTP
            </p>

            <p className="text-2xl tracking-[0.4em] font-black text-yellow-900 mt-2 text-center">
              {devOtp}
            </p>
          </div>
        )}

        {/* OTP Input */}
        <input
          type="text"
          placeholder="● ● ● ● ● ●"
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
            setError('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          maxLength={6}
          className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl px-4 py-5 focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all text-center tracking-[0.6em] text-2xl font-black"
        />

        {error && (
          <p className="text-red-500 text-sm mt-3 text-center">
            {error}
          </p>
        )}

        <div className="flex-1" />

        {/* Verify Button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm shadow-xl shadow-green-200 disabled:opacity-60 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <IoMdSync className="animate-spin text-lg" />
              Verifying...
            </>
          ) : (
            'Verify & Login'
          )}
        </button>

        {/* Back */}
        <button
          type="button"
          onClick={() => {
            setStep('input')
            setOtp('')
            setDevOtp('')
            setError('')
          }}
          className="w-full text-sm text-gray-400 py-3 flex items-center justify-center gap-1 mt-2 hover:text-gray-600 transition"
        >
          <FaChevronLeft className="text-xs" />
          Back
        </button>

      </div>
    )}

  </div>
</div>
    </div>
  )
}
