import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/admin/audit-logs?limit=200')
      .then((d) => setLogs(d.logs))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Security logs</h1>
        <p className="text-brand-900/55 mt-1">
          Append-only style audit trail stored in audit-logs.json.
        </p>
      </div>

      <div className="card-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-50/80 text-left">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-brand-50 align-top">
                <td className="px-4 py-3 text-xs whitespace-nowrap text-brand-900/50">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    {log.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-brand-900/80">{log.message}</td>
              </tr>
            ))}
            {!logs.length && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-brand-900/50">
                  No logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
