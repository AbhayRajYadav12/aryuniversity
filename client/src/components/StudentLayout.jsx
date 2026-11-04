import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  BookMarked,
  History,
  UserRound,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AryLogo from './AryLogo';

const links = [
  { to: '/student', end: true, label: 'My Dashboard', icon: LayoutDashboard },
  { to: '/student/catalog', label: 'Explore Library', icon: Search },
  { to: '/student/books', label: 'My Books', icon: BookMarked },
  { to: '/student/history', label: 'Reading History', icon: History },
  { to: '/student/profile', label: 'My Profile', icon: UserRound },
  { to: '/student/security', label: 'Security Information', icon: Shield },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="hidden md:flex w-64 shrink-0 bg-white border-r border-brand-100 flex-col">
        <div className="px-5 py-5 border-b border-brand-50">
          <AryLogo size="sm" />
          <p className="text-[11px] text-brand-900/45 mt-2 uppercase tracking-wide">
            Student Portal
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-soft'
                    : 'text-brand-900/70 hover:bg-brand-50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-50">
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-xs text-brand-900/50 truncate mb-3">{user?.studentId}</p>
          <button type="button" className="btn-secondary w-full" onClick={logout}>
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-brand-100 px-4 py-3 flex items-center justify-between">
          <AryLogo size="sm" />
          <button type="button" className="btn-secondary" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </button>
        </header>
        <nav className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 bg-white border-b border-brand-50">
          {links.map(({ to, end, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  isActive ? 'bg-brand-50 text-brand-600' : 'text-brand-900/55'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
