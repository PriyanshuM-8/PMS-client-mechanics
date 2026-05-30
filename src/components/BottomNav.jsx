import { NavLink } from 'react-router-dom'
import { RiHome4Line, RiBriefcase4Line, RiUserLine, RiMoneyRupeeCircleLine, RiWallet3Line } from 'react-icons/ri'

const tabs = [
  { to: '/',         label: 'Home',     Icon: RiHome4Line },
  { to: '/my-jobs',  label: 'Jobs',     Icon: RiBriefcase4Line },
  { to: '/earnings', label: 'Earnings', Icon: RiMoneyRupeeCircleLine },
  { to: '/profile',  label: 'Profile',  Icon: RiUserLine },
]

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 px-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]">
      <div className="bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-xl shadow-gray-200/80 border border-gray-100/80 flex items-center justify-around px-1.5 py-1.5">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-5 py-2 rounded-full transition-all ${
                isActive
                  ? 'bg-gradient-to-tr from-red-600 to-amber-500 text-white shadow-md shadow-red-200/60'
                  : 'text-gray-400'
              }`
            }>
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
