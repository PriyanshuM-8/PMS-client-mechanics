import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { disconnectSocket } from '../utils/socket'
import {
  FaSignOutAlt, FaWrench, FaMapMarkerAlt, FaStar,
  FaBriefcase, FaPhone, FaChevronRight, FaEdit, FaTimes, FaCheck, FaCamera, FaIdCard
} from 'react-icons/fa'
import { IoMdSync } from 'react-icons/io'
import { MdMyLocation, MdGpsFixed } from 'react-icons/md'
import BottomNav from '../components/BottomNav'

const SKILLS = ['engine', 'puncture', 'battery', 'oil', 'all work']
const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-3.5 py-3 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition text-sm'

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', address: '', experience: '', upiId: '' })
  const [editSkills, setEditSkills] = useState([])
  const [newProfileImage, setNewProfileImage] = useState(null)
  const [newAadharPhoto, setNewAadharPhoto] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [locLoading, setLocLoading] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/mechanic/me'), api.get('/mechanic/stats')])
      .then(([p, s]) => { setProfile(p.data.data); setStats(s.data.data) })
      .catch(console.error)
  }, [])

  const openEdit = () => {
    setEditForm({ name: profile.name || '', address: profile.address || '', experience: profile.experience || '', upiId: profile.upiId || '' })
    setEditSkills(profile.skills || [])
    setNewProfileImage(null)
    setNewAadharPhoto(null)
    setEditError('')
    setShowEdit(true)
  }

  const toggleSkill = (s) => setEditSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const getLiveLocation = () => {
    if (!navigator.geolocation) return setEditError('Geolocation not supported')
    setLocLoading(true)
    setEditError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const a = data.address || {}
          const parts = [
            a.road || a.pedestrian,
            a.neighbourhood || a.suburb,
            a.village || a.town || a.city_district,
            a.city || a.county,
            a.state,
            a.postcode,
          ].filter(Boolean)
          const addr = parts.join(', ') || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          setEditForm(p => ({ ...p, address: addr }))
        } catch {
          setEditForm(p => ({ ...p, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }))
        } finally { setLocLoading(false) }
      },
      () => { setEditError('Could not get location. Allow permission.'); setLocLoading(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSave = async () => {
    if (!editForm.name.trim()) return setEditError('Name is required')
    setSaving(true); setEditError('')
    try {
      const formData = new FormData()
      formData.append('name', editForm.name)
      formData.append('address', editForm.address)
      formData.append('experience', editForm.experience)
      formData.append('upiId', editForm.upiId)
      editSkills.forEach(s => formData.append('skills', s))
      if (newProfileImage) formData.append('profileImage', newProfileImage)
      if (newAadharPhoto) formData.append('aadharPhoto', newAadharPhoto)
      const { data } = await api.patch('/mechanic/me', formData)
      setProfile(data.data)
      setShowEdit(false)
    } catch (err) {
      setEditError(err.response?.data?.message || 'Update failed')
    } finally { setSaving(false) }
  }

  const handleLogout = () => {
    disconnectSocket()
    localStorage.removeItem('mechanic_token')
    localStorage.removeItem('mechanic_user')
    navigate('/login')
  }

  if (!profile) return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading profile...</p>
    </div>
  )

  const initials = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-28">

      {/* Hero */}
      <div className="px-5 pt-12 pb-28 bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-b-[2.5rem] shadow-xl shadow-red-300/40 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-36 h-36 bg-white/10 rounded-full" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-2xl font-black text-white">My Profile</h1>
            <p className="text-white/60 text-xs mt-0.5">Your mechanic account</p>
          </div>
          <button onClick={openEdit}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-2 rounded-xl text-white text-xs font-bold active:scale-95 transition">
            <FaEdit className="text-sm" /> Edit Profile
          </button>
        </div>
      </div>

      <div className="px-5 -mt-20 relative z-10 space-y-4">

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-gray-100 flex-shrink-0">
              {profile.profileImage
                ? <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-red-500 to-amber-400 flex items-center justify-center text-white font-black text-xl">{initials}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-xl text-gray-900 leading-tight">{profile.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <FaPhone className="text-gray-400 text-[10px]" />
                <p className="text-gray-400 text-sm">{profile.phone}</p>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full text-[10px] font-black">
                  <FaStar className="text-amber-400 text-[9px]" />
                  {profile.rating ? profile.rating.toFixed(1) : 'New'}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${profile.isAvailable ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                  {profile.isAvailable ? '● Online' : '○ Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[
              { label: 'Jobs Done', value: stats?.totalJobs ?? 0 },
              { label: 'Total Earned', value: `₹${stats?.totalEarnings ?? 0}` },
              { label: 'Experience', value: `${profile.experience}yr` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center px-2">
                <p className="text-gray-900 font-black text-lg leading-tight">{value}</p>
                <p className="text-gray-400 text-[9px] uppercase tracking-wider mt-0.5 font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          {[
            { icon: <FaWrench className="text-red-400 text-sm" />, bg: 'bg-red-50', label: 'Skills', value: profile.skills?.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') || 'Not set' },
            { icon: <FaMapMarkerAlt className="text-blue-400 text-sm" />, bg: 'bg-blue-50', label: 'Service Area', value: profile.address || 'Not specified' },
            { icon: <FaBriefcase className="text-amber-400 text-sm" />, bg: 'bg-amber-50', label: 'Experience', value: `${profile.experience} Year${profile.experience !== 1 ? 's' : ''}` },
            { icon: <FaIdCard className="text-purple-400 text-sm" />, bg: 'bg-purple-50', label: 'UPI ID', value: profile.upiId || 'Not set' },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <div className="flex items-center gap-4 px-5 py-4">
                <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{item.label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              </div>
              {i < arr.length - 1 && <div className="h-px bg-gray-50 mx-5" />}
            </div>
          ))}
        </div>

        {/* Wallet */}
        <button onClick={() => navigate('/wallet')}
          className="w-full flex items-center justify-between bg-white shadow-sm p-4 rounded-2xl border border-gray-100 active:scale-[0.98] transition-all mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <span className="text-orange-500 text-sm font-bold">₹</span>
            </div>
            <span className="font-bold text-sm text-gray-700">My Wallet</span>
          </div>
          <FaChevronRight className="text-gray-300 text-xs" />
        </button>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-between bg-red-50 p-4 rounded-2xl border border-red-100 active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <FaSignOutAlt className="text-red-500 text-sm" />
            </div>
            <span className="font-bold text-sm text-red-600">Logout</span>
          </div>
          <FaChevronRight className="text-red-300 text-xs" />
        </button>

        <p className="text-center text-[10px] text-gray-300 font-medium pb-2">PetroCareX Mechanics v1.0</p>
      </div>

      {/* Edit Sheet */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEdit(false)} />
          <div className="relative bg-white rounded-t-[2rem] max-h-[85vh] flex flex-col shadow-2xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50 flex-shrink-0">
              <p className="text-gray-900 font-black text-sm">Edit Profile</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !editForm.name.trim()}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setShowEdit(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <FaTimes className="text-gray-500 text-xs" />
                </button>
              </div>
            </div>

            {/* Scrollable fields */}
            <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="text-gray-500 text-xs font-bold mb-1.5 block">Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your name" className={inputCls} />
              </div>

              <div>
                <label className="text-gray-500 text-xs font-bold mb-1.5 block">UPI ID</label>
                <input value={editForm.upiId} onChange={e => setEditForm(p => ({ ...p, upiId: e.target.value }))}
                  placeholder="e.g. yourname@upi" className={inputCls} />
              </div>

              <div>
                <label className="text-gray-500 text-xs font-bold mb-1.5 block">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map(skill => (
                    <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize ${
                        editSkills.includes(skill)
                          ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white border-transparent shadow-sm'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-500 text-xs font-bold mb-1.5 block">Experience (Years)</label>
                <input type="number" min="0" value={editForm.experience}
                  onChange={e => setEditForm(p => ({ ...p, experience: e.target.value }))}
                  placeholder="Years of experience" className={inputCls} />
              </div>

              <div>
                <label className="text-gray-500 text-xs font-bold mb-1.5 block">Service Area / Address</label>
                <div className="flex gap-2">
                  <input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                    placeholder="City, area or full address" className={`${inputCls} flex-1`} />
                  <button type="button" onClick={getLiveLocation} disabled={locLoading}
                    className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center transition ${
                      locLoading
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                    title="Use live location">
                    {locLoading
                      ? <IoMdSync className="animate-spin text-gray-400 text-base" />
                      : <MdGpsFixed className="text-blue-500 text-lg" />}
                  </button>
                </div>
                {locLoading && (
                  <p className="text-blue-500 text-[10px] mt-1 flex items-center gap-1">
                    <MdMyLocation className="text-xs" /> Getting your location...
                  </p>
                )}
              </div>

              <div>
                <label className="text-gray-500 text-xs font-bold mb-1.5 block">Profile Photo</label>
                <label className={`flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  newProfileImage ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-red-300'
                }`}>
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    {newProfileImage
                      ? <img src={URL.createObjectURL(newProfileImage)} alt="" className="w-full h-full object-cover" />
                      : profile.profileImage
                        ? <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                        : <FaCamera className="text-gray-400 text-sm" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-600 truncate">{newProfileImage ? newProfileImage.name : 'Change profile photo'}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG supported</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setNewProfileImage(e.target.files[0] || null)} />
                </label>
              </div>

              <div>
                <label className="text-gray-500 text-xs font-bold mb-1.5 block">Aadhar Photo</label>
                <label className={`flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  newAadharPhoto ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-red-300'
                }`}>
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                    {newAadharPhoto
                      ? <img src={URL.createObjectURL(newAadharPhoto)} alt="" className="w-full h-full object-cover" />
                      : <FaIdCard className="text-gray-400 text-sm" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-600 truncate">{newAadharPhoto ? newAadharPhoto.name : 'Update aadhar photo'}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG supported</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setNewAadharPhoto(e.target.files[0] || null)} />
                </label>
              </div>
            </div>

            {/* Fixed Footer — always visible */}
            <div className="px-5 pb-6 pt-3 border-t border-gray-100 flex-shrink-0 bg-white">
              {editError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
                  <p className="text-red-500 text-xs text-center font-semibold">{editError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEdit(false)}
                  disabled={saving}
                  className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm disabled:opacity-50 active:scale-[0.98] transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !editForm.name.trim()}
                  className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-sm shadow-lg shadow-red-200/60 disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                  {saving
                    ? <><IoMdSync className="animate-spin text-base" /> Saving...</>
                    : <><FaCheck className="text-sm" /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
