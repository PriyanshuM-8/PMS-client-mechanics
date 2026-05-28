import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { FaWrench, FaMapMarkerAlt, FaCheckCircle, FaCamera, FaIdCard } from 'react-icons/fa'
import { MdWarning, MdMyLocation } from 'react-icons/md'
import { IoMdSync } from 'react-icons/io'

const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl px-4 py-4 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all text-sm font-medium'
const SKILLS = ['engine', 'puncture', 'battery', 'oil', 'all work']

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({ name: '', phone: '', experience: '', address: '', upiId: '' })
  const [skills, setSkills] = useState([])
  const [profileImage, setProfileImage] = useState(null)
  const [aadharPhoto, setAadharPhoto] = useState(null)
  const [location, setLocation] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }
  const toggleSkill = (s) => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const getLocation = () => {
    if (!navigator.geolocation) return setError('Geolocation not supported')
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false) },
      () => setLocLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.phone.length !== 10) return setError('Enter valid 10-digit mobile number')
    if (!form.upiId.trim()) return setError('Enter your UPI ID')
    if (skills.length === 0) return setError('Select at least one skill')
    if (!aadharPhoto) return setError('Aadhar photo is required')
    setLoading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('phone', form.phone)
      fd.append('upiId', form.upiId)
      fd.append('experience', form.experience || 0)
      fd.append('address', form.address)
      skills.forEach(s => fd.append('skills', s))
      fd.append('aadharPhoto', aadharPhoto)
      if (profileImage) fd.append('profileImage', profileImage)
      if (location) { fd.append('lat', location.lat); fd.append('lng', location.lng) }

      await api.post('/auth/register/mechanic', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const { data } = await api.post('/auth/login/phone', { phone: form.phone })
      if (data.devOtp) setDevOtp(data.devOtp)
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const handleVerify = async () => {
    if (otp.length !== 6) return setError('Enter 6-digit OTP')
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/verify-otp', { identifier: form.phone, otp, method: 'sms' })
      localStorage.setItem('mechanic_token', data.token)
      localStorage.setItem('mechanic_user', JSON.stringify(data.user))
      window.location.href = '/'
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  const ImagePicker = ({ label, icon: Icon, file, onChange, required }) => (
    <div>
      <label className="text-gray-500 text-xs font-bold mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <label className={`flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
        file ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-red-300 hover:bg-red-50/30'
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${file ? 'bg-green-100' : 'bg-gray-100'}`}>
          {file
            ? <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 rounded-xl object-cover" />
            : <Icon className={`text-base ${file ? 'text-green-500' : 'text-gray-400'}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold truncate ${file ? 'text-green-700' : 'text-gray-500'}`}>
            {file ? file.name : `Tap to upload ${label}`}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG supported</p>
        </div>
        {file && <FaCheckCircle className="text-green-500 text-sm flex-shrink-0" />}
        <input type="file" accept="image/*" className="hidden" onChange={e => onChange(e.target.files[0] || null)} />
      </label>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="relative h-[200px] bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-b-[3rem] shadow-[0_20px_60px_rgba(239,68,68,0.35)] overflow-hidden flex-shrink-0">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-300/20 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
            <img src="/Images/Logo.png" alt="logo" className="w-10 h-10 object-contain"
              onError={(e) => { e.target.style.display = 'none' }} />
          </div>
          <h1 className="text-white text-xl font-black mt-3 tracking-wide">
            {step === 'form' ? 'Join as Mechanic' : 'Verify Number'}
          </h1>
          <p className="text-white/70 text-xs mt-1">
            {step === 'form' ? 'Apply to our mechanic network' : `OTP sent to +91 ${form.phone}`}
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 -mt-4 pb-8 flex flex-col">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.2rem] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-white/60 p-5 flex flex-col">

          {step === 'form' && (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Create Account</h2>
                <p className="text-gray-400 text-xs mt-1">Fill in your details to apply</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" name="name" placeholder="Full Name"
                  value={form.name} onChange={handleChange} className={inputCls} required />
                  
                <input type="text" name="upiId" placeholder="UPI ID (e.g. yourname@upi)"
                  value={form.upiId} onChange={handleChange} className={inputCls} required />

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center">
                      <span className="text-red-500 text-[11px] font-bold">+91</span>
                    </div>
                  </div>
                  <input type="tel" name="phone" placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => { setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }); setError('') }}
                    maxLength={10}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl pl-16 pr-4 py-4 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all text-sm font-medium"
                    required />
                </div>

                <div>
                  <p className="text-gray-500 text-xs font-bold mb-1.5 px-1">Skills <span className="text-red-400">*</span></p>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map(skill => (
                      <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize ${
                          skills.includes(skill)
                            ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white border-transparent shadow-sm'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input type="number" name="experience" placeholder="Experience (Yrs)"
                    value={form.experience} onChange={handleChange} className={inputCls} min="0" />
                  <input type="text" name="address" placeholder="City / Area"
                    value={form.address} onChange={handleChange} className={inputCls} />
                </div>

                {/* Photo Uploads */}
                <ImagePicker label="Aadhar Photo" icon={FaIdCard} file={aadharPhoto}
                  onChange={setAadharPhoto} required />
                <ImagePicker label="Profile Photo" icon={FaCamera} file={profileImage}
                  onChange={setProfileImage} required={false} />

                <button type="button" onClick={getLocation} disabled={locLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all ${
                    location ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500'
                  }`}>
                  {locLoading ? <><IoMdSync className="animate-spin" /> Getting location...</>
                    : location ? <><FaMapMarkerAlt className="text-green-500" /> Location captured ✓</>
                    : <><MdMyLocation /> Add My Location (Optional)</>}
                </button>

                {error && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
                    <MdWarning className="text-amber-600 text-base flex-shrink-0 mt-0.5" />
                    <p className="text-amber-700 text-xs">{error}</p>
                  </div>
                )}

                <button type="submit"
                  disabled={loading || form.phone.length !== 10 || skills.length === 0 || !aadharPhoto}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white font-bold text-sm shadow-xl shadow-red-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  {loading
                    ? <><IoMdSync className="animate-spin text-lg" /> Registering...</>
                    : <><FaWrench className="text-sm" /> Register & Get OTP</>}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-4">
                Already a partner? <Link to="/login" className="font-bold text-red-500">Log in</Link>
              </p>
            </>
          )}

          {step === 'otp' && (
            <div className="flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-green-200 mb-4">
                <FaCheckCircle className="text-white text-xl" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Registration Successful!</h2>
              <p className="text-gray-400 text-sm mt-1 mb-5">Enter the OTP sent to +91 {form.phone}</p>

              {devOtp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
                  <p className="text-yellow-700 text-xs font-bold text-center">Test OTP</p>
                  <p className="text-2xl tracking-[0.4em] font-black text-yellow-900 text-center">{devOtp}</p>
                </div>
              )}

              <input type="text" placeholder="● ● ● ● ● ●" value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                maxLength={6}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl px-4 py-5 focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all text-center tracking-[0.6em] text-2xl font-black mb-3" />

              {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}

              <button type="button" onClick={handleVerify} disabled={loading || otp.length !== 6}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-sm shadow-xl shadow-green-200 disabled:opacity-60 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                {loading ? <><IoMdSync className="animate-spin text-lg" /> Verifying...</> : 'Verify & Open Dashboard'}
              </button>

              <button type="button" onClick={() => { setStep('form'); setOtp(''); setError('') }}
                className="w-full text-sm text-gray-400 py-3 text-center mt-1">
                ← Back to form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
