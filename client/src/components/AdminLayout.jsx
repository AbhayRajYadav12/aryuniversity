import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  Users,
  KeyRound,
  FileKey2,
  Shield,
  ScrollText,
  Settings,
  LogOut,
  FlaskConical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AryLogo from './AryLogo';

const links = [
  { to: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/books', label: 'Digital Books', icon: BookOpen },
  { to: '/admin/upload', label: 'Upload Documents', icon: Upload },
  { to: '/admin/students', label: 'Student Management', icon: Users },
  { to: '/admin/permissions', label: 'Access Permissions', icon: KeyRound },
  { to: '/admin/encryption', label: 'Encryption Center', icon: FileKey2 },
  { to: '/admin/monitoring', label: 'Security Monitoring', icon: Shield },
  { to: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
  { to: '/admin/security-lab', label: 'Security Testing Lab', icon: FlaskConical },
  { to: '/admin/settings', label: 'System Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-surface">
      <aside className="w-72 shrink-0 bg-white border-r border-brand-100 flex flex-col">
        <div className="px-5 py-5 border-b border-brand-50">
          <AryLogo size="sm" />
          <p className="text-[11px] text-brand-900/45 mt-2 uppercase tracking-wide">
            Administrator Portal
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-auto">
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
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-50">
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <p className="text-xs text-brand-900/50 truncate mb-3">{user?.email}</p>
          <button type="button" className="btn-secondary w-full" onClick={logout}>
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
