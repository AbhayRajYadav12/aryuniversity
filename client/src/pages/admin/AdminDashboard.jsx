import { useEffect, useState } from 'react';
import {
  BookOpen,
  Users,
  Lock,
  KeyRound,
  BookMarked,
  ShieldOff,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../../api/client';

const COLORS = ['#0b5fff', '#0369a1', '#0ea5e9', '#1d4ed8', '#38bdf8', '#1e3a8a'];

const statMeta = [
  { key: 'totalBooks', label: 'Total Digital Books', icon: BookOpen, tone: 'bg-blue-50 text-blue-700' },
  { key: 'totalStudents', label: 'Registered Students', icon: Users, tone: 'bg-sky-50 text-sky-700' },
  { key: 'encryptedDocuments', label: 'Encrypted Documents', icon: Lock, tone: 'bg-indigo-50 text-indigo-700' },
  { key: 'activePermissions', label: 'Active Access Permissions', icon: KeyRound, tone: 'bg-emerald-50 text-emerald-700' },
  { key: 'totalReadingSessions', label: 'Reading Sessions', icon: BookMarked, tone: 'bg-cyan-50 text-cyan-700' },
  { key: 'unauthorizedAccessAttempts', label: 'Blocked Unauthorized Requests', icon: ShieldOff, tone: 'bg-rose-50 text-rose-700' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/admin/stats')
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-brand-100/60 rounded w-64" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 card-panel" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-brand-900">Administrator Overview</h1>
        <p className="text-brand-900/55 mt-1">
          Live metrics from ARY University&apos;s secure JSON-backed library.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statMeta.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="card-panel p-5 flex items-start gap-4 hover:-translate-y-0.5 transition">
            <div className={`rounded-xl p-3 ${tone}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-brand-900/55">{label}</p>
              <p className="text-2xl font-semibold mt-1">{stats[key]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-panel p-5">
          <h2 className="font-semibold mb-4">Document access activity (7 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.charts?.accessByDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="access" stroke="#0b5fff" fill="#0b5fff33" name="Access" />
                <Area type="monotone" dataKey="denied" stroke="#e11d48" fill="#e11d4833" name="Denied" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-panel p-5">
          <h2 className="font-semibold mb-4">Encryption activity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts?.encryptionByDay || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="encrypted" fill="#0369a1" radius={[8, 8, 0, 0]} name="Encrypted" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-panel p-5">
          <h2 className="font-semibold mb-4">Document category distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.charts?.categories || []}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {(stats.charts?.categories || []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-panel p-5">
          <h2 className="font-semibold mb-4">Recent activity timeline</h2>
          <ul className="space-y-3 max-h-64 overflow-auto">
            {(stats.recentActivities || []).map((log) => (
              <li key={log.id} className="border-b border-brand-50 pb-3 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                    {log.type}
                  </span>
                  <span className="text-[11px] text-brand-900/40">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-brand-900/75 mt-1">{log.message}</p>
              </li>
            ))}
            {!stats.recentActivities?.length && (
              <li className="text-sm text-brand-900/50">No activity yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
