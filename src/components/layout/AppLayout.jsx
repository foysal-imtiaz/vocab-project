import { useState } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, GraduationCap,
  RotateCcw, Trophy, LogOut, Menu, X, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vocabulary',  icon: BookOpen,         label: 'Vocabulary' },
  { to: '/learn',       icon: GraduationCap,    label: 'Learn' },
  { to: '/review',      icon: RotateCcw,        label: 'Review' },
  { to: '/leaderboard', icon: Trophy,           label: 'Leaderboard' },
]

/* Avatar — handles broken Google profile images via referrerPolicy + onError */
function UserAvatar({ url, name, className = 'w-7 h-7 text-xs' }) {
  const [broken, setBroken] = useState(false)
  const initial = (name || 'U')[0].toUpperCase()

  if (url && !broken) {
    return (
      <img
        src={url}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${className} rounded-full object-cover flex-shrink-0`}
      />
    )
  }
  return (
    <div className={`${className} rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0`}>
      <span className="text-brand-700 font-semibold">{initial}</span>
    </div>
  )
}

export default function AppLayout({ children }) {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const avatar = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 fixed h-full z-20">
        <Link
          to="/dashboard"
          className="px-5 py-5 border-b border-gray-100 flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-display font-bold text-sm">V</span>
          </div>
          <span className="font-display font-bold text-gray-900 text-base">ShobdoKosh</span>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 group ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'} />
                  {label}
                  {isActive && <ChevronRight size={12} className="ml-auto text-brand-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <UserAvatar url={avatar} name={name} className="w-7 h-7 text-xs" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center items-center gap-2.5 px-3 py-2 mt-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-150"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
            <span className="text-white font-display font-bold text-xs">V</span>
          </div>
          <span className="font-display font-bold text-gray-900 text-sm">ShobdoKosh</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 bg-white h-full flex flex-col shadow-xl animate-slide-down">
            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
                  <span className="text-white font-display font-bold text-xs">V</span>
                </div>
                <span className="font-display font-bold text-gray-900">ShobdoKosh</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="px-3 py-4 border-t border-gray-100">
              <div className="flex items-center gap-2.5 px-2 mb-3">
                <UserAvatar url={avatar} name={name} className="w-7 h-7 text-xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
