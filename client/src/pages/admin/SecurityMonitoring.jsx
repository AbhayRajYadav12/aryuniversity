import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';

const SEVERITY = {
  INTEGRITY_VERIFICATION_FAILED: 'critical',
  TAMPER_DETECTED: 'critical',
  UNAUTHORIZED_ACCESS: 'high',
  ACCESS_DENIED: 'high',
  LOGIN_FAILED: 'medium',
  SESSION_EXPIRED: 'medium',
  DOCUMENT_ACCESSED: 'info',
  DECRYPT_OK: 'info',
  USER_LOGIN: 'info',
  USER_LOGOUT: 'info',
  PDF_UPLOADED: 'info',
  DOCUMENT_ENCRYPTED: 'info',
  PERMISSION_GRANTED: 'info',
  PERMISSION_REVOKED: 'medium',
};

export default function SecurityMonitoring() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([api('/api/admin/stats'), api('/api/admin/audit-logs?limit=300')])
      .then(([s, l]) => {
        setStats(s);
        setLogs(l.logs || []);
      })
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return logs;
    return logs.filter(
      (l) =>
        String(l.type).toLowerCase().includes(needle) ||
        String(l.message || '').toLowerCase().includes(needle) ||
        String(l.userId || '').includes(needle) ||
        String(l.bookId || '').includes(needle)
    );
  }, [logs, q]);

  const se = stats?.securityEvents || {};

  const cards = [
    ['Total access attempts', se.totalAccessAttempts],
    ['Successful document access', se.successfulAccess],
    ['Blocked unauthorized', se.blockedUnauthorized],
    ['Expired access attempts', se.expiredAttempts],
    ['Revoked permission attempts', se.revokedAttempts],
    ['Integrity failures', se.integrityFailures],
    ['Suspicious login activity', se.loginFailures],
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Security Monitoring Center</h1>
          <p className="text-brand-900/55 mt-1">
            Live metrics and searchable audit timeline from audit-logs.json (auto-refresh 15s).
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={load}>
          Refresh now
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(([label, value]) => (
          <div key={label} className="card-panel p-4">
            <p className="text-xs text-brand-900/50">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="card-panel p-4">
        <input
          className="input"
          placeholder="Search events, user ID, document ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="card-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/80 text-left">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Result</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => {
              const sev = SEVERITY[log.type] || 'info';
              return (
                <tr key={log.id} className="border-t border-brand-50 align-top">
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-brand-900/50">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-xs uppercase text-brand-600">
                    {log.type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        sev === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : sev === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : sev === 'medium'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-brand-50 text-brand-700'
                      }`}
                    >
                      {sev}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px]">{log.userId || log.actorId || '—'}</td>
                  <td className="px-4 py-3 font-mono text-[11px]">{log.bookId || '—'}</td>
                  <td className="px-4 py-3 text-brand-900/80">{log.message}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
